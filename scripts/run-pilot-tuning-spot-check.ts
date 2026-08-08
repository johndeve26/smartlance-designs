/**
 * Post-tuning spot check — proposals only (no apply/publish).
 * Targets: WordPress, Short-Term Rentals, Website Redesign.
 *
 * Usage: npx tsx scripts/run-pilot-tuning-spot-check.ts
 */

import { writeFileSync, mkdirSync } from "fs";
import { createContentProposal } from "@/lib/ai/content-assistants/proposals";
import type { ProposalPayload, ProposalResearchSource } from "@/lib/ai/content-assistants/types";
import { prisma } from "@/lib/db";
import { getAIProviderStatus } from "@/lib/ai/providers";
import { createResearchProvider } from "@/lib/ai/research";

const ACTOR_EMAIL = "admin@smartlancedesigns.com";

function official(url: string, title: string, why: string): ProposalResearchSource {
  let domain = "";
  try {
    domain = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    domain = "";
  }
  return {
    url,
    title,
    domain,
    sourceType: "OFFICIAL",
    checkedAt: new Date().toISOString(),
    whyUsed: why,
  };
}

function payloadOf(proposal: { payloadJson: unknown }): ProposalPayload {
  return proposal.payloadJson as ProposalPayload;
}

async function main() {
  const actor = await prisma.adminUser.findFirst({
    where: { email: ACTOR_EMAIL },
  });
  if (!actor) throw new Error(`Actor ${ACTOR_EMAIL} not found`);

  const writing = await getAIProviderStatus();
  const research = createResearchProvider();
  const researchStatus = research.id !== "manual" && research.isConfigured();
  const forceHeuristic = !writing.configured;

  const wordpress = await prisma.platform.findFirst({
    where: { slug: "wordpress" },
  });
  const industry = await prisma.industry.findFirst({
    where: { slug: "short-term-rentals" },
  });
  const service = await prisma.service.findFirst({
    where: { slug: "website-redesign" },
  });
  if (!wordpress || !industry || !service) {
    throw new Error("Missing spot-check CMS targets");
  }

  const wpSources = [
    official(
      "https://wordpress.org/",
      "WordPress.org",
      "Official product site for factual platform context.",
    ),
    official(
      "https://developer.wordpress.org/",
      "WordPress Developer Resources",
      "Official developer documentation.",
    ),
  ];

  const results: Array<Record<string, unknown>> = [];

  const wpProposal = await createContentProposal({
    entityType: "PLATFORM",
    entityId: wordpress.id,
    action: "RESEARCH_AND_IMPROVE",
    actorId: actor.id,
    forceHeuristic,
    researchOverride: researchStatus ? undefined : wpSources,
  });
  const wpRun = wpProposal.runId
    ? await prisma.aIContentRun.findUnique({ where: { id: wpProposal.runId } })
    : null;
  const wpPayload = payloadOf(wpProposal);
  const wpProseRewrite = (wpPayload.fields || []).some((f) =>
    ["summary", "description"].includes(f.field),
  );
  const wpPreserved =
    !wpProseRewrite &&
    (wpPayload.resultMode === "NO_CHANGE_RECOMMENDED" ||
      wpPayload.resultMode === "WRITING_PROVIDER_REQUIRED" ||
      wpPayload.resultMode === "PARTIAL_CHANGE_RECOMMENDED" ||
      wpPayload.resultMode === "RESEARCH_NEEDED");
  results.push({
    target: "WordPress",
    action: "RESEARCH_AND_IMPROVE",
    proposalId: wpProposal.id,
    runId: wpProposal.runId,
    promptVersion: wpProposal.promptVersion,
    provider: wpRun?.provider,
    researchAttached: Boolean(wpPayload.research?.sourceCount),
    fieldCount: wpPayload.fields?.length ?? 0,
    fields: (wpPayload.fields || []).map((f) => f.field),
    resultMode: wpPayload.resultMode,
    verdict: wpPreserved && (wpPayload.research?.sourceCount ?? 0) > 0 ? "PASS" : wpPreserved ? "PASS_WITH_LIGHT_EDIT" : "FAIL",
  });

  const indProposal = await createContentProposal({
    entityType: "INDUSTRY",
    entityId: industry.id,
    action: "IMPROVE_INDUSTRY",
    actorId: actor.id,
    forceHeuristic: true,
  });
  const indRun = indProposal.runId
    ? await prisma.aIContentRun.findUnique({ where: { id: indProposal.runId } })
    : null;
  const indPayload = payloadOf(indProposal);
  const descField = indPayload.fields?.find((f) => f.field === "description");
  const desc = String(descField?.proposed || "");
  const currentDesc = industry.description || "";
  const currentSpecific = /guest|booking|propert|availab|direct booking|polic|vacation|stay/i.test(
    currentDesc,
  );
  const proposedSpecific = /guest|booking|propert|availab|direct booking|polic/i.test(desc);
  const onlySeo =
    !descField &&
    (indPayload.fields || []).every((f) =>
      ["seoTitle", "seoDescription", "ogTitle", "ogDescription"].includes(f.field),
    );
  results.push({
    target: "Short-Term Rentals",
    action: "IMPROVE_INDUSTRY",
    proposalId: indProposal.id,
    runId: indProposal.runId,
    promptVersion: indProposal.promptVersion,
    provider: indRun?.provider,
    fieldCount: indPayload.fields?.length ?? 0,
    fields: (indPayload.fields || []).map((f) => f.field),
    currentDescriptionPreview: currentDesc.slice(0, 120),
    descriptionPreview: desc.slice(0, 220),
    resultMode: indPayload.resultMode,
    verdict:
      proposedSpecific || (onlySeo && currentSpecific) || indPayload.resultMode === "NO_CHANGE_RECOMMENDED"
        ? "PASS"
        : "FAIL",
  });

  const relProposal = await createContentProposal({
    entityType: "SERVICE",
    entityId: service.id,
    action: "SUGGEST_RELATIONSHIPS",
    actorId: actor.id,
    forceHeuristic: true,
  });
  const relPayload = payloadOf(relProposal);
  const suggestions = relPayload.suggestedRelations || [];
  const firstNSmell =
    suggestions.length >= 3 &&
    suggestions.every((s) => /May help visitors who arrive/i.test(s.reason || ""));

  const improveProposal = await createContentProposal({
    entityType: "SERVICE",
    entityId: service.id,
    action: "IMPROVE_SERVICE",
    actorId: actor.id,
    forceHeuristic: true,
  });
  const improvePayload = payloadOf(improveProposal);
  const bodyRewritten = (improvePayload.fields || []).some((f) =>
    ["summary", "description"].includes(f.field),
  );

  results.push({
    target: "Website Redesign",
    action: "SUGGEST_RELATIONSHIPS + IMPROVE_SERVICE",
    proposalIds: [relProposal.id, improveProposal.id],
    relationCount: suggestions.length,
    relationTitles: suggestions.map((s) => s.title),
    reasons: suggestions.map((s) => s.reason),
    improveFields: (improvePayload.fields || []).map((f) => f.field),
    firstNSmell,
    bodyRewritten,
    verdict:
      !firstNSmell && !bodyRewritten
        ? "PASS"
        : !firstNSmell
          ? "PASS_WITH_LIGHT_EDIT"
          : "FAIL",
  });

  const wpAfter = await prisma.platform.findUnique({
    where: { id: wordpress.id },
    select: { lastReviewedAt: true, summary: true },
  });
  const home = await prisma.homepageContent.findFirst({
    select: { seoTitle: true, draftJson: true },
  });

  const artifact = {
    generatedAt: new Date().toISOString(),
    writingConfigured: writing.configured,
    researchConfigured: researchStatus,
    forceHeuristic,
    cmsUnchanged: {
      wordpressLastReviewedAt: wpAfter?.lastReviewedAt,
      homepageSeoTitle: home?.seoTitle ?? null,
    },
    results,
  };

  mkdirSync("docs/audit-artifacts", { recursive: true });
  writeFileSync(
    "docs/audit-artifacts/pilot-tuning-spot-check.json",
    JSON.stringify(artifact, null, 2),
  );
  console.log(JSON.stringify(artifact, null, 2));
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
