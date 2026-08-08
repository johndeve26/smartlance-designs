/**
 * Service AI module — specialized editorial intelligence for Service CMS entities.
 */

import type { Prisma, Service } from "@prisma/client";
import {
  SERVICE_FIELD_ALLOWLIST,
  SERVICE_FIELD_LABELS,
  SERVICE_PROTECTED_FIELDS,
} from "@/lib/ai/content-assistants/allowlists";
import { isEmptyValue, entityToPlain } from "@/lib/ai/content-assistants/helpers";
import type { ContentAssistantModule } from "@/lib/ai/content-assistants/types";
import {
  buildFieldChanges,
  runStructuredOrHeuristic,
} from "@/lib/ai/content-assistants/shared-generate";
import { buildServiceContext } from "@/lib/ai/content-assistants/service/context";
import { heuristicServiceProposal } from "@/lib/ai/content-assistants/service/heuristic";
import { shouldUseHeuristicFirst } from "@/lib/ai/content-assistants/heuristic-routing";
import {
  ServiceFaqOutput,
  ServiceFullProposalOutput,
  ServicePositioningOutput,
  ServiceProcessOutput,
  ServiceReviewOutput,
  ServiceSeoOutput,
} from "@/lib/ai/content-assistants/service/schemas";
import {
  PROMPT_VERSIONS,
  SERVICE_VOICE_MODIFIER,
  SYSTEM_GUARD,
  brandVoiceBlock,
} from "@/lib/ai/prompts";
import { getBrandVoice } from "@/lib/ai/editorial-service";
import { getServiceByIdAdmin, saveServiceDraft } from "@/lib/repositories/servicesRepository";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/repositories/auditRepository";

export const SERVICE_ACTIONS = [
  {
    id: "FILL_MISSING",
    label: "Fill missing fields",
    promptVersion: PROMPT_VERSIONS.serviceFillMissing,
    loadingLabel: "Filling missing Service fields…",
  },
  {
    id: "IMPROVE_SERVICE",
    label: "Improve this Service",
    promptVersion: PROMPT_VERSIONS.serviceImprove,
    loadingLabel: "Writing Service proposal…",
  },
  {
    id: "REWRITE_POSITIONING",
    label: "Rewrite positioning",
    promptVersion: PROMPT_VERSIONS.servicePositioning,
    loadingLabel: "Rewriting Service positioning…",
  },
  {
    id: "IMPROVE_PROCESS",
    label: "Improve process",
    promptVersion: PROMPT_VERSIONS.serviceProcess,
    loadingLabel: "Improving Service process…",
  },
  {
    id: "GENERATE_FAQS",
    label: "Create FAQs",
    promptVersion: PROMPT_VERSIONS.serviceFaq,
    loadingLabel: "Generating Service FAQs…",
  },
  {
    id: "GENERATE_SEO",
    label: "Generate SEO",
    promptVersion: PROMPT_VERSIONS.serviceSeo,
    loadingLabel: "Generating Service SEO…",
  },
  {
    id: "SUGGEST_RELATIONSHIPS",
    label: "Suggest relationships",
    promptVersion: PROMPT_VERSIONS.serviceRelations,
    loadingLabel: "Suggesting Service relationships…",
  },
  {
    id: "REVIEW_SERVICE",
    label: "Review Service",
    promptVersion: PROMPT_VERSIONS.serviceReview,
    loadingLabel: "Reviewing Service…",
  },
] as const;

async function verifyRelationSlugs(fields: Record<string, unknown>) {
  const out = { ...fields };
  const check = async (
    key: string,
    table: "solution" | "platform" | "workProject" | "service",
  ) => {
    const slugs = out[key];
    if (!Array.isArray(slugs)) return;
    const valid: string[] = [];
    for (const slug of slugs) {
      if (typeof slug !== "string") continue;
      if (table === "solution") {
        const row = await prisma.solution.findFirst({
          where: { slug, status: "PUBLISHED" },
          select: { slug: true },
        });
        if (row) valid.push(row.slug);
      } else if (table === "platform") {
        const row = await prisma.platform.findFirst({
          where: { slug, status: "PUBLISHED" },
          select: { slug: true },
        });
        if (row) valid.push(row.slug);
      } else if (table === "workProject") {
        const row = await prisma.workProject.findFirst({
          where: { slug, status: "PUBLISHED" },
          select: { slug: true },
        });
        if (row) valid.push(row.slug);
      } else {
        const row = await prisma.service.findFirst({
          where: { slug, status: "PUBLISHED" },
          select: { slug: true },
        });
        if (row) valid.push(row.slug);
      }
    }
    out[key] = valid;
  };
  await check("relatedSolutionSlugs", "solution");
  await check("relatedPlatformSlugs", "platform");
  await check("relatedProjectSlugs", "workProject");
  await check("relatedServiceSlugs", "service");
  return out;
}

