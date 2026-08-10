import { z } from "zod";

export const reviewAiOutputSchema = z.object({
  overallDirection: z.enum([
    "STRONG_FOUNDATION",
    "FOCUSED_IMPROVEMENTS",
    "SIGNIFICANT_OPPORTUNITY",
    "INSUFFICIENT_DATA",
  ]),
  executiveSummary: z.string().max(2000),
  strengths: z
    .array(
      z.object({
        category: z.string().max(100),
        title: z.string().max(200),
        explanation: z.string().max(1500),
        evidenceIds: z.array(z.string()).min(1),
        confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
      }),
    )
    .max(8),
  findings: z
    .array(
      z.object({
        category: z.string().max(100),
        severity: z.enum(["HIGH", "MEDIUM", "LOW"]),
        title: z.string().max(200),
        explanation: z.string().max(1500),
        recommendation: z.string().max(1500).optional(),
        evidenceIds: z.array(z.string()).min(1),
        confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
      }),
    )
    .max(20),
  priorities: z
    .array(
      z.object({
        category: z.string().max(100),
        severity: z.enum(["HIGH", "MEDIUM", "LOW"]),
        title: z.string().max(200),
        explanation: z.string().max(1500),
        recommendation: z.string().max(1500).optional(),
        evidenceIds: z.array(z.string()).min(1),
        confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
      }),
    )
    .max(5),
  nextSteps: z.array(z.string().max(500)).max(8),
});

export type ReviewAiOutput = z.infer<typeof reviewAiOutputSchema>;

type ReviewItemShape = {
  category?: unknown;
  title?: unknown;
  explanation?: unknown;
  severity?: unknown;
  recommendation?: unknown;
  evidenceIds?: unknown;
  confidence?: unknown;
};

function asString(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function asConfidence(value: unknown): "HIGH" | "MEDIUM" | "LOW" {
  if (value === "HIGH" || value === "MEDIUM" || value === "LOW") return value;
  return "MEDIUM";
}

function asSeverity(value: unknown): "HIGH" | "MEDIUM" | "LOW" {
  if (value === "HIGH" || value === "MEDIUM" || value === "LOW") return value;
  return "MEDIUM";
}

/** Coerce common malformed model output before Zod validation. */
export function coerceReviewAiRaw(raw: unknown): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
  const root = raw as Record<string, unknown>;

  const normalizeItem = (
    item: unknown,
    withSeverity: boolean,
  ): Record<string, unknown> | null => {
    if (typeof item === "string") {
      // Plain strings cannot cite evidence — drop rather than fail schema validation.
      return null;
    }
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    const row = item as ReviewItemShape;
    const evidenceIds = Array.isArray(row.evidenceIds)
      ? row.evidenceIds.filter((id): id is string => typeof id === "string")
      : typeof row.evidenceIds === "string"
        ? [row.evidenceIds]
        : [];
    if (evidenceIds.length === 0) return null;
    return {
      category: asString(row.category, 100) || "General",
      title: asString(row.title, 200) || "Observation",
      explanation: asString(row.explanation, 1500) || asString(row.title, 1500),
      ...(withSeverity ? { severity: asSeverity(row.severity) } : {}),
      recommendation: row.recommendation
        ? asString(row.recommendation, 1500)
        : undefined,
      evidenceIds,
      confidence: asConfidence(row.confidence),
    };
  };

  const normalizeList = (items: unknown, withSeverity: boolean) =>
    Array.isArray(items)
      ? items
          .map((item) => normalizeItem(item, withSeverity))
          .filter((item): item is Record<string, unknown> => item !== null)
      : [];

  return {
    ...root,
    executiveSummary: asString(root.executiveSummary, 2000),
    strengths: normalizeList(root.strengths, false),
    findings: normalizeList(root.findings, true),
    priorities: normalizeList(root.priorities, true),
    nextSteps: Array.isArray(root.nextSteps)
      ? root.nextSteps
          .filter((step): step is string => typeof step === "string")
          .map((step) => step.slice(0, 500))
      : [],
  };
}

/** Zod schema with coercion for provider structured output parsing. */
export const reviewAiOutputCoercedSchema = z.preprocess(
  coerceReviewAiRaw,
  reviewAiOutputSchema,
);

export function parseReviewAiOutput(raw: unknown): ReviewAiOutput {
  return reviewAiOutputCoercedSchema.parse(raw);
}

export const PERFORMANCE_CLAIM_TYPES = new Set([
  "performance_measured",
  "page_speed",
  "lighthouse",
]);

export const RANKING_CLAIM_TYPES = new Set([
  "search_ranking",
  "ranking",
]);

export function validateReviewAiOutput(
  output: ReviewAiOutput,
  validEvidenceIds: Set<string>,
  evidenceTypes: Map<string, string>,
): ReviewAiOutput {
  const filterItem = <
    T extends { evidenceIds: string[]; title: string; explanation: string },
  >(
    item: T,
  ): T | null => {
    const evidenceIds = item.evidenceIds.filter((id) => validEvidenceIds.has(id));
    if (evidenceIds.length === 0) return null;

    const hasPerformanceClaim =
      /slow|speed|load time|page speed|lighthouse|performance score/i.test(
        `${item.title} ${item.explanation}`,
      );
    const hasRankingClaim =
      /rank poorly|ranking|google rank|search position|penaliz/i.test(
        `${item.title} ${item.explanation}`,
      );
    const hasConversionClaim =
      /conversion rate|losing customers|losing sales|losing leads/i.test(
        `${item.title} ${item.explanation}`,
      );

    const citedTypes = evidenceIds.map((id) => evidenceTypes.get(id) ?? "");
    const hasPerformanceEvidence = citedTypes.some((t) =>
      PERFORMANCE_CLAIM_TYPES.has(t),
    );
    const hasRankingEvidence = citedTypes.some((t) => RANKING_CLAIM_TYPES.has(t));

    if (hasPerformanceClaim && !hasPerformanceEvidence) return null;
    if (hasRankingClaim && !hasRankingEvidence) return null;
    if (hasConversionClaim) return null;

    return { ...item, evidenceIds };
  };

  return {
    ...output,
    strengths: output.strengths
      .map(filterItem)
      .filter((s): s is NonNullable<typeof s> => s !== null),
    findings: output.findings
      .map(filterItem)
      .filter((f): f is NonNullable<typeof f> => f !== null),
    priorities: output.priorities
      .map(filterItem)
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .slice(0, 5),
  };
}
