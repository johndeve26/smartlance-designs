/**
 * Industry AI — sector-specific CMS assistant with experience boundary.
 */

import type { Industry, Prisma } from "@prisma/client";
import {
  INDUSTRY_FIELD_ALLOWLIST,
  INDUSTRY_FIELD_LABELS,
  INDUSTRY_PROTECTED_FIELDS,
} from "@/lib/ai/content-assistants/allowlists";
import { isEmptyValue, entityToPlain } from "@/lib/ai/content-assistants/helpers";
import type { ContentAssistantModule } from "@/lib/ai/content-assistants/types";
import {
  buildFieldChanges,
  runStructuredOrHeuristic,
} from "@/lib/ai/content-assistants/shared-generate";
import { buildIndustryContext } from "@/lib/ai/content-assistants/industry/context";
import { heuristicIndustryProposal } from "@/lib/ai/content-assistants/industry/heuristic";
import { IndustryContentOutput } from "@/lib/ai/content-assistants/industry/schemas";
import {
  researchMetaFromSources,
  researchPromptBlock,
  runContentAssistantResearch,
} from "@/lib/ai/content-assistants/research";
import {
  PROMPT_VERSIONS,
  INDUSTRY_VOICE_MODIFIER,
  SYSTEM_GUARD,
  brandVoiceBlock,
} from "@/lib/ai/prompts";
import { getBrandVoice } from "@/lib/ai/editorial-service";
import {
  getIndustryByIdAdmin,
  saveIndustry,
} from "@/lib/repositories/industriesRepository";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/repositories/auditRepository";
import { shouldUseHeuristicFirst } from "@/lib/ai/content-assistants/heuristic-routing";

export const INDUSTRY_ACTIONS = [
  {
    id: "FILL_MISSING",
    label: "Fill missing fields",
    promptVersion: PROMPT_VERSIONS.industryFillMissing,
    loadingLabel: "Filling missing Industry fields…",
    researchPolicy: "optional" as const,
  },
  {
    id: "IMPROVE_INDUSTRY",
    label: "Improve this Industry",
    promptVersion: PROMPT_VERSIONS.industryImprove,
    loadingLabel: "Writing Industry proposal…",
    researchPolicy: "optional" as const,
  },
  {
    id: "RESEARCH_INDUSTRY_NEEDS",
    label: "Research industry needs",
    promptVersion: PROMPT_VERSIONS.industryResearch,
    loadingLabel: "Researching industry needs…",
    researchPolicy: "recommended" as const,
  },
  {
    id: "IMPROVE_SPECIFICITY",
    label: "Make this more industry-specific",
    promptVersion: PROMPT_VERSIONS.industrySpecificity,
    loadingLabel: "Improving Industry specificity…",
    researchPolicy: "optional" as const,
  },
  {
    id: "GENERATE_SEO",
    label: "Generate SEO",
    promptVersion: PROMPT_VERSIONS.industrySeo,
    loadingLabel: "Generating Industry SEO…",
    researchPolicy: "optional" as const,
  },
  {
    id: "SUGGEST_SERVICES",
    label: "Suggest Services",
    promptVersion: PROMPT_VERSIONS.industryServices,
    loadingLabel: "Suggesting Services…",
    researchPolicy: "optional" as const,
  },
  {
    id: "SUGGEST_SOLUTIONS",
    label: "Suggest Solutions",
    promptVersion: PROMPT_VERSIONS.industrySolutions,
    loadingLabel: "Suggesting Solutions…",
    researchPolicy: "optional" as const,
  },
  {
    id: "SUGGEST_WORK",
    label: "Suggest proof",
    promptVersion: PROMPT_VERSIONS.industryWork,
    loadingLabel: "Suggesting proof…",
    researchPolicy: "optional" as const,
  },
  {
    id: "SUGGEST_RELATIONSHIPS",
    label: "Suggest relationships",
    promptVersion: PROMPT_VERSIONS.industryRelations,
    loadingLabel: "Suggesting relationships…",
    researchPolicy: "optional" as const,
  },
  {
    id: "REVIEW_INDUSTRY",
    label: "Review Industry",
    promptVersion: PROMPT_VERSIONS.industryReview,
    loadingLabel: "Reviewing Industry…",
    researchPolicy: "optional" as const,
  },
] as const;

async function verifyIndustryRelations(fields: Record<string, unknown>) {
  const out = { ...fields };
  if (Array.isArray(out.relatedSolutionSlugs)) {
    const valid: string[] = [];
    for (const slug of out.relatedSolutionSlugs) {
      if (typeof slug !== "string") continue;
      const row = await prisma.solution.findFirst({
        where: { slug, status: "PUBLISHED" },
        select: { slug: true },
      });
      if (row) valid.push(row.slug);
    }
    out.relatedSolutionSlugs = valid;
  }
  if (Array.isArray(out.relatedServiceLinks)) {
    const valid = [];
    for (const item of out.relatedServiceLinks) {
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
          label:
            (item as { label?: string }).label ||
            (item as { title?: string }).title ||
            row.title,
        });
      }
    }
    out.relatedServiceLinks = valid;
  }
  delete out.group;
  delete out.hasVerifiedProjectExperience;
  delete out.status;
  delete out.publishedAt;
  delete out.featured;
  delete out.displayOrder;
  delete out.slug;
  return out;
}

