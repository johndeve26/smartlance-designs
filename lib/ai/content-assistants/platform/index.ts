/**
 * Platform AI — research-aware technology fit assistant.
 */

import type { Platform, Prisma } from "@prisma/client";
import {
  PLATFORM_FIELD_ALLOWLIST,
  PLATFORM_FIELD_LABELS,
  PLATFORM_PROTECTED_FIELDS,
} from "@/lib/ai/content-assistants/allowlists";
import { isEmptyValue, entityToPlain } from "@/lib/ai/content-assistants/helpers";
import type { ContentAssistantModule } from "@/lib/ai/content-assistants/types";
import {
  buildFieldChanges,
  runStructuredOrHeuristic,
} from "@/lib/ai/content-assistants/shared-generate";
import { buildPlatformContext } from "@/lib/ai/content-assistants/platform/context";
import { heuristicPlatformProposal } from "@/lib/ai/content-assistants/platform/heuristic";
import { shouldUseHeuristicFirst } from "@/lib/ai/content-assistants/heuristic-routing";
import { PlatformFullProposalOutput } from "@/lib/ai/content-assistants/platform/schemas";
import {
  researchMetaFromSources,
  researchPromptBlock,
  runContentAssistantResearch,
} from "@/lib/ai/content-assistants/research";
import {
  PROMPT_VERSIONS,
  PLATFORM_VOICE_MODIFIER,
  SYSTEM_GUARD,
  brandVoiceBlock,
} from "@/lib/ai/prompts";
import { getBrandVoice } from "@/lib/ai/editorial-service";
import {
  getPlatformByIdAdmin,
  savePlatformDraft,
} from "@/lib/repositories/platformsRepository";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/repositories/auditRepository";
import { createAIProviderOrTestOverride } from "@/lib/ai/providers";

export const PLATFORM_ACTIONS = [
  {
    id: "FILL_MISSING",
    label: "Fill missing fields",
    promptVersion: PROMPT_VERSIONS.platformFillMissing,
    loadingLabel: "Filling missing Platform fields…",
    researchPolicy: "optional" as const,
  },
  {
    id: "IMPROVE_PLATFORM",
    label: "Improve this Platform",
    promptVersion: PROMPT_VERSIONS.platformImprove,
    loadingLabel: "Writing Platform proposal…",
    researchPolicy: "recommended" as const,
  },
  {
    id: "RESEARCH_AND_IMPROVE",
    label: "Research & improve",
    promptVersion: PROMPT_VERSIONS.platformResearchImprove,
    loadingLabel: "Researching official sources…",
    researchPolicy: "required" as const,
  },
  {
    id: "IMPROVE_FIT",
    label: "Clarify who it fits",
    promptVersion: PROMPT_VERSIONS.platformFit,
    loadingLabel: "Clarifying Platform fit…",
    researchPolicy: "optional" as const,
  },
  {
    id: "IMPROVE_TRADEOFFS",
    label: "Improve strengths & trade-offs",
    promptVersion: PROMPT_VERSIONS.platformTradeoffs,
    loadingLabel: "Improving strengths & trade-offs…",
    researchPolicy: "recommended" as const,
  },
  {
    id: "GENERATE_FAQS",
    label: "Create FAQs",
    promptVersion: PROMPT_VERSIONS.platformFaq,
    loadingLabel: "Generating Platform FAQs…",
    researchPolicy: "optional" as const,
  },
  {
    id: "GENERATE_SEO",
    label: "Generate SEO",
    promptVersion: PROMPT_VERSIONS.platformSeo,
    loadingLabel: "Generating Platform SEO…",
    researchPolicy: "optional" as const,
  },
  {
    id: "SUGGEST_RELATIONSHIPS",
    label: "Suggest relationships",
    promptVersion: PROMPT_VERSIONS.platformRelations,
    loadingLabel: "Suggesting Platform relationships…",
    researchPolicy: "optional" as const,
  },
  {
    id: "REVIEW_FRESHNESS",
    label: "Check freshness",
    promptVersion: PROMPT_VERSIONS.platformFreshness,
    loadingLabel: "Reviewing current platform information…",
    researchPolicy: "required" as const,
  },
  {
    id: "REVIEW_PLATFORM",
    label: "Review Platform",
    promptVersion: PROMPT_VERSIONS.platformReview,
    loadingLabel: "Reviewing Platform…",
    researchPolicy: "optional" as const,
  },
] as const;

