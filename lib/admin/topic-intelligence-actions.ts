"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type {
  TopicDiscoveryMode,
  TopicRejectionReason,
  TopicSeedType,
  TopicPriority,
  TopicRecommendation,
  TopicEditorialFeedback,
} from "@prisma/client";
import { assertSameOrigin, requireAdminUser } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { runTopicDiscovery } from "@/lib/ai/topic-intelligence/discovery-service";
import { convertOpportunityToProject } from "@/lib/ai/topic-intelligence/handoff";
import {
  ensureDefaultSourcePacks,
  getOrCreateTopicStrategy,
} from "@/lib/ai/topic-intelligence/strategy";
import { writeAuditLog } from "@/lib/repositories/auditRepository";
import { assertPublicHttpUrl } from "@/lib/ai/ssrf";

function revalidateDiscovery(id?: string) {
  revalidatePath("/admin/ai-writer/discover");
  revalidatePath("/admin/ai-writer/source-packs");
  revalidatePath("/admin/ai-writer/watchlists");
  revalidatePath("/admin/system");
  if (id) revalidatePath(`/admin/ai-writer/discover/${id}`);
}

export async function ensureDiscoveryDefaultsAction() {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_ai_settings");
  await ensureDefaultSourcePacks(user.id);
  await getOrCreateTopicStrategy();
  revalidateDiscovery();
}

export async function runDiscoveryAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("use_ai_writer");
  const seedText = String(formData.get("seedText") || "").trim();
  if (!seedText) throw new Error("Enter something to explore.");

  const result = await runTopicDiscovery({
    actorId: user.id,
    seedText,
    mode: (String(formData.get("mode") || "MIXED") as TopicDiscoveryMode) || "MIXED",
    market: String(formData.get("market") || "global_en") || "global_en",
    industry: String(formData.get("industry") || "") || undefined,
    freshnessPreference: String(formData.get("freshness") || "") || undefined,
    commercialGoal: String(formData.get("commercialGoal") || "") || undefined,
    sourcePreference: String(formData.get("sourcePreference") || "") || undefined,
    seedType: (String(formData.get("seedType") || "TOPIC") as TopicSeedType) || "TOPIC",
    forceRefresh: String(formData.get("forceRefresh")) === "on",
    watchlistId: String(formData.get("watchlistId") || "") || undefined,
  });

  revalidateDiscovery();
  redirect(`/admin/ai-writer/discover?run=${result.runId}&created=${result.opportunitiesCreated}`);
}

export async function bulkImportSeedsAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("use_ai_writer");
  const raw = String(formData.get("seeds") || "");
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 50);
  for (const text of lines) {
    await prisma.topicSeed.create({
      data: {
        text,
        seedType: "TOPIC",
        market: "global_en",
        createdById: user.id,
      },
    });
  }
  revalidateDiscovery();
  redirect(`/admin/ai-writer/discover?seeds=${lines.length}`);
}

export async function analyzeSeedAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("use_ai_writer");
  const seedId = String(formData.get("seedId") || "");
  const seed = await prisma.topicSeed.findUnique({ where: { id: seedId } });
  if (!seed) throw new Error("Seed not found");
  const result = await runTopicDiscovery({
    actorId: user.id,
    seedText: seed.text,
    market: seed.market || "global_en",
    industry: seed.industry || undefined,
    seedType: seed.seedType,
    watchlistId: seed.watchlistId || undefined,
  });
  revalidateDiscovery();
  redirect(`/admin/ai-writer/discover?run=${result.runId}`);
}

export async function scanWatchlistAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("use_ai_writer");
  const watchlistId = String(formData.get("watchlistId") || "");
  const wl = await prisma.topicWatchlist.findUnique({ where: { id: watchlistId } });
  if (!wl) throw new Error("Watchlist not found");
  const keywords = Array.isArray(wl.keywordsJson)
    ? (wl.keywordsJson as string[]).slice(0, 3)
    : [];
  const seedText = keywords[0] || wl.name;
  const result = await runTopicDiscovery({
    actorId: user.id,
    seedText,
    mode: "MIXED",
    watchlistId,
    market: "global_en",
  });
  revalidateDiscovery();
  redirect(`/admin/ai-writer/discover?run=${result.runId}`);
}

export async function updateOpportunityStatusAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("use_ai_writer");
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  const rejectionReason = String(formData.get("rejectionReason") || "") as TopicRejectionReason;
  const rejectionNote = String(formData.get("rejectionNote") || "") || null;
  const priority = String(formData.get("priority") || "") as TopicPriority;
  const pinned = String(formData.get("pinned")) === "on";
  const recommendation = String(formData.get("recommendation") || "") as TopicRecommendation;
  const humanDecisionNote = String(formData.get("humanDecisionNote") || "").trim() || null;
  const editorialFeedback = String(formData.get("editorialFeedback") || "") as TopicEditorialFeedback;
  const editorialFeedbackNote =
    String(formData.get("editorialFeedbackNote") || "").trim() || null;

  const existing = await prisma.editorialOpportunity.findUnique({ where: { id } });
  if (!existing) throw new Error("Opportunity not found");

  const data: Record<string, unknown> = {
    reviewedById: user.id,
    reviewedAt: new Date(),
  };
  if (status) data.status = status;
  if (rejectionReason) data.rejectionReason = rejectionReason;
  if (rejectionNote !== null && formData.has("rejectionNote")) data.rejectionNote = rejectionNote;
  if (priority) data.priority = priority;
  if (formData.has("pinned")) data.pinned = pinned;
  if (formData.get("plannedFor")) {
    const d = new Date(String(formData.get("plannedFor")));
    if (!Number.isNaN(d.getTime())) data.plannedFor = d;
  }
  if (recommendation) {
    if (!existing.aiOriginalRecommendation) {
      data.aiOriginalRecommendation = existing.recommendation;
    }
    data.recommendation = recommendation;
  }
  if (formData.has("humanDecisionNote")) data.humanDecisionNote = humanDecisionNote;
  if (editorialFeedback) data.editorialFeedback = editorialFeedback;
  if (formData.has("editorialFeedbackNote")) {
    data.editorialFeedbackNote = editorialFeedbackNote;
  }

  await prisma.editorialOpportunity.update({ where: { id }, data });
  await writeAuditLog({
    actorId: user.id,
    action: "topic_opportunity.updated",
    entityType: "EditorialOpportunity",
    entityId: id,
    metadata: {
      status,
      rejectionReason,
      recommendation: recommendation || undefined,
      editorialFeedback: editorialFeedback || undefined,
    },
  });
  revalidateDiscovery(id);
  redirect(`/admin/ai-writer/discover/${id}`);
}

