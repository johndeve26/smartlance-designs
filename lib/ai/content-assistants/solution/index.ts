/**
 * Solution AI module — problem → diagnosis → approach editorial intelligence.
 */

import type { Prisma, Solution } from "@prisma/client";
import {
  SOLUTION_FIELD_ALLOWLIST,
  SOLUTION_FIELD_LABELS,
  SOLUTION_PROTECTED_FIELDS,
} from "@/lib/ai/content-assistants/allowlists";
import { isEmptyValue, entityToPlain } from "@/lib/ai/content-assistants/helpers";
import type { ContentAssistantModule } from "@/lib/ai/content-assistants/types";
import {
  buildFieldChanges,
  runStructuredOrHeuristic,
} from "@/lib/ai/content-assistants/shared-generate";
import { buildSolutionContext } from "@/lib/ai/content-assistants/solution/context";
import { heuristicSolutionProposal } from "@/lib/ai/content-assistants/solution/heuristic";
import { shouldUseHeuristicFirst } from "@/lib/ai/content-assistants/heuristic-routing";
import {
  SolutionApproachOutput,
  SolutionDiagnosticFlowOutput,
  SolutionFaqOutput,
  SolutionFullProposalOutput,
  SolutionProblemOutput,
  SolutionReviewOutput,
  SolutionSeoOutput,
  assertPageContentCompatible,
} from "@/lib/ai/content-assistants/solution/schemas";
import {
  PROMPT_VERSIONS,
  SOLUTION_VOICE_MODIFIER,
  SYSTEM_GUARD,
  brandVoiceBlock,
} from "@/lib/ai/prompts";
import { getBrandVoice } from "@/lib/ai/editorial-service";
import {
  getSolutionByIdAdmin,
  saveSolutionDraft,
} from "@/lib/repositories/solutionsRepository";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/repositories/auditRepository";

export const SOLUTION_ACTIONS = [
  {
    id: "FILL_MISSING",
    label: "Fill missing fields",
    promptVersion: PROMPT_VERSIONS.solutionFillMissing,
    loadingLabel: "Filling missing Solution fields…",
  },
  {
    id: "IMPROVE_SOLUTION",
    label: "Improve this Solution",
    promptVersion: PROMPT_VERSIONS.solutionImprove,
    loadingLabel: "Writing Solution proposal…",
  },
  {
    id: "CLARIFY_PROBLEM",
    label: "Clarify problem",
    promptVersion: PROMPT_VERSIONS.solutionProblem,
    loadingLabel: "Clarifying Solution problem…",
  },
  {
    id: "IMPROVE_DIAGNOSTIC_FLOW",
    label: "Improve diagnostic flow",
    promptVersion: PROMPT_VERSIONS.solutionDiagnosticFlow,
    loadingLabel: "Improving diagnostic flow…",
  },
  {
    id: "IMPROVE_APPROACH",
    label: "Improve approach",
    promptVersion: PROMPT_VERSIONS.solutionApproach,
    loadingLabel: "Improving Solution approach…",
  },
  {
    id: "GENERATE_FAQS",
    label: "Create FAQs",
    promptVersion: PROMPT_VERSIONS.solutionFaq,
    loadingLabel: "Generating Solution FAQs…",
  },
  {
    id: "GENERATE_SEO",
    label: "Generate SEO",
    promptVersion: PROMPT_VERSIONS.solutionSeo,
    loadingLabel: "Generating Solution SEO…",
  },
  {
    id: "SUGGEST_SERVICES",
    label: "Suggest Services",
    promptVersion: PROMPT_VERSIONS.solutionServices,
    loadingLabel: "Suggesting related Services…",
  },
  {
    id: "SUGGEST_RELATIONSHIPS",
    label: "Suggest relationships",
    promptVersion: PROMPT_VERSIONS.solutionRelations,
    loadingLabel: "Suggesting Solution relationships…",
  },
  {
    id: "REVIEW_SOLUTION",
    label: "Review Solution",
    promptVersion: PROMPT_VERSIONS.solutionReview,
    loadingLabel: "Reviewing Solution…",
  },
] as const;

