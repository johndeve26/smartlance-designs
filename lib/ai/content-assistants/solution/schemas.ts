import { z } from "zod";
import {
  faqItemSchema,
  processStepSchema,
  relationSuggestionSchema,
  reviewFindingSchema,
  stringListSchema,
} from "@/lib/ai/content-assistants/shared-generate";

export const SolutionProblemOutput = z.object({
  shortDescription: z.string().max(800).optional(),
  eyebrow: z.string().max(120).optional(),
  heroStatement: z.string().max(800).optional(),
  heroSupporting: z.string().max(1200).optional(),
  problemSymptoms: stringListSchema.optional(),
});

export const SolutionDiagnosticFlowOutput = z.object({
  problemSymptoms: stringListSchema.optional(),
  possibleCauses: z
    .array(
      z.object({
        title: z.string().max(200),
        description: z.string().max(1000),
      }),
    )
    .max(12)
    .optional(),
  whatWeReview: stringListSchema.optional(),
});

export const SolutionApproachOutput = z.object({
  process: z.array(processStepSchema).max(12).optional(),
  measurementPoints: stringListSchema.optional(),
});

export const SolutionFaqOutput = z.object({
  faqs: z.array(faqItemSchema).max(12),
});

export const SolutionSeoOutput = z.object({
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(170).optional(),
  ogTitle: z.string().max(70).optional(),
  ogDescription: z.string().max(170).optional(),
});

export const SolutionServiceSuggestions = z.object({
  suggestions: z.array(relationSuggestionSchema).max(20),
  relatedServiceReasons: z
    .array(
      z.object({
        href: z.string(),
        title: z.string(),
        reason: z.string().max(500),
      }),
    )
    .max(12)
    .optional(),
});

export const SolutionRelationSuggestions = z.object({
  suggestions: z.array(relationSuggestionSchema).max(20),
});

export const SolutionReviewOutput = z.object({
  findings: z.array(reviewFindingSchema).max(40),
});

export const SolutionFullProposalOutput = z.object({
  shortDescription: z.string().max(800).optional(),
  eyebrow: z.string().max(120).optional(),
  heroStatement: z.string().max(800).optional(),
  heroSupporting: z.string().max(1200).optional(),
  problemSymptoms: stringListSchema.optional(),
  possibleCauses: z
    .array(
      z.object({
        title: z.string().max(200),
        description: z.string().max(1000),
      }),
    )
    .max(12)
    .optional(),
  whatWeReview: stringListSchema.optional(),
  process: z.array(processStepSchema).max(12).optional(),
  measurementPoints: stringListSchema.optional(),
  relatedServiceReasons: z
    .array(
      z.object({
        href: z.string(),
        title: z.string(),
        reason: z.string().max(500),
      }),
    )
    .max(12)
    .optional(),
  faqs: z.array(faqItemSchema).max(12).optional(),
  ctaTitle: z.string().max(120).optional(),
  ctaDescription: z.string().max(500).optional(),
  primaryCtaLabel: z.string().max(80).optional(),
  primaryCtaHref: z.string().max(200).optional(),
  secondaryCtaLabel: z.string().max(80).optional(),
  secondaryCtaHref: z.string().max(200).optional(),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(170).optional(),
  ogTitle: z.string().max(70).optional(),
  ogDescription: z.string().max(170).optional(),
  relatedPlatformSlugs: z.array(z.string()).max(12).optional(),
  relatedIndustrySlugs: z.array(z.string()).max(12).optional(),
  relatedProjectSlugs: z.array(z.string()).max(12).optional(),
  relatedArticleSlugs: z.array(z.string()).max(12).optional(),
  relatedSolutions: z
    .array(z.object({ slug: z.string(), prompt: z.string().max(300) }))
    .max(8)
    .optional(),
});

/**
 * pageContent must preserve kind + slug. Nested structure is validated loosely
 * but arbitrary HTML/React is rejected (plain JSON objects/strings/arrays only).
 */
export const SolutionPageContentProposal = z
  .object({
    kind: z.string().min(1),
    slug: z.string().min(1),
  })
  .passthrough()
  .superRefine((val, ctx) => {
    const json = JSON.stringify(val);
    if (json.includes("<script") || json.includes("</html>")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "HTML is not allowed in pageContent proposals",
      });
    }
  });

export function assertPageContentCompatible(
  current: unknown,
  proposed: unknown,
): Record<string, unknown> {
  const parsed = SolutionPageContentProposal.parse(proposed);
  if (!current || typeof current !== "object") {
    throw new Error("Cannot apply pageContent without an existing structure.");
  }
  const cur = current as Record<string, unknown>;
  if (cur.kind && parsed.kind !== cur.kind) {
    throw new Error("pageContent kind must match the existing Solution page.");
  }
  if (cur.slug && parsed.slug !== cur.slug) {
    throw new Error("pageContent slug must match the existing Solution.");
  }
  // Merge: preserve existing keys; overlay proposed string/array leaves only one level deep for safety
  return { ...cur, ...parsed, kind: cur.kind, slug: cur.slug };
}
