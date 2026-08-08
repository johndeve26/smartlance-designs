import { z } from "zod";
import {
  relationSuggestionSchema,
  reviewFindingSchema,
} from "@/lib/ai/content-assistants/shared-generate";

export const IndustryContentOutput = z.object({
  description: z.string().max(6000).optional(),
});

export const IndustryResearchOutput = z.object({
  description: z.string().max(6000).optional(),
  notes: z.string().max(2000).optional(),
});

export const IndustrySeoOutput = z.object({
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(170).optional(),
  ogTitle: z.string().max(70).optional(),
  ogDescription: z.string().max(170).optional(),
});

export const IndustryRelationshipOutput = z.object({
  suggestions: z.array(relationSuggestionSchema).max(20),
  relatedServiceLinks: z
    .array(
      z.object({
        href: z.string(),
        label: z.string().optional(),
        title: z.string().optional(),
      }),
    )
    .max(12)
    .optional(),
  relatedSolutionSlugs: z.array(z.string()).max(12).optional(),
});

export const IndustryProofSuggestionOutput = z.object({
  suggestions: z.array(relationSuggestionSchema).max(20),
});

export const IndustryReviewOutput = z.object({
  findings: z.array(reviewFindingSchema).max(40),
});
