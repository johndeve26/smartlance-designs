/**
 * Provider-configured live spot check — proposals only (no apply/publish).
 *
 * Requires:
 * - Writing provider configured (Admin account or env)
 * - TAVILY_API_KEY or AI_RESEARCH_API_KEY in .env.local
 *
 * Usage: npx tsx scripts/run-provider-configured-spot-check.ts
 */

import { config as loadEnv } from "dotenv";
import { writeFileSync, mkdirSync } from "fs";
import { createContentProposal } from "@/lib/ai/content-assistants/proposals";
import type { ProposalPayload } from "@/lib/ai/content-assistants/types";
import { prisma } from "@/lib/db";
import {
  createAIProviderForRole,
  getAIProviderStatus,
} from "@/lib/ai/providers";
import {
  createResearchProvider,
  getResearchProviderStatus,
} from "@/lib/ai/research";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const ACTOR_EMAIL = "admin@smartlancedesigns.com";
const ARTIFACT = "docs/audit-artifacts/provider-configured-spot-check.json";

type ConfigCheck = {
  writing: {
    configured: boolean;
    providerId: string;
    model: string | null;
    apiKeyLast4: string | null;
    connectionTest: "ok" | "fail" | "skipped";
    connectionError?: string;
  };
  research: {
    configured: boolean;
    providerId: string;
    connectionTest: "ok" | "fail" | "skipped";
    connectionError?: string;
    resultCount?: number;
  };
};

async function verifyConfiguration(): Promise<{
  ok: boolean;
  check: ConfigCheck;
  blockReason?: string;
}> {
  const writingStatus = await getAIProviderStatus();
  const settings = await prisma.aIWriterSettings.findFirst({
    select: { writingProviderId: true, writingModel: true },
  });
  const writingId = settings?.writingProviderId || writingStatus.providerId;
  const account = await prisma.aIProviderAccount.findUnique({
    where: { providerId: writingId },
    select: { apiKeyLast4: true },
  });
  const writer = await createAIProviderForRole("WRITING_MODEL");
  const researchStatus = getResearchProviderStatus();
  const research = createResearchProvider();
  const tavilyConfigured =
    researchStatus.configured &&
    research.id === "tavily" &&
    research.isConfigured();

  const check: ConfigCheck = {
    writing: {
      configured: writer.isConfigured(),
      providerId: writer.id,
      model: settings?.writingModel || null,
      apiKeyLast4: account?.apiKeyLast4 || null,
      connectionTest: "skipped",
    },
    research: {
      configured: tavilyConfigured,
      providerId: research.id,
      connectionTest: "skipped",
    },
  };

  if (writer.isConfigured()) {
    try {
      const ping = await writer.generateText({
        modelRole: "FAST_MODEL",
        maxTokens: 8,
        temperature: 0,
        messages: [{ role: "user", content: "Reply ok" }],
      });
      check.writing.connectionTest = ping.text?.trim() ? "ok" : "fail";
      if (!ping.text?.trim()) {
        check.writing.connectionError = "empty response";
      }
    } catch (err) {
      check.writing.connectionTest = "fail";
      check.writing.connectionError =
        err instanceof Error ? err.message.slice(0, 200) : "connection failed";
    }
  }

  if (tavilyConfigured) {
    try {
      const results = await research.search({
        query: "WordPress official documentation site:wordpress.org",
        maxResults: 3,
      });
      check.research.connectionTest = results.length > 0 ? "ok" : "fail";
      check.research.resultCount = results.length;
      if (!results.length) {
        check.research.connectionError = "no results returned";
      }
    } catch (err) {
      check.research.connectionTest = "fail";
      check.research.connectionError =
        err instanceof Error ? err.message.slice(0, 200) : "search failed";
    }
  }

  if (!writer.isConfigured()) {
    return {
      ok: false,
      check,
      blockReason:
        "Writing provider not configured. Set an Admin AI provider account or env fallback key.",
    };
  }
  if (check.writing.connectionTest === "fail") {
    return {
      ok: false,
      check,
      blockReason: `Writing provider connection failed: ${check.writing.connectionError}`,
    };
  }
  if (!tavilyConfigured) {
    return {
      ok: false,
      check,
      blockReason:
        "Tavily not configured. Set TAVILY_API_KEY or AI_RESEARCH_API_KEY in .env.local (server secret — not committed).",
    };
  }
  if (check.research.connectionTest === "fail") {
    return {
      ok: false,
      check,
      blockReason: `Tavily connection failed: ${check.research.connectionError}`,
    };
  }

  return { ok: true, check };
}