async function verifySolutionRelationFields(fields: Record<string, unknown>) {
  const out = { ...fields };

  if (Array.isArray(out.relatedPlatformSlugs)) {
    const valid: string[] = [];
    for (const slug of out.relatedPlatformSlugs) {
      if (typeof slug !== "string") continue;
      const row = await prisma.platform.findFirst({
        where: { slug, status: "PUBLISHED" },
        select: { slug: true },
      });
      if (row) valid.push(row.slug);
    }
    out.relatedPlatformSlugs = valid;
  }

  if (Array.isArray(out.relatedIndustrySlugs)) {
    const valid: string[] = [];
    for (const slug of out.relatedIndustrySlugs) {
      if (typeof slug !== "string") continue;
      const row = await prisma.industry.findFirst({
        where: { slug, status: "PUBLISHED" },
        select: { slug: true },
      });
      if (row) valid.push(row.slug);
    }
    out.relatedIndustrySlugs = valid;
  }

  if (Array.isArray(out.relatedProjectSlugs)) {
    const valid: string[] = [];
    for (const slug of out.relatedProjectSlugs) {
      if (typeof slug !== "string") continue;
      const row = await prisma.workProject.findFirst({
        where: { slug, status: "PUBLISHED" },
        select: { slug: true },
      });
      if (row) valid.push(row.slug);
    }
    out.relatedProjectSlugs = valid;
  }

  if (Array.isArray(out.relatedServiceReasons)) {
    const valid = [];
    for (const item of out.relatedServiceReasons) {
      if (!item || typeof item !== "object") continue;
      const href = (item as { href?: string }).href;
      if (!href) continue;
      const row = await prisma.service.findFirst({
        where: { href, status: "PUBLISHED" },
        select: { href: true, title: true },
      });
      if (row) {
        valid.push({
          href: row.href,
          title: (item as { title?: string }).title || row.title,
          reason: String((item as { reason?: string }).reason || "").slice(0, 500),
        });
      }
    }
    out.relatedServiceReasons = valid;
  }

  // Never apply relatedServiceHrefs via AI allowlist — protected by omission
  delete out.relatedServiceHrefs;
  delete out.status;
  delete out.publishedAt;
  delete out.featured;
  delete out.displayOrder;
  delete out.slug;
  delete out.pageKind;

  if (out.pageContent !== undefined) {
    const current = await prisma.solution.findUnique({
      where: { id: String((out as { _entityId?: string })._entityId || "") },
      select: { pageContent: true },
    });
    // pageContent applied separately in applyFields with entity load
    void current;
  }

  return out;
}