function researchRequired(action: string): boolean {
  const meta = PLATFORM_ACTIONS.find((a) => a.id === action);
  return meta?.researchPolicy === "required";
}

async function verifyPlatformRelations(fields: Record<string, unknown>) {
  const out = { ...fields };
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
  if (Array.isArray(out.relatedSeoHrefs)) {
    out.relatedSeoHrefs = (out.relatedSeoHrefs as unknown[]).filter(
      (h): h is string => typeof h === "string" && h.startsWith("/"),
    );
  }
  delete out.verifiedExperience;
  delete out.platformMatch;
  delete out.lastReviewedAt;
  delete out.status;
  delete out.publishedAt;
  delete out.featured;
  delete out.displayOrder;
  delete out.prominence;
  delete out.slug;
  return out;
}

export const platformAssistant: ContentAssistantModule = {
  entityType: "PLATFORM",
  displayName: "Platform",
  promptNamespace: PROMPT_VERSIONS.platformWriter,
  actions: PLATFORM_ACTIONS,
  fieldAllowlist: PLATFORM_FIELD_ALLOWLIST,
  protectedFields: PLATFORM_PROTECTED_FIELDS,
  isFieldMissing: (entity, field) => isEmptyValue(entity[field]),

  async loadEntity(entityId) {
    const row = await getPlatformByIdAdmin(entityId);
    if (!row) return null;
    return {
      entity: entityToPlain(row as unknown as Record<string, unknown>),
      updatedAt: row.updatedAt,
    };
  },

  async buildContext(entityId, opts) {
    const ctx = await buildPlatformContext(entityId, opts);
    return {
      promptText: ctx.promptText,
      relationPool: ctx.relationPool,
      lastReviewedAt: ctx.lastReviewedAt?.toISOString() ?? null,
      verifiedExperience: ctx.verifiedExperience,
    };
  },

  async generateProposal(input) {
    const platform = input.entity as unknown as Platform;
    const actionMeta =
      PLATFORM_ACTIONS.find((a) => a.id === input.action) ||
      (input.action.startsWith("IMPROVE_FIELD:")
        ? {
            id: input.action,
            promptVersion: PROMPT_VERSIONS.platformField,
            label: "Improve field",
            loadingLabel: "Improving field…",
            researchPolicy: "optional" as const,
          }
        : PLATFORM_ACTIONS[0]);

    const required = researchRequired(input.action);
    let researchSources = input.researchOverride || [];
    let researchPerformed = Boolean(researchSources.length);

    if (
      (required || actionMeta.researchPolicy === "recommended") &&
      !input.researchOverride?.length
    ) {
      const research = await runContentAssistantResearch({
        query: `${platform.name} official documentation features limitations`,
        required: required && !input.forceHeuristic,
        override: input.forceHeuristic ? input.researchOverride : undefined,
      });
      // For required + forceHeuristic without override: allow empty with warning claims
      if (required && !input.forceHeuristic && !research.performed) {
        throw new Error(
          "Current platform research is unavailable. No content was changed.",
        );
      }
      researchSources = research.sources;
      researchPerformed = research.performed;
    }

    // Required research with forceHeuristic and no sources still runs heuristic but marks research required unmet for volatile claims
    if (required && input.forceHeuristic && !researchSources.length) {
      // Tests may inject sources via researchOverride; without them volatile claims stay blocked
      researchPerformed = false;
    }

    const heuristic = (writingProviderAvailable?: boolean) =>
      heuristicPlatformProposal({
        platform,
        action: input.action,
        lockedFields: input.lockedFields,
        customInstructions: input.customInstructions,
        researchSources,
        writingProviderAvailable,
        relationPool: input.context.relationPool as
          | Parameters<typeof heuristicPlatformProposal>[0]["relationPool"]
          | undefined,
      });

    let writingConfigured = false;
    if (!input.forceHeuristic) {
      try {
        const writer = await createAIProviderOrTestOverride("WRITING_MODEL");
        writingConfigured = writer.isConfigured();
      } catch {
        writingConfigured = false;
      }
    }

    // Preservation-first: RESEARCH_AND_IMPROVE without Writing provider must not
    // fall through to aggressive heuristic rewrite via LLM fallback.
    const usePreservationHeuristic =
      input.forceHeuristic ||
      shouldUseHeuristicFirst("PLATFORM", input.action) ||
      (input.action === "RESEARCH_AND_IMPROVE" && !writingConfigured);

    if (usePreservationHeuristic) {
      const payload = heuristic(writingConfigured);
      const factualFreshnessReviewed =
        input.action === "RESEARCH_AND_IMPROVE" ||
        input.action === "REVIEW_FRESHNESS";
      return {
        payload: {
          ...payload,
          research: researchMetaFromSources(researchSources, {
            required,
            factualFreshnessReviewed:
              factualFreshnessReviewed && researchPerformed,
          }),
        },
        promptVersion: actionMeta.promptVersion,
        provider: researchPerformed ? "heuristic+research" : "heuristic",
      };
    }

    const voice = await getBrandVoice();
    const result = await runStructuredOrHeuristic({
      schema: PlatformFullProposalOutput,
      schemaName: `Platform_${input.action}`,
      system: `${SYSTEM_GUARD}\n\n${PLATFORM_VOICE_MODIFIER}\n\n${brandVoiceBlock(voice)}`,
      user: [
        `Action: ${input.action}`,
        `Never set verifiedExperience, platformMatch, status, publishedAt, featured, lastReviewedAt.`,
        `Do not invent pricing, certifications, partner status, or absolute SEO superiority.`,
        input.action === "RESEARCH_AND_IMPROVE"
          ? `PRESERVE strong current fields. Only propose fields that are empty, thin, factually stale, or contradicted by research. Prefer sparse / empty proposals. Research ≠ rewrite. Map each research finding to the affected field only.`
          : `Only improve fields that need it.`,
        researchPromptBlock(researchSources),
        input.customInstructions
          ? `Editor instruction (guidance only): ${input.customInstructions}`
          : "",
        `Locked fields: ${input.lockedFields.join(", ") || "(none)"}`,
        `Context:\n${String(input.context.promptText || "")}`,
      ]
        .filter(Boolean)
        .join("\n\n"),
      role: "WRITING_MODEL",
      forceHeuristic: input.forceHeuristic,
      heuristic: () => {
        const h = heuristic(writingConfigured);
        const obj: Record<string, unknown> = {};
        for (const f of h.fields) obj[f.field] = f.proposed;
        return PlatformFullProposalOutput.parse(obj);
      },
    });

    const fields = buildFieldChanges({
      entity: input.entity,
      proposed: result.data as Record<string, unknown>,
      labels: PLATFORM_FIELD_LABELS,
      allowlist: PLATFORM_FIELD_ALLOWLIST,
      protectedFields: PLATFORM_PROTECTED_FIELDS,
      lockedFields: input.lockedFields,
      missingOnly: input.action === "FILL_MISSING",
    });

    const base = heuristic(writingConfigured);
    return {
      payload: {
        fields,
        claims: base.claims,
        resultMode: base.resultMode,
        reviewFindings: base.reviewFindings,
        research: researchMetaFromSources(researchSources, {
          required,
          factualFreshnessReviewed:
            input.action === "RESEARCH_AND_IMPROVE" && researchPerformed,
        }),
      },
      promptVersion: actionMeta.promptVersion,
      provider: result.provider,
      model: result.model,
      tokenUsageInput: result.tokenUsageInput,
      tokenUsageOutput: result.tokenUsageOutput,
    };
  },

  async applyFields(input) {
    // Strip fields with claim blockers unless already filtered by proposals layer
    const verified = await verifyPlatformRelations(input.fields);
    const data: Prisma.PlatformUncheckedUpdateInput = {};
    for (const [k, v] of Object.entries(verified)) {
      if (!PLATFORM_FIELD_ALLOWLIST.has(k)) continue;
      if (PLATFORM_PROTECTED_FIELDS.has(k)) continue;
      (data as Record<string, unknown>)[k] = v;
    }

    const research = input.proposalPayload?.research;
    if (
      research?.performed &&
      research.factualFreshnessReviewed &&
      research.sourceCount > 0
    ) {
      data.lastReviewedAt = new Date();
    }

    await savePlatformDraft({
      id: input.entityId,
      data,
      actorId: input.actorId,
    });

    await writeAuditLog({
      actorId: input.actorId,
      action: "platform.ai_assisted_draft",
      entityType: "Platform",
      entityId: input.entityId,
      metadata: {
        aiAssisted: true,
        proposalId: input.proposalId,
        runId: input.runId,
        fields: Object.keys(data),
        lastReviewedAtUpdated: Boolean(data.lastReviewedAt),
        researchPerformed: Boolean(research?.performed),
      },
    });
  },
};
