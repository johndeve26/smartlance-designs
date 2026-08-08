/**
 * Topic Intelligence calibration evaluator (offline, mocked signals).
 * No master quality score — diagnostic confusion matrix + dimension notes.
 */

import type { TopicRecommendation } from "@prisma/client";
import { analyzeClusterToOpportunity } from "@/lib/ai/topic-intelligence/opportunity-analysis";
import { clusterSignals } from "@/lib/ai/topic-intelligence/clustering";
import type { NormalizedTopicSignal } from "@/lib/ai/topic-intelligence/types";
import {
  CALIBRATION_CONTENT_INDEX,
  CALIBRATION_COVERAGE,
  TOPIC_INTELLIGENCE_PROMPT_VERSIONS,
  listTopicCalibrationFixtures,
  listTopicCalibrationHoldout,
  type TopicCalibrationFixture,
} from "@/lib/ai/topic-intelligence/calibration/fixtures";
import { PROMPT_VERSIONS } from "@/lib/ai/prompts";

export type TopicCalibrationRowResult = {
  id: string;
  seed: string;
  category: string;
  holdout: boolean;
  expectedDecisions: TopicRecommendation[];
  expectedFormat?: string;
  actualDecision: TopicRecommendation | "NONE";
  actualFormat?: string;
  decisionMatch: boolean;
  formatMatch: boolean | null;
  cannibalizationDetected: boolean;
  reasoningQuality: "strong" | "weak" | "unknown";
  whyNow?: string;
  whySmartlance?: string;
  workingTitle?: string;
  notes: string;
};

export type DecisionConfusionCell = {
  expected: string;
  actual: string;
  count: number;
};

export type TopicCalibrationSuiteResult = {
  promptVersions: typeof TOPIC_INTELLIGENCE_PROMPT_VERSIONS;
  analysisPromptVersion: string;
  runAt: string;
  includeHoldout: boolean;
  totals: {
    fixtures: number;
    decisionMatches: number;
    decisionMismatches: number;
    formatMatches: number;
    formatChecked: number;
    falsePositiveWriteNew: number;
    falseNegativeStrong: number;
  };
  confusion: DecisionConfusionCell[];
  byCategory: Record<string, { match: number; total: number }>;
  rows: TopicCalibrationRowResult[];
};

function toSignal(
  partial: Partial<NormalizedTopicSignal> & { title: string },
): NormalizedTopicSignal {
  return {
    provider: partial.provider || "calibration-mock",
    type: partial.type || "RESEARCH",
    title: partial.title,
    summary: partial.summary,
    sourceUrl: partial.sourceUrl,
    sourceDomain: partial.sourceDomain,
    publishedAt: partial.publishedAt ?? null,
    market: partial.market || "global_en",
    language: "en",
    sourceAuthorityType: partial.sourceAuthorityType || "INDUSTRY",
    freshness: partial.freshness || "HYBRID",
    provenance: partial.provenance || {
      capability: "MANUAL",
      label: "calibration",
    },
    topics: partial.topics,
  };
}

function reasoningQuality(
  fixture: TopicCalibrationFixture,
  whyNow?: string,
  whySmartlance?: string,
): "strong" | "weak" | "unknown" {
  const text = `${whyNow || ""} ${whySmartlance || ""}`.toLowerCase();
  if (!text.trim()) return "unknown";
  const generic =
    /businesses care|good topic|websites are important|people search|trending/i.test(
      text,
    );
  if (generic) return "weak";
  if (!fixture.reasoningHints?.length) return "unknown";
  const hit = fixture.reasoningHints.some((h) => text.includes(h.toLowerCase()));
  return hit ? "strong" : "weak";
}

/** Primary expected bucket for confusion matrix (first expected decision). */
function expectedBucket(fixture: TopicCalibrationFixture): string {
  const d = fixture.expectedDecisions[0];
  if (!d) return "UNKNOWN";
  if (d === "WRITE_NEW" || d === "SUPPORT_COMMERCIAL_PAGE") return "WRITE_OR_SUPPORT";
  if (
    d === "UPDATE_EXISTING" ||
    d === "EXPAND_EXISTING_RESOURCE" ||
    d === "UPDATE_SERVICE_PAGE" ||
    d === "UPDATE_SOLUTION_PAGE" ||
    d === "UPDATE_PLATFORM_PAGE"
  ) {
    return "UPDATE_OR_EXPAND";
  }
  return d;
}

function actualBucket(rec: TopicRecommendation | "NONE"): string {
  if (rec === "NONE") return "NONE";
  if (rec === "WRITE_NEW" || rec === "SUPPORT_COMMERCIAL_PAGE") return "WRITE_OR_SUPPORT";
  if (
    rec === "UPDATE_EXISTING" ||
    rec === "EXPAND_EXISTING_RESOURCE" ||
    rec === "UPDATE_SERVICE_PAGE" ||
    rec === "UPDATE_SOLUTION_PAGE" ||
    rec === "UPDATE_PLATFORM_PAGE"
  ) {
    return "UPDATE_OR_EXPAND";
  }
  return rec;
}

