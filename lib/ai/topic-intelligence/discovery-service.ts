/**
 * Topic Discovery orchestration.
 * Never auto-writes or auto-publishes. Never invents search volume / trend %.
 */

import type {
  TopicDiscoveryMode,
  TopicSeedType,
  Prisma,
} from "@prisma/client";
import { prisma, hasDatabaseUrl } from "@/lib/db";
import { getOrCreateSettings } from "@/lib/ai/editorial-service";
import { buildContentIndex } from "@/lib/ai/topic-intelligence/content-index";
import { buildCommercialCoverageMap } from "@/lib/ai/topic-intelligence/coverage-map";
import { clusterSignals } from "@/lib/ai/topic-intelligence/clustering";
import {
  analyzeClusterToOpportunity,
  limitOpportunityAngles,
} from "@/lib/ai/topic-intelligence/opportunity-analysis";
import { planDiscoveryQueries } from "@/lib/ai/topic-intelligence/query-plan";
import {
  getProvidersForCapability,
  getDiscoveryProviderStatus,
  manualSignalProvider,
} from "@/lib/ai/topic-intelligence/providers";
import type { NormalizedTopicSignal } from "@/lib/ai/topic-intelligence/types";
import { fingerprintSignal, clusterKeyForSignal } from "@/lib/ai/topic-intelligence/types";
import {
  TopicSignalProviderUnavailableError,
} from "@/lib/ai/topic-intelligence/providers/types";
import { writeAuditLog } from "@/lib/repositories/auditRepository";

export type RunDiscoveryInput = {
  actorId: string;
  seedText: string;
  mode?: TopicDiscoveryMode;
  market?: string;
  industry?: string;
  freshnessPreference?: string;
  commercialGoal?: string;
  sourcePreference?: string;
  watchlistId?: string;
  seedType?: TopicSeedType;
  forceRefresh?: boolean;
};

function asStringArray(json: unknown): string[] {
  if (!Array.isArray(json)) return [];
  return json.filter((x): x is string => typeof x === "string");
}

export async function recoverStaleDiscoveryRuns(staleMinutes = 30): Promise<number> {
  if (!hasDatabaseUrl()) return 0;
  const cutoff = new Date(Date.now() - Math.max(5, staleMinutes) * 60_000);
  const result = await prisma.topicDiscoveryRun.updateMany({
    where: {
      status: "RUNNING",
      startedAt: { lt: cutoff },
    },
    data: {
      status: "FAILED",
      completedAt: new Date(),
      errorCode: "TIMEOUT",
      errorSummary: "Discovery run marked stale after exceeding running time threshold.",
    },
  });
  return result.count;
}