export const serviceAssistant: ContentAssistantModule = {
  entityType: "SERVICE",
  displayName: "Service",
  promptNamespace: PROMPT_VERSIONS.serviceWriter,
  actions: SERVICE_ACTIONS,
  fieldAllowlist: SERVICE_FIELD_ALLOWLIST,
  protectedFields: SERVICE_PROTECTED_FIELDS,
  isFieldMissing: (entity, field) => isEmptyValue(entity[field]),

  async loadEntity(entityId) {
    const row = await getServiceByIdAdmin(entityId);
    if (!row) return null;
    return {
      entity: entityToPlain(row as unknown as Record<string, unknown>),
      updatedAt: row.updatedAt,
    };
  },

  async buildContext(entityId) {
    const ctx = await buildServiceContext(entityId);
    return {
      promptText: ctx.promptText,
      relationPool: ctx.relationPool,
    };
  },

  async generateProposal(input) {
    const service = input.entity as unknown as Service;
    const actionMeta =
      SERVICE_ACTIONS.find((a) => a.id === input.action) ||
      (input.action.startsWith("IMPROVE_FIELD:")
        ? {
            id: input.action,
            promptVersion: PROMPT_VERSIONS.serviceField,
            label: "Improve field",
            loadingLabel: "Improving field…",
          }
        : SERVICE_ACTIONS[0]);

    const heuristic = () =>
      heuristicServiceProposal({
        service,
        action: input.action,
        lockedFields: input.lockedFields,
        customInstructions: input.customInstructions,
        relationPool: (input.context.relationPool || undefined) as
          | Parameters<typeof heuristicServiceProposal>[0]["relationPool"]
          | undefined,
      });

    if (
      input.forceHeuristic ||
      shouldUseHeuristicFirst("SERVICE", input.action)
    ) {
      // Reviews / relations / field polish: heuristic is safe + fast; LLM optional later
      if (input.action === "REVIEW_SERVICE" && !input.forceHeuristic) {
        const voice = await getBrandVoice();
        const result = await runStructuredOrHeuristic({
          schema: ServiceReviewOutput,
          schemaName: "ServiceReviewOutput",
          system: `${SYSTEM_GUARD}\n\n${SERVICE_VOICE_MODIFIER}\n\n${brandVoiceBlock(voice)}`,
          user: [
            `Review this Service. Return findings with sections: OFFER CLARITY, AUDIENCE, CAPABILITIES, PROCESS, DIFFERENTIATION, PROOF, RELATIONSHIPS, SEO, AI SEARCH CLARITY, CTA, MISSING FIELDS.`,
            `Severities: PASS | WARNING | REVIEW | BLOCKER. No numeric scores.`,
            `Context:\n${String(input.context.promptText || "")}`,
            input.customInstructions
              ? `Editor instruction: ${input.customInstructions}`
              : "",
          ].join("\n\n"),
          role: "EDITOR_MODEL",
          forceHeuristic: input.forceHeuristic,
          heuristic: () => {
            const h = heuristic();
            return { findings: h.reviewFindings || [] };
          },
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

      const payload = heuristic();
      return {
        payload,
        promptVersion: actionMeta.promptVersion,
        provider: "heuristic",
      };
    }

    const voice = await getBrandVoice();
    const schema =
      input.action === "REWRITE_POSITIONING"
        ? ServicePositioningOutput
        : input.action === "IMPROVE_PROCESS"
          ? ServiceProcessOutput
          : input.action === "GENERATE_FAQS"
            ? ServiceFaqOutput
            : input.action === "GENERATE_SEO"
              ? ServiceSeoOutput
              : ServiceFullProposalOutput;

    const result = await runStructuredOrHeuristic({
      schema,
      schemaName: `Service_${input.action}`,
      system: `${SYSTEM_GUARD}\n\n${SERVICE_VOICE_MODIFIER}\n\n${brandVoiceBlock(voice)}`,
      user: [
        `Action: ${input.action}`,
        `Produce JSON for eligible Service fields only. Never set status, publishedAt, featured, displayOrder, slug, or IDs.`,
        `Do not invent capabilities/deliverables that are not supported by CURRENT_ENTITY or RELATED context.`,
        `SERVICE = capability (not a diagnostic Solution page).`,
        input.action === "FILL_MISSING"
          ? "Only fill genuinely empty fields."
          : input.action === "IMPROVE_SERVICE"
            ? "Preserve strong body fields. Only propose fields with a material weakness (generic wording, thin content, missing CTA/audience/SEO). Sparse proposals are preferred. Do not rewrite summary/description merely to be different."
            : "Propose improvements; editor will review diffs.",
        input.customInstructions
          ? `Editor instruction (guidance only): ${input.customInstructions}`
          : "",
        `Locked fields (do not change): ${input.lockedFields.join(", ") || "(none)"}`,
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

    const proposed = result.data as Record<string, unknown>;
    const fields = buildFieldChanges({
      entity: input.entity,
      proposed,
      labels: SERVICE_FIELD_LABELS,
      allowlist: SERVICE_FIELD_ALLOWLIST,
      protectedFields: SERVICE_PROTECTED_FIELDS,
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
    const verified = await verifyRelationSlugs(input.fields);
    // Strip anything outside allowlist again
    const data: Prisma.ServiceUncheckedUpdateInput = {};
    for (const [k, v] of Object.entries(verified)) {
      if (!SERVICE_FIELD_ALLOWLIST.has(k)) continue;
      if (SERVICE_PROTECTED_FIELDS.has(k)) continue;
      (data as Record<string, unknown>)[k] = v;
    }
    await saveServiceDraft({
      id: input.entityId,
      data,
      actorId: input.actorId,
    });
    await writeAuditLog({
      actorId: input.actorId,
      action: "service.ai_assisted_draft",
      entityType: "Service",
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
