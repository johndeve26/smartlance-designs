/**
 * Testimonial Assistant — format / excerpt / themes / relations only.
 * Never generate or creatively rewrite client quotes.
 */

import type { Prisma, Testimonial } from "@prisma/client";
import {
  TESTIMONIAL_FIELD_ALLOWLIST,
  TESTIMONIAL_PROTECTED_FIELDS,
} from "@/lib/ai/content-assistants/allowlists";
import { isEmptyValue, entityToPlain } from "@/lib/ai/content-assistants/helpers";
import type { ContentAssistantModule } from "@/lib/ai/content-assistants/types";
import {
  isSafeQuoteFormat,
  isValidExcerptFromOriginal,
} from "@/lib/ai/content-assistants/proof";
import { buildTestimonialContext } from "@/lib/ai/content-assistants/testimonial/context";
import { heuristicTestimonialProposal } from "@/lib/ai/content-assistants/testimonial/heuristic";
import {
  PROMPT_VERSIONS,
  SYSTEM_GUARD,
  TESTIMONIAL_VOICE_MODIFIER,
} from "@/lib/ai/prompts";
import { saveTestimonial } from "@/lib/repositories/testimonialsRepository";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/repositories/auditRepository";

export const TESTIMONIAL_ACTIONS = [
  {
    id: "FORMAT_QUOTE",
    label: "Format quote",
    promptVersion: PROMPT_VERSIONS.testimonialFormat,
    loadingLabel: "Formatting testimonial…",
  },
  {
    id: "CREATE_EXCERPT",
    label: "Create shorter excerpt",
    promptVersion: PROMPT_VERSIONS.testimonialExcerpt,
    loadingLabel: "Creating excerpt…",
  },
  {
    id: "SUGGEST_RELATED_WORK",
    label: "Suggest related Case Study",
    promptVersion: PROMPT_VERSIONS.testimonialRelations,
    loadingLabel: "Suggesting related Case Study…",
  },
  {
    id: "CLASSIFY_THEME",
    label: "Identify themes",
    promptVersion: PROMPT_VERSIONS.testimonialTheme,
    loadingLabel: "Identifying themes…",
  },
  {
    id: "REVIEW_TESTIMONIAL",
    label: "Review Testimonial",
    promptVersion: PROMPT_VERSIONS.testimonialReview,
    loadingLabel: "Reviewing Testimonial…",
  },
] as const;