export async function runTopicDiscovery(input: RunDiscoveryInput) {
  if (!hasDatabaseUrl()) throw new Error("Database required for Topic Discovery");

  await recoverStaleDiscoveryRuns();

  if (input.watchlistId) {
    const active = await prisma.topicDiscoveryRun.findFirst({
      where: {
        watchlistId: input.watchlistId,
        status: { in: ["QUEUED", "RUNNING"] },
      },
    });
    if (active) {
      throw new Error("A discovery scan is already running for this Watchlist.");
    }
  }

  const settings = await getOrCreateSettings();
  const maxQueries = settings.maxDiscoveryQueries ?? 6;
  const maxPerSource = settings.maxDiscoveryResultsPerSource ?? 8;
  const maxProviderCalls = settings.maxDiscoveryProviderCalls ?? 20;

  const seed = await prisma.topicSeed.create({
    data: {
      text: input.seedText.trim(),
      seedType: input.seedType || "TOPIC",
      market: input.market || "global_en",
      industry: input.industry || null,
      watchlistId: input.watchlistId || null,
      createdById: input.actorId,
    },
  });

  const run = await prisma.topicDiscoveryRun.create({
    data: {
      watchlistId: input.watchlistId || null,
      mode: input.mode || "MIXED",
      status: "QUEUED",
      seedText: input.seedText.trim(),
      market: input.market || "global_en",
      industry: input.industry || null,
      freshnessPreference: input.freshnessPreference || null,
      commercialGoal: input.commercialGoal || null,
      sourcePreference: input.sourcePreference || null,
      forceRefresh: Boolean(input.forceRefresh),
      createdById: input.actorId,
    },
  });

  let providerCalls = 0;
  const providersUsed: string[] = [];
  const providerErrors: string[] = [];

  try {
    await prisma.topicDiscoveryRun.update({
      where: { id: run.id },
      data: { status: "RUNNING", startedAt: new Date() },
    });

    const pack = input.watchlistId
      ? await prisma.topicWatchlist.findUnique({
          where: { id: input.watchlistId },
          include: { sourcePack: true },
        })
      : null;

    const packOpts = pack?.sourcePack
      ? {
          keywords: asStringArray(pack.sourcePack.keywordsJson),
          officialDomains: asStringArray(pack.sourcePack.officialDomainsJson),
          rssFeeds: asStringArray(pack.sourcePack.rssFeedsJson),
          newsQueries: asStringArray(pack.sourcePack.newsQueriesJson),
          excludedDomains: asStringArray(pack.sourcePack.excludedDomainsJson),
        }
      : undefined;

    const queries = planDiscoveryQueries(input.seedText, maxQueries);
    const mode = input.mode || "MIXED";
    const collected: NormalizedTopicSignal[] = [];

    // Always include manual seed signal
    const manualSignals = await manualSignalProvider.search({
      query: input.seedText,
      market: input.market,
      maxResults: 2,
    });
    collected.push(...manualSignals);
    providersUsed.push("manual");

    const wantWeb =
      mode === "MIXED" ||
      mode === "EXPLORE_SUGGESTION" ||
      mode === "NEWS" ||
      mode === "INDUSTRY" ||
      mode === "PLATFORMS" ||
      mode === "TRENDS";
    const wantNews = mode === "MIXED" || mode === "NEWS";
    const wantRss = mode === "MIXED" || mode === "INDUSTRY" || mode === "PLATFORMS";
    const wantTrends = mode === "MIXED" || mode === "TRENDS";
    const wantGaps = mode === "MIXED" || mode === "SITE_GAPS" || mode === "EXISTING_CONTENT";

    async function callProvider(
      capability: "WEB_SEARCH" | "NEWS" | "RSS" | "TRENDS",
      query: string,
    ) {
      if (providerCalls >= maxProviderCalls) return;
      const providers = getProvidersForCapability(capability);
      for (const p of providers) {
        if (providerCalls >= maxProviderCalls) break;
        // For NEWS capability, prefer dedicated news; skip tavily duplicate if dedicated exists
        if (capability === "NEWS" && p.id === "tavily" && providers.some((x) => x.id !== "tavily")) {
          continue;
        }
        providerCalls += 1;
        if (!providersUsed.includes(p.id)) providersUsed.push(p.id);
        try {
          const results = await p.search({
            query,
            market: input.market,
            maxResults: maxPerSource,
            forceRefresh: input.forceRefresh,
            pack: packOpts,
          });
          collected.push(...results);
        } catch (e) {
          const msg =
            e instanceof TopicSignalProviderUnavailableError
              ? e.message
              : e instanceof Error
                ? e.message
                : "Provider error";
          providerErrors.push(`${p.id}: ${msg}`);
          // No endless retry on 429
          if (/429|rate limit/i.test(msg)) break;
        }
      }
    }

    for (const q of queries) {
      if (wantWeb) await callProvider("WEB_SEARCH", q);
      if (wantNews) await callProvider("NEWS", q);
    }
    if (wantRss && packOpts?.rssFeeds?.length) {
      await callProvider("RSS", input.seedText);
    }
    if (wantTrends) {
      await callProvider("TRENDS", input.seedText);
    }

    // Internal gap signals (no external API)
    const index = await buildContentIndex();
    const coverage = buildCommercialCoverageMap(index);
    if (wantGaps) {
      const weak = coverage.filter((c) => c.gapLevel === "none" || c.gapLevel === "weak").slice(0, 5);
      for (const row of weak) {
        collected.push({
          provider: "internal",
          type: "CONTENT_GAP",
          title: `Coverage gap: ${row.title}`,
          summary: `${row.entityType} has ${row.insightCount} Insights and ${row.resourceCount} resources (recent: ${row.recentInsightCount}).`,
          market: input.market,
          language: "en",
          sourceAuthorityType: "PRIMARY",
          freshness: "EVERGREEN",
          topics: row.relatedTopics,
          provenance: {
            capability: "MANUAL",
            label: "Internal content analysis",
          },
        });
      }
    }

    const clusters = clusterSignals(collected);
    const drafts = limitOpportunityAngles(
      clusters
        .map((cluster) =>
          analyzeClusterToOpportunity({
            cluster,
            seedText: input.seedText,
            market: input.market,
            index,
            coverage,
          }),
        )
        .filter(Boolean) as NonNullable<
        ReturnType<typeof analyzeClusterToOpportunity>
      >[],
      5,
    );

    // Persist signals
    let signalsFound = 0;
    for (const s of collected) {
      const fp = fingerprintSignal({
        title: s.title,
        sourceUrl: s.sourceUrl,
        publishedAt: s.publishedAt,
        provider: s.provider,
      });
      try {
        await prisma.topicSignal.upsert({
          where: { fingerprint: fp },
          create: {
            runId: run.id,
            provider: s.provider,
            type: s.type,
            title: s.title.slice(0, 500),
            summary: s.summary?.slice(0, 2000) || null,
            sourceUrl: s.sourceUrl || null,
            sourceDomain: s.sourceDomain || null,
            publishedAt: s.publishedAt || null,
            market: s.market || input.market || null,
            language: s.language || "en",
            entitiesJson: s.entities || [],
            topicsJson: s.topics || [],
            rawProviderId: s.rawProviderId || null,
            sourceAuthorityType: s.sourceAuthorityType,
            freshness: s.freshness,
            status: "ACTIVE",
            fingerprint: fp,
            clusterKey: clusterKeyForSignal(s),
            provenanceJson: s.provenance as unknown as Prisma.InputJsonValue,
          },
          update: {
            runId: run.id,
            summary: s.summary?.slice(0, 2000) || null,
            status: "ACTIVE",
          },
        });
        signalsFound += 1;
      } catch {
        // unique race — ignore
      }
    }

    let opportunitiesCreated = 0;
    for (const draft of drafts) {
      const existing = await prisma.editorialOpportunity.findFirst({
        where: {
          mergeKey: draft.mergeKey,
          status: { notIn: ["ARCHIVED"] },
        },
      });

      if (existing) {
        await prisma.editorialOpportunity.update({
          where: { id: existing.id },
          data: {
            supportingSignalsJson: draft.signalTitles,
            evidenceCount: (existing.evidenceCount || 0) + 1,
            recurringSignal: true,
            whyNow: draft.whyNow,
            sourceSummaryJson: {
              providersUsed,
              providerErrors,
              clusterTitles: draft.signalTitles,
            },
            runId: run.id,
            seedId: seed.id,
          },
        });
        continue;
      }

      // Suppress if previously rejected with same mergeKey
      const rejected = await prisma.editorialOpportunity.findFirst({
        where: { mergeKey: draft.mergeKey, status: "REJECTED" },
      });
      if (rejected) continue;

      await prisma.editorialOpportunity.create({
        data: {
          workingTitle: draft.workingTitle,
          coreTopic: draft.coreTopic,
          question: draft.question || null,
          status: "NEW",
          recommendation: draft.recommendation,
          aiOriginalRecommendation: draft.recommendation,
          intent: draft.intent || null,
          audience: draft.audience || null,
          market: draft.market || input.market || "global_en",
          timeliness: draft.timeliness,
          evergreenPotential: draft.evergreenPotential,
          commercialRelationship: draft.commercialRelationship || null,
          uniqueValue: draft.uniqueValue || null,
          reasonToExist: draft.reasonToExist || null,
          whyNow: draft.whyNow || null,
          whySmartlance: draft.whySmartlance || null,
          existingContentJson: draft.existingContent,
          supportingSignalsJson: draft.signalTitles,
          sourceSummaryJson: {
            providersUsed,
            providerErrors,
            searchVolume: "Not available",
            trendData: "Trend data unavailable",
          },
          suggestedServicesJson: draft.suggestedServices,
          suggestedSolutionsJson: draft.suggestedSolutions,
          suggestedPlatformsJson: draft.suggestedPlatforms,
          suggestedResourcesJson: draft.suggestedResources,
          suggestedFormat: draft.suggestedFormat,
          suggestedCta: draft.suggestedCta || null,
          dimensionsJson: draft.dimensions,
          badge: draft.badge,
          higherFactualReview: draft.higherFactualReview,
          mergeKey: draft.mergeKey,
          evidenceCount: draft.signalTitles.length,
          seedId: seed.id,
          runId: run.id,
        },
      });
      opportunitiesCreated += 1;
    }

    await prisma.topicSeed.update({
      where: { id: seed.id },
      data: { analyzedAt: new Date() },
    });

    if (input.watchlistId) {
      await prisma.topicWatchlist.update({
        where: { id: input.watchlistId },
        data: { lastScanAt: new Date() },
      });
    }

    await prisma.topicDiscoveryRun.update({
      where: { id: run.id },
      data: {
        status: "SUCCEEDED",
        completedAt: new Date(),
        providersUsedJson: providersUsed,
        signalsFound,
        clustersCreated: clusters.length,
        opportunitiesCreated,
        providerCalls,
        errorSummary: providerErrors.length ? providerErrors.join("; ").slice(0, 1000) : null,
      },
    });

    await writeAuditLog({
      actorId: input.actorId,
      action: "topic_discovery.completed",
      entityType: "TopicDiscoveryRun",
      entityId: run.id,
      metadata: {
        signalsFound,
        opportunitiesCreated,
        providersUsed,
        mode,
      },
    });

    return {
      runId: run.id,
      seedId: seed.id,
      signalsFound,
      clustersCreated: clusters.length,
      opportunitiesCreated,
      providersUsed,
      providerErrors,
      providerStatus: await getDiscoveryProviderStatus(),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Discovery failed";
    await prisma.topicDiscoveryRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        errorCode: "DISCOVERY_FAILED",
        errorSummary: msg.slice(0, 1000),
        providerCalls,
        providersUsedJson: providersUsed,
      },
    });
    throw e;
  }
}

export { getDiscoveryProviderStatus };
