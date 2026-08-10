import { describe, expect, it } from "vitest";
import {
  coerceReviewAiRaw,
  parseReviewAiOutput,
} from "@/lib/prospect/ai/review-validation";

describe("coerceReviewAiRaw", () => {
  it("drops string-only list items that cannot cite evidence", () => {
    const coerced = coerceReviewAiRaw({
      overallDirection: "FOCUSED_IMPROVEMENTS",
      executiveSummary: "Summary",
      strengths: ["Clear headline", "Good nav"],
      findings: [],
      priorities: [],
      nextSteps: [],
    }) as Record<string, unknown>;

    expect(coerced.strengths).toEqual([]);
  });

  it("normalizes object items and keeps evidence IDs", () => {
    const output = parseReviewAiOutput({
      overallDirection: "FOCUSED_IMPROVEMENTS",
      executiveSummary: "Summary text",
      strengths: [
        {
          category: "SEO",
          title: "Page title present",
          explanation: "The homepage has a descriptive title.",
          evidenceIds: "ev-1",
          confidence: "HIGH",
        },
      ],
      findings: [],
      priorities: [],
      nextSteps: ["Review meta tags"],
    });

    expect(output.strengths).toHaveLength(1);
    expect(output.strengths[0]?.evidenceIds).toEqual(["ev-1"]);
  });

  it("drops findings without evidence IDs", () => {
    const coerced = coerceReviewAiRaw({
      overallDirection: "FOCUSED_IMPROVEMENTS",
      executiveSummary: "Summary",
      strengths: [],
      findings: [
        {
          category: "UX",
          severity: "HIGH",
          title: "Missing CTA",
          explanation: "No clear call to action.",
          evidenceIds: [],
          confidence: "MEDIUM",
        },
      ],
      priorities: [],
      nextSteps: [],
    }) as Record<string, unknown>;

    expect(coerced.findings).toEqual([]);
  });
});
