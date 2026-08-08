import { z } from "zod";
import {
  faqItemSchema,
  relationSuggestionSchema,
  reviewFindingSchema,
  stringListSchema,
} from "@/lib/ai/content-assistants/shared-generate";

export const PlatformFitOutput = z.object({
  audiences: stringListSchema.optional(),
  whenItFits: stringListSchema.optional(),
  tagline: z.string().max(200).optional(),
  summary: z.string().max(800).optional(),
});

export const PlatformTradeoffOutput = z.object({
  capabilities: stringListSchema.optional(),
  challenges: stringListSchema.optional(),
  conversionNote: z.string().max(1200).optional(),
  migrationNote: z.string().max(1200).optional(),
});

export const PlatformFaqOutput = z.object({
  faqs: z.array(faqItemSchema).max(12),
});

export const PlatformSeoOutput = z.object({
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(170).optional(),
  ogTitle: z.string().max(70).optional(),
  ogDescription: z.string().max(170).optional(),
  seoSection: z.unknown().optional(),
});

export const PlatformRelationOutput = z.object({
  suggestions: z.array(relationSuggestionSchema).max(20),
  relatedServiceHrefs: z.array(z.string()).max(12).optional(),
  relatedSeoHrefs: z.array(z.string()).max(12).optional(),
});

export const PlatformFreshnessReviewOutput = z.object({
  findings: z.array(reviewFindingSchema).max(40),
  needsResearch: z.boolean().optional(),
});

export const PlatformReviewOutput = z.object({
  findings: z.array(reviewFindingSchema).max(40),
});

export const PlatformFullProposalOutput = z.object({
  summary: z.string().max(800).optional(),
  description: z.string().max(6000).optional(),
  tagline: z.string().max(200).optional(),
  audiences: stringListSchema.optional(),
  whenItFits: stringListSchema.optional(),
  capabilities: stringListSchema.optional(),
  challenges: stringListSchema.optional(),
  conversionNote: z.string().max(1200).optional(),
  migrationNote: z.string().max(1200).optional(),
  faqs: z.array(faqItemSchema).max(12).optional(),
  ctaTitle: z.string().max(120).optional(),
  ctaDescription: z.string().max(500).optional(),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(170).optional(),
  ogTitle: z.string().max(70).optional(),
  ogDescription: z.string().max(170).optional(),
  relatedServiceHrefs: z.array(z.string()).max(12).optional(),
  relatedSeoHrefs: z.array(z.string()).max(12).optional(),
});
