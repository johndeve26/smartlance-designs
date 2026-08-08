import { z } from "zod";
import {
  relationSuggestionSchema,
  reviewFindingSchema,
  stringListSchema,
} from "@/lib/ai/content-assistants/shared-generate";

export const TestimonialFormattingOutput = z.object({
  quote: z.string().max(8000),
});

export const TestimonialExcerptOutput = z.object({
  displayExcerpt: z.string().max(2000),
});

export const TestimonialRelationSuggestion = z.object({
  suggestions: z.array(relationSuggestionSchema).max(10),
  workProjectId: z.string().optional(),
});

export const TestimonialThemeOutput = z.object({
  themesJson: stringListSchema,
});

export const TestimonialReviewOutput = z.object({
  findings: z.array(reviewFindingSchema).max(40),
});