export function evaluateTopicCalibrationFixture(
  fixture: TopicCalibrationFixture,
): TopicCalibrationRowResult {
  const signals = fixture.mockSignals.map(toSignal);
  const clusters = clusterSignals(signals);
  const cluster = clusters[0] || {
    clusterKey: `seed:${fixture.id}`,
    anchor: toSignal({
      title: fixture.seed,
      type: "USER_SEED",
      sourceAuthorityType: "INDUSTRY",
      freshness: "HYBRID",
    }),
    supporting: [],
    fingerprints: [],
  };

  const draft = analyzeClusterToOpportunity({
    cluster,
    seedText: fixture.seed,
    market: "global_en",
    index: CALIBRATION_CONTENT_INDEX,
    coverage: CALIBRATION_COVERAGE,
  });

  const actualDecision = draft?.recommendation ?? "NONE";
  const decisionMatch =
    actualDecision !== "NONE" &&
    fixture.expectedDecisions.includes(actualDecision as TopicRecommendation);

  const formatMatch =
    fixture.expectedFormat && draft
      ? draft.suggestedFormat === fixture.expectedFormat
      : null;

  const cannibalizationDetected =
    draft?.dimensions.cannibalizationRisk === "high" ||
    draft?.recommendation === "UPDATE_EXISTING" ||
    draft?.recommendation === "IGNORE" ||
    draft?.recommendation === "EXPAND_EXISTING_RESOURCE";

  const rq = reasoningQuality(fixture, draft?.whyNow, draft?.whySmartlance);

  let notes = fixture.reason;
  if (!decisionMatch) {
    notes += ` | MISMATCH: expected one of [${fixture.expectedDecisions.join(", ")}], got ${actualDecision}`;
  }
  if (formatMatch === false) {
    notes += ` | FORMAT: expected ${fixture.expectedFormat}, got ${draft?.suggestedFormat}`;
  }

  return {
    id: fixture.id,
    seed: fixture.seed,
    category: fixture.category,
    holdout: Boolean(fixture.holdout),
    expectedDecisions: fixture.expectedDecisions,
    expectedFormat: fixture.expectedFormat,
    actualDecision,
    actualFormat: draft?.suggestedFormat,
    decisionMatch,
    formatMatch,
    cannibalizationDetected,
    reasoningQuality: rq,
    whyNow: draft?.whyNow,
    whySmartlance: draft?.whySmartlance,
    workingTitle: draft?.workingTitle,
    notes,
  };
}

export function runTopicCalibrationSuite(opts?: {
  includeHoldout?: boolean;
}): TopicCalibrationSuiteResult {
  const includeHoldout = Boolean(opts?.includeHoldout);
  const fixtures = includeHoldout
    ? [...listTopicCalibrationFixtures(), ...listTopicCalibrationHoldout()]
    : listTopicCalibrationFixtures();

  const rows = fixtures.map(evaluateTopicCalibrationFixture);

  const confusionMap = new Map<string, number>();
  for (const row of rows) {
    const key = `${expectedBucket(
      fixtures.find((f) => f.id === row.id)!,
    )}→${actualBucket(row.actualDecision)}`;
    confusionMap.set(key, (confusionMap.get(key) || 0) + 1);
  }

  const confusion: DecisionConfusionCell[] = [...confusionMap.entries()].map(
    ([k, count]) => {
      const [expected, actual] = k.split("→");
      return { expected: expected!, actual: actual!, count };
    },
  );

  const byCategory: Record<string, { match: number; total: number }> = {};
  for (const row of rows) {
    const bucket = byCategory[row.category] || { match: 0, total: 0 };
    bucket.total += 1;
    if (row.decisionMatch) bucket.match += 1;
    byCategory[row.category] = bucket;
  }

  const falsePositiveWriteNew = rows.filter((r) => {
    const writeLike =
      r.actualDecision === "WRITE_NEW" ||
      r.actualDecision === "SUPPORT_COMMERCIAL_PAGE";
    const expectedUpdateOrIgnore = r.expectedDecisions.every(
      (d) =>
        d === "UPDATE_EXISTING" ||
        d === "IGNORE" ||
        d === "EXPAND_EXISTING_RESOURCE" ||
        d === "MONITOR" ||
        d === "UPDATE_SERVICE_PAGE" ||
        d === "UPDATE_SOLUTION_PAGE" ||
        d === "UPDATE_PLATFORM_PAGE",
    );
    return writeLike && expectedUpdateOrIgnore && !r.decisionMatch;
  }).length;

  const falseNegativeStrong = rows.filter((r) => {
    const expectedWrite = r.expectedDecisions.some(
      (d) => d === "WRITE_NEW" || d === "SUPPORT_COMMERCIAL_PAGE",
    );
    const actualReject =
      r.actualDecision === "IGNORE" || r.actualDecision === "MONITOR";
    return expectedWrite && actualReject && !r.decisionMatch;
  }).length;

  return {
    promptVersions: TOPIC_INTELLIGENCE_PROMPT_VERSIONS,
    analysisPromptVersion: PROMPT_VERSIONS.opportunityAnalysis,
    runAt: new Date().toISOString(),
    includeHoldout,
    totals: {
      fixtures: rows.length,
      decisionMatches: rows.filter((r) => r.decisionMatch).length,
      decisionMismatches: rows.filter((r) => !r.decisionMatch).length,
      formatMatches: rows.filter((r) => r.formatMatch === true).length,
      formatChecked: rows.filter((r) => r.formatMatch !== null).length,
      falsePositiveWriteNew,
      falseNegativeStrong,
    },
    confusion,
    byCategory,
    rows,
  };
}

/** Compact dimensions object for AIEvaluationSnapshot storage. */
export function suiteResultToSnapshotDimensions(result: TopicCalibrationSuiteResult) {
  return {
    kind: "topic-intelligence-calibration",
    promptVersions: result.promptVersions,
    totals: result.totals,
    confusion: result.confusion,
    byCategory: result.byCategory,
    mismatches: result.rows
      .filter((r) => !r.decisionMatch)
      .map((r) => ({
        id: r.id,
        expected: r.expectedDecisions,
        actual: r.actualDecision,
        format: r.actualFormat,
      })),
  };
}