export const industryAssistant: ContentAssistantModule = {
  entityType: "INDUSTRY",
  displayName: "Industry",
  promptNamespace: PROMPT_VERSIONS.industryWriter,
  actions: INDUSTRY_ACTIONS,
  fieldAllowlist: INDUSTRY_FIELD_ALLOWLIST,
  protectedFields: INDUSTRY_PROTECTED_FIELDS,
  isFieldMissing: (entity, field) => isEmptyValue(entity[field]),

  async loadEntity(entityId) {
    const row = await getIndustryByIdAdmin(entityId);
    if (!row) return null;
    return {
      entity: entityToPlain(row as unknown as Record<string, unknown>),
      updatedAt: row.updatedAt,
    };
  },

  async buildContext(entityId, opts) {
    const ctx = await buildIndustryContext(entityId, opts);
    return {
      promptText: ctx.promptText,
      relationPool: ctx.relationPool,
      verified: ctx.verified,
      publishedWork: ctx.publishedWork,
    };
  },

  async generateProposal(input) {
    const industry = input.entity as unknown as Industry;
    const verified = Boolean(input.context.verified);
    const actionMeta =
      INDUSTRY_ACTIONS.find((a) => a.id === input.action) || INDUSTRY_ACTIONS[0];

    let researchSources = input.researchOverride || [];
    if (
      actionMeta.researchPolicy === "recommended" &&
      !input.researchOverride?.length &&
      !input.forceHeuristic
    ) {
      try {
        const research = await runContentAssistantResearch({
          query: `${industry.name} website digital buyer needs`,
          required: false,
        });
        researchSources = research.sources;
      } catch {
        researchSources = [];
      }
    }

    const heuristic = () =>
      heuristicIndustryProposal({
        industry,
        action: input.action,
        lockedFields: input.lockedFields,
        customInstructions: input.customInstructions,
        verified,
        publishedWork: input.context.publishedWork as
          | Parameters<typeof heuristicIndustryProposal>[0]["publishedWork"]
          | undefined,
        relationPool: input.context.relationPool as
          | Parameters<typeof heuristicIndustryProposal>[0]["relationPool"]
          | undefined,
      });

    if (
      input.forceHeuristic ||
      shouldUseHeuristicFirst("INDUSTRY", input.action)
    ) {
      const payload = heuristic();
      return {
        payload: {
          ...payload,
          research: researchSources.length
            ? researchMetaFromSources(researchSources, { required: false })
            : undefined,
        },
        promptVersion: actionMeta.promptVersion,
        provider: "heuristic",
      };
    }

    const voice = await getBrandVoice();
    const result = await runStructuredOrHeuristic({
      schema: IndustryContentOutput,
      schemaName: `Industry_${input.action}`,
      system: `${SYSTEM_GUARD}\n\n${INDUSTRY_VOICE_MODIFIER}\n\n${brandVoiceBlock(voice)}`,
      user: [
        `Action: ${input.action}`,
        `Experience mode: ${verified ? "PROVEN (verified Work only)" : "SUPPORTED ONLY (no fake experience)"}`,
        `Never set group or hasVerifiedProjectExperience.`,
        input.action === "IMPROVE_INDUSTRY" ||
        input.action === "IMPROVE_SPECIFICITY"
          ? "Require sector-specific visitor decisions, trust factors, or workflows. Fail the substitution test (copy must not work unchanged for a different industry). Prefer concise specific copy over long generic copy. Preserve already-specific descriptions."
          : input.action === "GENERATE_SEO"
            ? "SEO from industry website intent — not mechanical ‘Web Design for {Industry}’. No unsupported expert/leading claims."
            : "",
        researchPromptBlock(researchSources),
        input.customInstructions
          ? `Editor instruction: ${input.customInstructions}`
          : "",
        `Context:\n${String(input.context.promptText || "")}`,
      ]
        .filter(Boolean)
        .join("\n\n"),
      role: "WRITING_MODEL",
      forceHeuristic: input.forceHeuristic,
      heuristic: () => {
        const h = heuristic();
        const obj: Record<string, unknown> = {};
        for (const f of h.fields) obj[f.field] = f.proposed;
        return IndustryContentOutput.parse(obj);
      },
    });

    const fields = buildFieldChanges({
      entity: input.entity,
      proposed: result.data as Record<string, unknown>,
      labels: INDUSTRY_FIELD_LABELS,
      allowlist: INDUSTRY_FIELD_ALLOWLIST,
      protectedFields: INDUSTRY_PROTECTED_FIELDS,
      lockedFields: input.lockedFields,
      missingOnly: input.action === "FILL_MISSING",
    });

    return {
      payload: {
        fields,
        research: researchSources.length
          ? researchMetaFromSources(researchSources, { required: false })
          : undefined,
      },
      promptVersion: actionMeta.promptVersion,
      provider: result.provider,
      model: result.model,
      tokenUsageInput: result.tokenUsageInput,
      tokenUsageOutput: result.tokenUsageOutput,
    };
  },

  async applyFields(input) {
    const verified = await verifyIndustryRelations(input.fields);
    const data: Prisma.IndustryUncheckedUpdateInput = {};
    for (const [k, v] of Object.entries(verified)) {
      if (!INDUSTRY_FIELD_ALLOWLIST.has(k)) continue;
      if (INDUSTRY_PROTECTED_FIELDS.has(k)) continue;
      (data as Record<string, unknown>)[k] = v;
    }

    // Keep status as draft when applying AI to a published industry
    const existing = await getIndustryByIdAdmin(input.entityId);
    if (!existing) throw new Error("Industry not found");
    if (existing.status === "PUBLISHED") {
      data.status = "DRAFT";
    }

    await saveIndustry({
      id: input.entityId,
      data,
      actorId: input.actorId,
    });

    await writeAuditLog({
      actorId: input.actorId,
      action: "industry.ai_assisted_draft",
      entityType: "Industry",
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
