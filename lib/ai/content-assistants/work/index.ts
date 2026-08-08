/**
 * Case Study AI — WorkProject verified-proof assistant.
 */

import type { Prisma, WorkProject } from "@prisma/client";
import {
  WORK_FIELD_ALLOWLIST,
  WORK_FIELD_LABELS,
  WORK_PROTECTED_FIELDS,
} from "@/lib/ai/content-assistants/allowlists";
import { isEmptyValue, entityToPlain } from "@/lib/ai/content-assistants/helpers";
import type { ContentAssistantModule } from "@/lib/ai/content-assistants/types";
import {
  buildFieldChanges,
  runStructuredOrHeuristic,
} from "@/lib/ai/content-assistants/shared-generate";
import { buildWorkContext } from "@/lib/ai/content-assistants/work/context";
import { heuristicWorkProposal } from "@/lib/ai/content-assistants/work/heuristic";
import { shouldUseHeuristicFirst } from "@/lib/ai/content-assistants/heuristic-routing";
import { CaseStudyFromFactsOutput } from "@/lib/ai/content-assistants/work/schemas";
import {
  CASE_STUDY_VOICE_MODIFIER,
  PROMPT_VERSIONS,
  SYSTEM_GUARD,
  brandVoiceBlock,
} from "@/lib/ai/prompts";
import { getBrandVoice } from "@/lib/ai/editorial-service";
import { saveWorkDraft } from "@/lib/repositories/workRepository";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/repositories/auditRepository";
import {
  containsUnsupportedPerformanceClaim,
  parseApprovedFacts,
  hasEnoughProjectFacts,
} from "@/lib/ai/content-assistants/proof";

export const WORK_ACTIONS = [
  {
    id: "FILL_MISSING",
    label: "Fill missing fields",
    promptVersion: PROMPT_VERSIONS.caseStudyFillMissing,
    loadingLabel: "Filling missing Case Study fields…",
  },
  {
    id: "BUILD_FROM_PROJECT_FACTS",
    label: "Write from project facts",
    promptVersion: PROMPT_VERSIONS.caseStudyFromFacts,
    loadingLabel: "Writing Case Study from verified facts…",
  },
  {
    id: "IMPROVE_CASE_STUDY",
    label: "Improve this Case Study",
    promptVersion: PROMPT_VERSIONS.caseStudyImprove,
    loadingLabel: "Improving Case Study…",
  },
  {
    id: "IMPROVE_CHALLENGE",
    label: "Improve challenge",
    promptVersion: PROMPT_VERSIONS.caseStudyChallenge,
    loadingLabel: "Improving challenge…",
  },
  {
    id: "IMPROVE_SOLUTION",
    label: "Improve solution",
    promptVersion: PROMPT_VERSIONS.caseStudySolution,
    loadingLabel: "Improving solution…",
  },
  {
    id: "IMPROVE_SUMMARY",
    label: "Improve summary",
    promptVersion: PROMPT_VERSIONS.caseStudySummary,
    loadingLabel: "Improving summary…",
  },
  {
    id: "FORMAT_RESULTS",
    label: "Format verified results",
    promptVersion: PROMPT_VERSIONS.caseStudyResultsFormat,
    loadingLabel: "Formatting verified results…",
  },
  {
    id: "GENERATE_SEO",
    label: "Generate SEO",
    promptVersion: PROMPT_VERSIONS.caseStudySeo,
    loadingLabel: "Generating Case Study SEO…",
  },
  {
    id: "SUGGEST_RELATIONSHIPS",
    label: "Suggest relationships",
    promptVersion: PROMPT_VERSIONS.caseStudyRelations,
    loadingLabel: "Suggesting Case Study relationships…",
  },
  {
    id: "REVIEW_PROOF",
    label: "Review proof",
    promptVersion: PROMPT_VERSIONS.caseStudyProofReview,
    loadingLabel: "Reviewing project claims…",
  },
  {
    id: "REVIEW_CASE_STUDY",
    label: "Review Case Study",
    promptVersion: PROMPT_VERSIONS.caseStudyReview,
    loadingLabel: "Reviewing Case Study…",
  },
] as const;