export const testimonialAssistant: ContentAssistantModule = {
  entityType: "TESTIMONIAL",
  displayName: "Testimonial",
  promptNamespace: PROMPT_VERSIONS.testimonialAssistant,
  actions: TESTIMONIAL_ACTIONS,
  fieldAllowlist: TESTIMONIAL_FIELD_ALLOWLIST,
  protectedFields: TESTIMONIAL_PROTECTED_FIELDS,
  isFieldMissing: (entity, field) => isEmptyValue(entity[field]),

  async loadEntity(entityId) {
    const row = await prisma.testimonial.findUnique({ where: { id: entityId } });
    if (!row) return null;
    return {
      entity: entityToPlain(row as unknown as Record<string, unknown>),
      updatedAt: row.updatedAt,
    };
  },

  async buildContext(entityId) {
    const ctx = await buildTestimonialContext(entityId);
    return {
      promptText: ctx.promptText,
      relationPool: ctx.relationPool,
      sourceQuote: ctx.sourceQuote,
      hasQuote: ctx.hasQuote,
    };
  },

  async generateProposal(input) {
    const testimonial = input.entity as unknown as Testimonial;
    const sourceQuote =
      String(input.context.sourceQuote || "") ||
      testimonial.originalQuote ||
      testimonial.quote ||
      "";

    const actionMeta =
      TESTIMONIAL_ACTIONS.find((a) => a.id === input.action) ||
      TESTIMONIAL_ACTIONS[0];

    // Prefer deterministic paths — no LLM for format/excerpt/theme/review
    const payload = heuristicTestimonialProposal({
      testimonial,
      action: input.action,
      lockedFields: input.lockedFields,
      sourceQuote,
      relationPool: input.context.relationPool as
        | Parameters<typeof heuristicTestimonialProposal>[0]["relationPool"]
        | undefined,
    });

    // Guard: never allow creative rewrite payloads
    for (const f of payload.fields || []) {
      if (f.field === "quote") {
        const proposed = String(f.proposed || "");
        if (!isSafeQuoteFormat(sourceQuote, proposed)) {
          f.claimBlockers = [
            "This excerpt changes the client's wording and cannot be accepted.".replace(
              "excerpt",
              "formatting",
            ),
          ];
          // Clear proposed acceptability
          f.claimBlockers = [
            "Formatting changes the client's wording and cannot be accepted.",
          ];
        }
      }
      if (f.field === "displayExcerpt") {
        const proposed = String(f.proposed || "").replace(/…/g, " ");
        if (!isValidExcerptFromOriginal(sourceQuote, proposed)) {
          f.claimBlockers = [
            "This excerpt changes the client's wording and cannot be accepted.",
          ];
        }
      }
      if (
        f.field === "name" ||
        f.field === "role" ||
        f.field === "company" ||
        f.field === "verified" ||
        f.field === "status"
      ) {
        f.claimBlockers = ["Protected attribution/verification field."];
      }
    }

    void SYSTEM_GUARD;
    void TESTIMONIAL_VOICE_MODIFIER;

    return {
      payload,
      promptVersion: actionMeta.promptVersion,
      provider: "deterministic",
    };
  },

  async applyFields(input) {
    const existing = await prisma.testimonial.findUniqueOrThrow({
      where: { id: input.entityId },
    });
    const original = existing.originalQuote || existing.quote;

    const data: Prisma.TestimonialUncheckedUpdateInput = {};
    for (const [k, v] of Object.entries(input.fields)) {
      if (!TESTIMONIAL_FIELD_ALLOWLIST.has(k)) continue;
      if (TESTIMONIAL_PROTECTED_FIELDS.has(k)) continue;

      if (k === "quote") {
        if (typeof v !== "string" || !isSafeQuoteFormat(original, v)) {
          continue;
        }
        data.quote = v;
        // Ensure originalQuote remains the immutable source
        if (!existing.originalQuote) {
          data.originalQuote = existing.quote;
        }
      } else if (k === "displayExcerpt") {
        if (
          typeof v !== "string" ||
          !isValidExcerptFromOriginal(original, v.replace(/…/g, " "))
        ) {
          continue;
        }
        data.displayExcerpt = v;
      } else if (k === "themesJson") {
        data.themesJson = v as Prisma.InputJsonValue;
      } else if (k === "workProjectId") {
        if (typeof v === "string" && v) {
          const work = await prisma.workProject.findUnique({
            where: { id: v },
            select: { id: true },
          });
          if (work) data.workProjectId = work.id;
        } else if (v === null) {
          data.workProjectId = null;
        }
      }
    }

    // Never allow verification/status/identity through this path
    delete (data as Record<string, unknown>).verified;
    delete (data as Record<string, unknown>).status;
    delete (data as Record<string, unknown>).publishedAt;
    delete (data as Record<string, unknown>).name;
    delete (data as Record<string, unknown>).role;
    delete (data as Record<string, unknown>).company;
    delete (data as Record<string, unknown>).internalVerificationNote;
    delete (data as Record<string, unknown>).featured;
    delete (data as Record<string, unknown>).displayOrder;

    if (!Object.keys(data).length) return;

    await saveTestimonial({
      id: input.entityId,
      data,
      actorId: input.actorId,
    });

    await writeAuditLog({
      actorId: input.actorId,
      action: "testimonial.ai_assisted_update",
      entityType: "Testimonial",
      entityId: input.entityId,
      metadata: {
        aiAssisted: true,
        proposalId: input.proposalId,
        runId: input.runId,
        fields: Object.keys(data),
        excerptApplied: "displayExcerpt" in data,
        quoteFormattingApplied: "quote" in data,
      },
    });
  },
};