export async function convertOpportunityAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("use_ai_writer");
  const id = String(formData.get("id") || "");
  const force = String(formData.get("force")) === "on";
  const result = await convertOpportunityToProject({
    opportunityId: id,
    actorId: user.id,
    force,
  });
  revalidateDiscovery(id);
  redirect(`/admin/ai-writer/${result.projectId}`);
}

export async function saveSourcePackAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_ai_settings");
  const id = String(formData.get("id") || "");
  const slug = String(formData.get("slug") || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-");
  const name = String(formData.get("name") || "").trim();
  if (!slug || !name) throw new Error("Name and slug required");

  const lines = (key: string) =>
    String(formData.get(key) || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

  const rssFeeds = lines("rssFeeds");
  for (const feed of rssFeeds) {
    assertPublicHttpUrl(feed);
  }

  const payload = {
    slug,
    name,
    description: String(formData.get("description") || "") || null,
    enabled: String(formData.get("enabled")) === "on",
    priority: Number(formData.get("priority") || 50),
    market: String(formData.get("market") || "") || null,
    officialDomainsJson: lines("officialDomains"),
    rssFeedsJson: rssFeeds,
    keywordsJson: lines("keywords"),
    newsQueriesJson: lines("newsQueries"),
    excludedDomainsJson: lines("excludedDomains"),
    updatedById: user.id,
  };

  if (id) {
    await prisma.topicSourcePack.update({ where: { id }, data: payload });
  } else {
    await prisma.topicSourcePack.create({ data: payload });
  }
  revalidateDiscovery();
  redirect("/admin/ai-writer/source-packs");
}

export async function saveWatchlistAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_ai_settings");
  const id = String(formData.get("id") || "");
  const slug = String(formData.get("slug") || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-");
  const name = String(formData.get("name") || "").trim();
  if (!slug || !name) throw new Error("Name and slug required");

  const lines = (key: string) =>
    String(formData.get(key) || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

  const payload = {
    slug,
    name,
    description: String(formData.get("description") || "") || null,
    active: String(formData.get("active")) === "on",
    keywordsJson: lines("keywords"),
    sourcePackId: String(formData.get("sourcePackId") || "") || null,
    scheduleEnabled: false, // Manual scan only until durable cron exists
    scheduleCron: null as string | null,
    updatedById: user.id,
  };

  if (id) {
    await prisma.topicWatchlist.update({ where: { id }, data: payload });
  } else {
    await prisma.topicWatchlist.create({ data: payload });
  }
  revalidateDiscovery();
  redirect("/admin/ai-writer/watchlists");
}

export async function saveTopicStrategyAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_ai_settings");
  const lines = (key: string) =>
    String(formData.get(key) || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

  await prisma.topicStrategySettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      defaultMarket: String(formData.get("defaultMarket") || "global_en"),
      priorityThemesJson: lines("priorityThemes"),
      lowerPriorityThemesJson: lines("lowerPriorityThemes"),
      pausedTopicsJson: lines("pausedTopics"),
      notes: String(formData.get("notes") || "") || null,
    },
    update: {
      defaultMarket: String(formData.get("defaultMarket") || "global_en"),
      priorityThemesJson: lines("priorityThemes"),
      lowerPriorityThemesJson: lines("lowerPriorityThemes"),
      pausedTopicsJson: lines("pausedTopics"),
      notes: String(formData.get("notes") || "") || null,
    },
  });
  await writeAuditLog({
    actorId: user.id,
    action: "topic_strategy.updated",
    entityType: "TopicStrategySettings",
    entityId: "default",
    metadata: {},
  });
  revalidateDiscovery();
  redirect("/admin/ai-writer/discover?strategy=saved");
}

export async function testRssFeedAction(formData: FormData) {
  await assertSameOrigin();
  await requireAdminUser("manage_ai_settings");
  const url = String(formData.get("rssUrl") || "");
  assertPublicHttpUrl(url);
  const { rssSignalProvider } = await import("@/lib/ai/topic-intelligence/providers");
  const results = await rssSignalProvider.search({
    query: "test",
    pack: { rssFeeds: [url] },
    maxResults: 3,
    forceRefresh: true,
  });
  redirect(
    `/admin/ai-writer/source-packs?tested=1&count=${results.length}&feed=${encodeURIComponent(url)}`,
  );
}
