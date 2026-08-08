import { z } from "zod";
import {
  faqItemSchema,
  processStepSchema,
  relationSuggestionSchema,
  reviewFindingSchema,
  stringListSchema,
} from "@/lib/ai/content-assistants/shared-generate";

export const ServicePositioningOutput = z.object({
  summary: z.string().max(600).optional(),
  description: z.string().max(4000).optional(),
  tagline: z.string().max(200).optional(),
  narrativeTitle: z.string().max(200).optional(),
  narrative: z.string().max(4000).optional(),
  seoConnection: z.string().max(2000).optional(),
  audience: z.string().max(500).optional(),
  platformsNote: z.string().max(500).optional(),
});

export const ServiceProcessOutput = z.object({
  process: z.array(processStepSchema).max(12).optional(),
  deliverables: stringListSchema.optional(),
  evaluationItems: stringListSchema.optional(),
});

export const ServiceFaqOutput = z.object({
  faqs: z.array(faqItemSchema).max(12),
});

export const ServiceSeoOutput = z.object({
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(170).optional(),
  ogTitle: z.string().max(70).optional(),
  ogDescription: z.string().max(170).optional(),
});

export const ServiceRelationSuggestions = z.object({
  suggestions: z.array(relationSuggestionSchema).max(20),
});

export const ServiceReviewOutput = z.object({
  findings: z.array(reviewFindingSchema).max(40),
});

export const ServiceFullProposalOutput = z.object({
  summary: z.string().max(600).optional(),
  description: z.string().max(4000).optional(),
  tagline: z.string().max(200).optional(),
  narrativeTitle: z.string().max(200).optional(),
  narrative: z.string().max(4000).optional(),
  seoConnection: z.string().max(2000).optional(),
  audience: z.string().max(500).optional(),
  platformsNote: z.string().max(500).optional(),
  capabilities: stringListSchema.optional(),
  idealFor: stringListSchema.optional(),
  problems: stringListSchema.optional(),
  deliverables: stringListSchema.optional(),
  process: z.array(processStepSchema).max(12).optional(),
  evaluationItems: stringListSchema.optional(),
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
  relatedSolutionSlugs: z.array(z.string()).max(12).optional(),
  relatedPlatformSlugs: z.array(z.string()).max(12).optional(),
  relatedProjectSlugs: z.array(z.string()).max(12).optional(),
  relatedServiceSlugs: z.array(z.string()).max(12).optional(),
});

export const ServiceFieldImproveOutput = z.object({
  field: z.string(),
  value: z.unknown(),
});

export type ServiceFullProposal = z.infer<typeof ServiceFullProposalOutput>;