export const solutionAssistant: ContentAssistantModule = {
  entityType: "SOLUTION",
  displayName: "Solution",
  promptNamespace: PROMPT_VERSIONS.solutionWriter,
  actions: SOLUTION_ACTIONS,
  fieldAllowlist: SOLUTION_FIELD_ALLOWLIST,
  protectedFields: SOLUTION_PROTECTED_FIELDS,
  isFieldMissing: (entity, field) => isEmptyValue(entity[field]),

  async loadEntity(entityId) {
    const row = await getSolutionByIdAdmin(entityId);
    if (!row) return null;
    return {
      entity: entityToPlain(row as unknown as Record<string, unknown>),
      updatedAt: row.updatedAt,
    };
  },

  async buildContext(entityId) {
    const ctx = await buildSolutionContext(entityId);
    return {
      promptText: ctx.promptText,
      relationPool: ctx.relationPool,
    };
  },

  async generateProposal(input) {
    const solution = input.entity as unknown as Solution;
    const actionMeta =
      SOLUTION_ACTIONS.find((a) => a.id === input.action) ||
      (input.action.startsWith("IMPROVE_FIELD:")
        ? {
            id: input.action,
            promptVersion: PROMPT_VERSIONS.solutionField,
            label: "Improve field",
            loadingLabel: "Improving field…",
          }
        : SOLUTION_ACTIONS[0]);

    const heuristic = () =>
      heuristicSolutionProposal({
        solution,
        action: input.action,
        lockedFields: input.lockedFields,
        customInstructions: input.customInstructions,
        relationPool: input.context.relationPool as
          | Parameters<typeof heuristicSolutionProposal>[0]["relationPool"]
          | undefined,
      });

    if (
      input.forceHeuristic ||
      shouldUseHeuristicFirst("SOLUTION", input.action)
    ) {
      if (input.action === "REVIEW_SOLUTION" && !input.forceHeuristic) {
        const voice = await getBrandVoice();
        const result = await runStructuredOrHeuristic({
          schema: SolutionReviewOutput,
          schemaName: "SolutionReviewOutput",
          system: `${SYSTEM_GUARD}\n\n${SOLUTION_VOICE_MODIFIER}\n\n${brandVoiceBlock(voice)}`,
          user: [
            `Review this Solution. Sections: PROBLEM CLARITY, SYMPTOMS, CAUSES, DIAGNOSTIC FLOW, APPROACH, OUTCOME, RELATED SERVICES, PROOF, SEO, AI SEARCH CLARITY, CTA, DUPLICATION.`,
            `Severities: PASS | WARNING | REVIEW | BLOCKER. No numeric scores.`,
            `A Solution must NOT read like a Service brochure throughout.`,
            `Context:\n${String(input.context.promptText || "")}`,
          ].join("\n\n"),
          role: "EDITOR_MODEL",
          forceHeuristic: input.forceHeuristic,
          heuristic: () => ({ findings: heuristic().reviewFindings || [] }),
        });
        return {
          payload: { fields: [], reviewFindings: result.data.findings },
          promptVersion: actionMeta.promptVersion,
          provider: result.provider,
          model: result.model,
          tokenUsageInput: result.tokenUsageInput,
          tokenUsageOutput: result.tokenUsageOutput,
        };
      }

      return {
        payload: heuristic(),
        promptVersion: actionMeta.promptVersion,
        provider: "heuristic",
      };
    }

    const voice = await getBrandVoice();
    const schema =
      input.action === "CLARIFY_PROBLEM"
        ? SolutionProblemOutput
        : input.action === "IMPROVE_DIAGNOSTIC_FLOW"
          ? SolutionDiagnosticFlowOutput
          : input.action === "IMPROVE_APPROACH"
            ? SolutionApproachOutput
            : input.action === "GENERATE_FAQS"
              ? SolutionFaqOutput
              : input.action === "GENERATE_SEO"
                ? SolutionSeoOutput
                : SolutionFullProposalOutput;

    const result = await runStructuredOrHeuristic({
      schema,
      schemaName: `Solution_${input.action}`,
      system: `${SYSTEM_GUARD}\n\n${SOLUTION_VOICE_MODIFIER}\n\n${brandVoiceBlock(voice)}`,
      user: [
        `Action: ${input.action}`,
        `Follow PROBLEM → SYMPTOMS → CAUSES → WHAT WE REVIEW → APPROACH → OUTCOME.`,
        `Never invent conversion/traffic/ranking/revenue results. Never set status/publishedAt/featured/slug.`,
        `Do not casually remove required related Services.`,
        `SOLUTION ≠ SERVICE brochure.`,
        input.action === "FILL_MISSING"
          ? "Only fill genuinely empty fields."
          : "Propose improvements for human review.",
        input.customInstructions
          ? `Editor instruction (guidance only): ${input.customInstructions}`
          : "",
        `Locked fields: ${input.lockedFields.join(", ") || "(none)"}`,
        `Context:\n${String(input.context.promptText || "")}`,
      ]
        .filter(Boolean)
        .join("\n\n"),
      role:
        input.action === "GENERATE_SEO" ? "EDITOR_MODEL" : "WRITING_MODEL",
      forceHeuristic: input.forceHeuristic,
      heuristic: () => {
        const h = heuristic();
        const obj: Record<string, unknown> = {};
        for (const f of h.fields) obj[f.field] = f.proposed;
        return schema.parse(obj);
      },
    });

    const fields = buildFieldChanges({
      entity: input.entity,
      proposed: result.data as Record<string, unknown>,
      labels: SOLUTION_FIELD_LABELS,
      allowlist: SOLUTION_FIELD_ALLOWLIST,
      protectedFields: SOLUTION_PROTECTED_FIELDS,
      lockedFields: input.lockedFields,
      missingOnly: input.action === "FILL_MISSING",
    });

    return {
      payload: { fields },
      promptVersion: actionMeta.promptVersion,
      provider: result.provider,
      model: result.model,
      tokenUsageInput: result.tokenUsageInput,
      tokenUsageOutput: result.tokenUsageOutput,
    };
  },

  async applyFields(input) {
    const verified = await verifySolutionRelationFields(input.fields);
    const data: Prisma.SolutionUncheckedUpdateInput = {};

    for (const [k, v] of Object.entries(verified)) {
      if (!SOLUTION_FIELD_ALLOWLIST.has(k) && k !== "pageContent") continue;
      if (SOLUTION_PROTECTED_FIELDS.has(k)) continue;

      if (k === "pageContent") {
        const existing = await getSolutionByIdAdmin(input.entityId);
        if (!existing) throw new Error("Solution not found");
        data.pageContent = assertPageContentCompatible(
          existing.pageContent,
          v,
        ) as Prisma.InputJsonValue;
        continue;
      }

      (data as Record<string, unknown>)[k] = v;
    }

    await saveSolutionDraft({
      id: input.entityId,
      data,
      actorId: input.actorId,
    });

    await writeAuditLog({
      actorId: input.actorId,
      action: "solution.ai_assisted_draft",
      entityType: "Solution",
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