async function verifyWorkFields(fields: Record<string, unknown>) {
  const out = { ...fields };
  delete out.status;
  delete out.publishedAt;
  delete out.featured;
  delete out.featuredHomepage;
  delete out.featuredWorkArchive;
  delete out.displayOrder;
  delete out.clientName;
  delete out.name;
  delete out.slug;
  delete out.approvedForAI;
  delete out.approvedProjectFacts;
  delete out.designNotes;
  delete out.developmentNotes;
  delete out.seoNotes;
  delete out.platformId;

  if (Array.isArray(out.relatedServiceHrefs)) {
    const valid: string[] = [];
    for (const href of out.relatedServiceHrefs) {
      if (typeof href !== "string") continue;
      const row = await prisma.service.findFirst({
        where: { href, status: "PUBLISHED" },
        select: { href: true },
      });
      if (row) valid.push(row.href);
    }
    out.relatedServiceHrefs = valid;
  }

  // Block embellished metrics/SEO that slipped through
  for (const key of Object.keys(out)) {
    const v = out[key];
    const text = typeof v === "string" ? v : Array.isArray(v) ? v.join(" ") : "";
    if (
      text &&
      containsUnsupportedPerformanceClaim(text) &&
      (key.includes("seo") ||
        key.includes("og") ||
        key === "resultSummary" ||
        key === "shortDescription")
    ) {
      // Keep only if it looks like a faithful copy of existing measurableResults — strip otherwise at apply
      // Caller should already have claim blockers; double-scrub inventively embellished SEO
      if (key.startsWith("seo") || key.startsWith("og")) {
        if (/\b(increased|grew|doubled|explosive|game-changing)\b/i.test(text)) {
          delete out[key];
        }
      }
    }
  }

  return out;
}