function payloadOf(proposal: { payloadJson: unknown }): ProposalPayload {
  return proposal.payloadJson as ProposalPayload;
}

async function runLiveTargets(actorId: string) {
  const wordpress = await prisma.platform.findFirst({ where: { slug: "wordpress" } });
  const industry = await prisma.industry.findFirst({
    where: { slug: "short-term-rentals" },
  });
  const service = await prisma.service.findFirst({
    where: { slug: "website-redesign" },
  });
  if (!wordpress || !industry || !service) {
    throw new Error("Missing CMS targets for spot check");
  }

  const results: Array<Record<string, unknown>> = [];

  async function runOne(input: {
    entityType: "PLATFORM" | "INDUSTRY" | "SERVICE";
    entityId: string;
    action: string;
    label: string;
  }) {
    const started = Date.now();
    const proposal = await createContentProposal({
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      actorId,
      forceHeuristic: false,
    });
    const run = proposal.runId
      ? await prisma.aIContentRun.findUnique({ where: { id: proposal.runId } })
      : null;
    const payload = payloadOf(proposal);
    const durationMs = Date.now() - started;
    const livePath =
      run?.provider &&
      run.provider !== "heuristic" &&
      run.provider !== "heuristic-fallback" &&
      !run.provider.startsWith("heuristic");

    results.push({
      target: input.label,
      action: input.action,
      proposalId: proposal.id,
      runId: proposal.runId,
      promptVersion: proposal.promptVersion,
      provider: run?.provider,
      model: run?.model,
      livePath,
      durationMs,
      tokenUsageInput: run?.tokenUsageInput,
      tokenUsageOutput: run?.tokenUsageOutput,
      resultMode: payload.resultMode,
      fieldCount: payload.fields?.length ?? 0,
      fields: (payload.fields || []).map((f) => f.field),
      research: payload.research
        ? {
            performed: payload.research.performed,
            sourceCount: payload.research.sourceCount,
            officialOrPrimaryCount: payload.research.officialOrPrimaryCount,
            sources: (payload.research.sources || []).slice(0, 8).map((s) => ({
              url: s.url,
              title: s.title,
              domain: s.domain,
              sourceType: s.sourceType,
              checkedAt: s.checkedAt,
            })),
          }
        : undefined,
      claims: (payload.claims || []).slice(0, 12).map((c) => ({
        kind: c.kind,
        support: c.support,
        field: c.field,
      })),
      suggestedRelations: payload.suggestedRelations?.map((r) => ({
        kind: r.kind,
        slug: r.slug,
        title: r.title,
        reason: r.reason,
      })),
    });
  }

  await runOne({
    entityType: "PLATFORM",
    entityId: wordpress.id,
    action: "RESEARCH_AND_IMPROVE",
    label: "WordPress",
  });
  await runOne({
    entityType: "INDUSTRY",
    entityId: industry.id,
    action: "IMPROVE_INDUSTRY",
    label: "Short-Term Rentals",
  });
  await runOne({
    entityType: "SERVICE",
    entityId: service.id,
    action: "SUGGEST_RELATIONSHIPS",
    label: "Website Redesign (relations)",
  });
  await runOne({
    entityType: "SERVICE",
    entityId: service.id,
    action: "IMPROVE_SERVICE",
    label: "Website Redesign (improve)",
  });

  return results;
}

async function main() {
  const actor = await prisma.adminUser.findFirst({
    where: { email: ACTOR_EMAIL },
  });
  if (!actor) throw new Error(`Actor ${ACTOR_EMAIL} not found`);

  const verification = await verifyConfiguration();
  const artifact: Record<string, unknown> = {
    generatedAt: new Date().toISOString(),
    mode: verification.ok ? "LIVE_SPOT_CHECK" : "CONFIGURATION_BLOCKED",
    configuration: verification.check,
    blockReason: verification.blockReason || null,
    writingStatusSummary: (await getAIProviderStatus()).label,
    researchStatusSummary: getResearchProviderStatus().label,
    liveRuns: verification.ok ? await runLiveTargets(actor.id) : [],
    cmsUnchangedNote:
      "Proposals only — no apply, draft save, or publish performed by this script.",
  };

  mkdirSync("docs/audit-artifacts", { recursive: true });
  writeFileSync(ARTIFACT, JSON.stringify(artifact, null, 2));
  console.log(JSON.stringify(artifact, null, 2));
  await prisma.$disconnect();

  if (!verification.ok) {
    process.exit(2);
  }
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
