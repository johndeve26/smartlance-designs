import { z } from "zod";
import {
  relationSuggestionSchema,
  reviewFindingSchema,
  stringListSchema,
} from "@/lib/ai/content-assistants/shared-generate";

export const CaseStudySummaryOutput = z.object({
  shortDescription: z.string().max(500).optional(),
  overview: z.string().max(4000).optional(),
  heroStatement: z.string().max(500).optional(),
});

export const CaseStudyChallengeOutput = z.object({
  challenge: z.string().max(6000).optional(),
  challenges: stringListSchema.optional(),
});

export const CaseStudySolutionOutput = z.object({
  solution: z.string().max(6000).optional(),
  approach: z.string().max(6000).optional(),
  approachSteps: stringListSchema.optional(),
  solutionPoints: stringListSchema.optional(),
  technologies: stringListSchema.optional(),
  platformLabel: z.string().max(120).optional(),
});

export const CaseStudyVerifiedResultsOutput = z.object({
  resultSummary: z.string().max(2000).optional(),
  measurableResults: stringListSchema.optional(),
  results: z.unknown().optional(),
  outcomeHeading: z.string().max(120).optional(),
});

export const CaseStudySeoOutput = z.object({
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(170).optional(),
  ogTitle: z.string().max(70).optional(),
  ogDescription: z.string().max(170).optional(),
});

export const CaseStudyRelationSuggestions = z.object({
  suggestions: z.array(relationSuggestionSchema).max(20),
  relatedServiceHrefs: z.array(z.string()).max(12).optional(),
  servicesLabels: stringListSchema.optional(),
  platformLabel: z.string().max(120).optional(),
});

export const CaseStudyProofReviewOutput = z.object({
  findings: z.array(reviewFindingSchema).max(40),
});

export const CaseStudyReviewOutput = z.object({
  findings: z.array(reviewFindingSchema).max(40),
});

export const CaseStudyFromFactsOutput = z.object({
  shortDescription: z.string().max(500).optional(),
  overview: z.string().max(4000).optional(),
  challenge: z.string().max(6000).optional(),
  solution: z.string().max(6000).optional(),
  approach: z.string().max(6000).optional(),
  resultSummary: z.string().max(2000).optional(),
  measurableResults: stringListSchema.optional(),
  heroStatement: z.string().max(500).optional(),
  challenges: stringListSchema.optional(),
  approachSteps: stringListSchema.optional(),
  solutionPoints: stringListSchema.optional(),
  highlights: stringListSchema.optional(),
  platformContext: z.string().max(2000).optional(),
  outcomeHeading: z.string().max(120).optional(),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(170).optional(),
  ogTitle: z.string().max(70).optional(),
  ogDescription: z.string().max(170).optional(),
  platformLabel: z.string().max(120).optional(),
  servicesLabels: stringListSchema.optional(),
  technologies: stringListSchema.optional(),
  relatedServiceHrefs: z.array(z.string()).max(12).optional(),
});