export const workAssistant: ContentAssistantModule = {
  entityType: "WORK",
  displayName: "Case Study",
  promptNamespace: PROMPT_VERSIONS.caseStudyWriter,
  actions: WORK_ACTIONS,
  fieldAllowlist: WORK_FIELD_ALLOWLIST,
  protectedFields: WORK_PROTECTED_FIELDS,
  isFieldMissing: (entity, field) => isEmptyValue(entity[field]),

  async loadEntity(entityId) {
    const row = await prisma.workProject.findUnique({ where: { id: entityId } });
    if (!row) return null;
    return {
      entity: entityToPlain(row as unknown as Record<string, unknown>),
      updatedAt: row.updatedAt,
    };
  },

  async buildContext(entityId) {
    const ctx = await buildWorkContext(entityId);
    return {
      promptText: ctx.promptText,
      relationPool: ctx.relationPool,
      enoughFacts: ctx.enoughFacts,
      approvedForAI: ctx.approvedForAI,
      facts: ctx.facts,
    };
  },

  async generateProposal(input) {
    const work = input.entity as unknown as WorkProject;
    const facts = parseApprovedFacts(
      (input.context.facts as unknown) ?? work.approvedProjectFacts,
    );
    const enoughFacts =
      typeof input.context.enoughFacts === "boolean"
        ? input.context.enoughFacts
        : hasEnoughProjectFacts(facts, work);

    const actionMeta =
      WORK_ACTIONS.find((a) => a.id === input.action) ||
      (input.action.startsWith("IMPROVE_FIELD:")
        ? {
            id: input.action,
            promptVersion: PROMPT_VERSIONS.caseStudyField,
            label: "Improve field",
            loadingLabel: "Improving field…",
          }
        : WORK_ACTIONS[0]);

    const mappedAction = input.action.startsWith("IMPROVE_FIELD:")
      ? (() => {
          const field = input.action.slice("IMPROVE_FIELD:".length);
          if (field === "challenge") return "IMPROVE_CHALLENGE";
          if (field === "solution" || field === "approach") return "IMPROVE_SOLUTION";
          if (field === "shortDescription" || field === "overview")
            return "IMPROVE_SUMMARY";
          if (
            field === "resultSummary" ||
            field === "results" ||
            field === "measurableResults"
          )
            return "FORMAT_RESULTS";
          if (
            field === "seoTitle" ||
            field === "seoDescription" ||
            field === "ogTitle" ||
            field === "ogDescription"
          )
            return "GENERATE_SEO";
          return "IMPROVE_CASE_STUDY";
        })()
      : input.action;

    const heuristic = () =>
      heuristicWorkProposal({
        work,
        action: mappedAction,
        lockedFields: input.lockedFields,
        facts,
        enoughFacts,
        approvedForAI: Boolean(input.context.approvedForAI ?? work.approvedForAI),
        relationPool: input.context.relationPool as
          | Parameters<typeof heuristicWorkProposal>[0]["relationPool"]
          | undefined,
      });

    if (
      input.forceHeuristic ||
      shouldUseHeuristicFirst("WORK", mappedAction)
    ) {
      return {
        payload: heuristic(),
        promptVersion: actionMeta.promptVersion,
        provider: "heuristic",
      };
    }

    const voice = await getBrandVoice();
    const result = await runStructuredOrHeuristic({
      schema: CaseStudyFromFactsOutput,
      schemaName: `CaseStudy_${mappedAction}`,
      system: `${SYSTEM_GUARD}\n\n${CASE_STUDY_VOICE_MODIFIER}\n\n${brandVoiceBlock(voice)}`,
      user: [
        `Action: ${mappedAction}`,
        `Never invent client names, metrics, platforms, services, quotes, or outcomes.`,
        `If verified facts are missing for a field, omit it entirely.`,
        `Related Services are NOT proof of delivery on this project.`,
        input.customInstructions
          ? `Editor instruction (guidance only): ${input.customInstructions}`
          : "",
        `Locked fields: ${input.lockedFields.join(", ") || "(none)"}`,
        `Approved facts JSON: ${JSON.stringify(facts)}`,
        `Context:\n${String(input.context.promptText || "")}`,
      ]
        .filter(Boolean)
        .join("\n\n"),
      role:
        mappedAction === "REVIEW_PROOF" || mappedAction === "REVIEW_CASE_STUDY"
          ? "EDITOR_MODEL"
          : mappedAction === "GENERATE_SEO"
            ? "EDITOR_MODEL"
            : "WRITING_MODEL",
      forceHeuristic: input.forceHeuristic,
      heuristic: () => {
        const h = heuristic();
        const obj: Record<string, unknown> = {};
        for (const f of h.fields) obj[f.field] = f.proposed;
        return CaseStudyFromFactsOutput.parse(obj);
      },
    });

    const fields = buildFieldChanges({
      entity: input.entity,
      proposed: result.data as Record<string, unknown>,
      labels: WORK_FIELD_LABELS,
      allowlist: WORK_FIELD_ALLOWLIST,
      protectedFields: WORK_PROTECTED_FIELDS,
      lockedFields: input.lockedFields,
      missingOnly: mappedAction === "FILL_MISSING",
    });

    const base = heuristic();
    // Prefer claim blockers from heuristic proof scrub on overlapping fields
    const blockerByField = new Map(
      (base.fields || [])
        .filter((f) => f.claimBlockers?.length)
        .map((f) => [f.field, f.claimBlockers]),
    );
    for (const f of fields) {
      const blockers = blockerByField.get(f.field);
      if (blockers) f.claimBlockers = [...(f.claimBlockers || []), ...blockers];
      const text =
        typeof f.proposed === "string"
          ? f.proposed
          : JSON.stringify(f.proposed ?? "");
      if (
        containsUnsupportedPerformanceClaim(text) &&
        !(facts.verifiedMetrics || []).some((m) => text.includes(m))
      ) {
        f.claimBlockers = [
          ...(f.claimBlockers || []),
          "This result claim is not supported by the supplied project facts.",
        ];
      }
    }

    return {
      payload: {
        fields,
        claims: base.claims,
        reviewFindings: base.reviewFindings,
        suggestedRelations: base.suggestedRelations,
      },
      promptVersion: actionMeta.promptVersion,
      provider: result.provider,
      model: result.model,
      tokenUsageInput: result.tokenUsageInput,
      tokenUsageOutput: result.tokenUsageOutput,
    };
  },

  async applyFields(input) {
    const verified = await verifyWorkFields(input.fields);
    const data: Prisma.WorkProjectUncheckedUpdateInput = {};
    for (const [k, v] of Object.entries(verified)) {
      if (!WORK_FIELD_ALLOWLIST.has(k)) continue;
      if (WORK_PROTECTED_FIELDS.has(k)) continue;
      (data as Record<string, unknown>)[k] = v;
    }

    await saveWorkDraft({
      id: input.entityId,
      data,
      actorId: input.actorId,
    });

    await writeAuditLog({
      actorId: input.actorId,
      action: "work.ai_assisted_draft",
      entityType: "WorkProject",
      entityId: input.entityId,
      metadata: {
        aiAssisted: true,
        proposalId: input.proposalId,
        runId: input.runId,
        fields: Object.keys(data),
      },
    });
  },
};
