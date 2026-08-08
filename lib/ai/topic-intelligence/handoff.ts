/**
 * Convert EditorialOpportunity → AI Editorial Project (handoff).
 * Imports safe discovery sources; never auto-publishes.
 */

import type { AIEditorialMode, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createAIProject, addManualSource } from "@/lib/ai/editorial-service";
import { isSafeHttpUrl } from "@/lib/ai/safety";
import { writeAuditLog } from "@/lib/repositories/auditRepository";

function asStringArray(json: unknown): string[] {
  if (!Array.isArray(json)) return [];
  return json.filter((x): x is string => typeof x === "string");
}

export async function convertOpportunityToProject(input: {
  opportunityId: string;
  actorId: string;
  /** Human override despite MONITOR/IGNORE/overlap warnings */
  force?: boolean;
}) {
  const opp = await prisma.editorialOpportunity.findUnique({
    where: { id: input.opportunityId },
  });
  if (!opp) throw new Error("Opportunity not found");
  if (opp.linkedAIProjectId) {
    return { projectId: opp.linkedAIProjectId, alreadyLinked: true as const };
  }

  const warnRecs = new Set([
    "MONITOR",
    "IGNORE",
    "UPDATE_SERVICE_PAGE",
    "UPDATE_SOLUTION_PAGE",
    "UPDATE_PLATFORM_PAGE",
    "UPDATE_INDUSTRY_PAGE",
  ]);
  if (warnRecs.has(opp.recommendation) && !input.force) {
    throw new Error(
      `Recommendation is ${opp.recommendation}. Confirm override to create a project anyway.`,
    );
  }

  let mode: AIEditorialMode = "NEW_ARTICLE";
  let linkedInsightId: string | undefined;
  if (opp.recommendation === "UPDATE_EXISTING") {
    mode = "UPDATE_EXISTING";
    const existing = opp.existingContentJson;
    if (Array.isArray(existing)) {
      for (const row of existing) {
        if (!row || typeof row !== "object") continue;
        const e = row as { type?: string; id?: string };
        if (e.type === "Insight" && e.id && !e.id.startsWith("guide:")) {
          linkedInsightId = e.id;
          break;
        }
      }
    }
  }

  const services = asStringArray(opp.suggestedServicesJson);
  const solutions = asStringArray(opp.suggestedSolutionsJson);

  const notes = [
    "Created from Topic Intelligence.",
    opp.whyNow && `Why now: ${opp.whyNow}`,
    opp.whySmartlance && `Why Smartlance: ${opp.whySmartlance}`,
    opp.uniqueValue && `Unique value: ${opp.uniqueValue}`,
    opp.higherFactualReview && "HIGHER FACTUAL REVIEW required (legal/regulatory theme).",
    `Recommendation was: ${opp.recommendation} (${opp.badge || "n/a"}).`,
  ]
    .filter(Boolean)
    .join("\n");

  const project = await createAIProject({
    actorId: input.actorId,
    title: opp.workingTitle,
    workingTopic: opp.coreTopic,
    mode,
    targetAudience: opp.audience || undefined,
    businessGoal: opp.commercialRelationship || opp.suggestedCta || undefined,
    primaryQuery: opp.question || opp.coreTopic,
    targetRegion: opp.market || undefined,
    contentType: opp.suggestedFormat || "INSIGHT",
    serviceHref: services[0],
    solutionSlug: solutions[0],
    notes,
    linkedInsightId,
  });

  // Seed researchJson with discovery provenance for reuse
  const sourceSummary = opp.sourceSummaryJson;
  const signalTitles = asStringArray(opp.supportingSignalsJson);
  await prisma.aIEditorialProject.update({
    where: { id: project.id },
    data: {
      uniqueValue: opp.uniqueValue,
      researchJson: {
        fromTopicDiscovery: true,
        opportunityId: opp.id,
        signalTitles,
        sourceSummary,
        suggestedResources: asStringArray(opp.suggestedResourcesJson),
        suggestedPlatforms: asStringArray(opp.suggestedPlatformsJson),
        importedAt: new Date().toISOString(),
      } as Prisma.InputJsonValue,
      primaryIntent: opp.intent,
    },
  });

  // Import safe URLs from related signals on the same run
  if (opp.runId) {
    const signals = await prisma.topicSignal.findMany({
      where: { runId: opp.runId, status: "ACTIVE" },
      take: 20,
      orderBy: { discoveredAt: "desc" },
    });
    for (const s of signals) {
      if (!s.sourceUrl || !isSafeHttpUrl(s.sourceUrl)) continue;
      // Freshness check for timely sources (>90d warn via notes only)
      let note = s.summary || undefined;
      if (s.freshness === "TIMELY" && s.publishedAt) {
        const ageDays = (Date.now() - s.publishedAt.getTime()) / 86_400_000;
        if (ageDays > 90) {
          note = [note, "Source may be stale (>90 days); re-verify before citing."]
            .filter(Boolean)
            .join(" ");
        }
      }
      try {
        await addManualSource(project.id, input.actorId, {
          url: s.sourceUrl,
          title: s.title,
          sourceType: s.sourceAuthorityType as never,
          notes: note,
        });
      } catch {
        // skip unsafe / duplicate failures
      }
    }
  }

  await prisma.editorialOpportunity.update({
    where: { id: opp.id },
    data: {
      status: "CONVERTED_TO_PROJECT",
      linkedAIProjectId: project.id,
      reviewedById: input.actorId,
      reviewedAt: new Date(),
    },
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "topic_opportunity.converted",
    entityType: "EditorialOpportunity",
    entityId: opp.id,
    metadata: { projectId: project.id, recommendation: opp.recommendation },
  });

  return { projectId: project.id, alreadyLinked: false as const };
}
