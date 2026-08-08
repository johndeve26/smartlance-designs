import { z } from "zod";

export type AIRoleModel =
  | "RESEARCH_MODEL"
  | "WRITING_MODEL"
  | "EDITOR_MODEL"
  | "FAST_MODEL";

export type TokenUsage = {
  input?: number;
  output?: number;
};

export type GenerateTextResult = {
  text: string;
  usage?: TokenUsage;
  requestId?: string;
  model: string;
  provider: string;
};

export type GenerateStructuredResult<T> = {
  data: T;
  usage?: TokenUsage;
  requestId?: string;
  model: string;
  provider: string;
  rawText?: string;
};

export type ReviewSeverity = "PASS" | "WARNING" | "REVIEW" | "BLOCKER";

export const reviewFindingSchema = z.object({
  id: z.string(),
  category: z.string(),
  severity: z.enum(["PASS", "WARNING", "REVIEW", "BLOCKER"]),
  message: z.string(),
  suggestion: z.string().optional(),
});

export const briefSchema = z.object({
  workingTitle: z.string(),
  audience: z.string(),
  primaryIntent: z.string(),
  problemQuestion: z.string(),
  primaryTopic: z.string(),
  secondaryTopics: z.array(z.string()).default([]),
  uniqueValue: z.string(),
  recommendedFormat: z.string(),
  keyQuestions: z.array(z.string()).default([]),
  entities: z.array(z.string()).default([]),
  internalOpportunities: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
  ctaIntent: z.string(),
  commodityRisk: z.boolean().default(false),
});

export const outlineSectionSchema = z.object({
  id: z.string(),
  heading: z.string(),
  purpose: z.string(),
  readerQuestion: z.string().optional(),
  keyPoints: z.array(z.string()).default([]),
  sourceIds: z.array(z.string()).default([]),
  internalLinkHints: z.array(z.string()).default([]),
  estimatedDepth: z.enum(["brief", "standard", "deep"]).default("standard"),
  locked: z.boolean().default(false),
  draftMarkdown: z.string().optional(),
});

export const outlineSchema = z.object({
  title: z.string(),
  sections: z.array(outlineSectionSchema),
});

export const claimExtractSchema = z.object({
  claims: z.array(
    z.object({
      claimText: z.string(),
      support: z.enum([
        "SUPPORTED_EXTERNAL",
        "SUPPORTED_INTERNAL",
        "GENERAL_KNOWLEDGE",
        "EDITORIAL_OPINION",
        "UNSUPPORTED",
        "TIME_SENSITIVE",
      ]),
      sectionHint: z.string().optional(),
      sourceUrls: z.array(z.string()).default([]),
      numerical: z.boolean().default(false),
      /** Per-source evidence quality — citation ≠ support */
      sourceEvidence: z
        .array(
          z.object({
            url: z.string(),
            strength: z.enum(["DIRECT", "PARTIAL", "CONTEXTUAL", "INSUFFICIENT"]),
            evidenceSummary: z.string().max(400).optional(),
          }),
        )
        .default([]),
    }),
  ),
});

export const seoReviewSchema = z.object({
  findings: z.array(reviewFindingSchema),
  titleOptions: z
    .array(
      z.object({
        title: z.string(),
        angle: z.string(),
      }),
    )
    .default([]),
  seoTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  slugSuggestion: z.string().optional(),
});

export const aiSearchReviewSchema = z.object({
  findings: z.array(reviewFindingSchema),
  answerFirstPresent: z.boolean(),
  originalValueStatement: z.string(),
  commodityRisk: z.boolean(),
  extractablePassages: z.array(z.string()).default([]),
  entities: z.array(z.string()).default([]),
});

export const internalLinkSuggestionSchema = z.object({
  suggestions: z.array(
    z.object({
      anchorText: z.string(),
      destinationPath: z.string(),
      reason: z.string(),
      suggestedLocation: z.string(),
      confidence: z.enum(["high", "medium", "low"]),
      entityId: z.string().optional(),
      entityType: z.string().optional(),
    }),
  ),
});

export const researchNotesSchema = z.object({
  keyFacts: z.array(z.string()).default([]),
  definitions: z.array(z.string()).default([]),
  currentGuidance: z.array(z.string()).default([]),
  controversies: z.array(z.string()).default([]),
  uniqueAngles: z.array(z.string()).default([]),
  unansweredVsSite: z.array(z.string()).default([]),
  intentHypothesis: z.string(),
  intentReasoning: z.string(),
});

export const cannibalizationSchema = z.object({
  classification: z.enum([
    "NO_SIGNIFICANT_OVERLAP",
    "RELATED_BUT_DISTINCT",
    "POTENTIAL_CANNIBALIZATION",
    "BETTER_AS_UPDATE",
  ]),
  related: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      slug: z.string(),
      path: z.string(),
      reason: z.string(),
    }),
  ),
  recommendation: z.string(),
});

export type ContentBrief = z.infer<typeof briefSchema>;
export type Outline = z.infer<typeof outlineSchema>;
export type CannibalizationResult = z.infer<typeof cannibalizationSchema>;
