import { describe, it, expect } from "vitest";
import { isPrivateOrReservedHostname } from "@/lib/ai/ssrf";
import { normalizeWebsiteUrl, isValidWebsiteUrlInput } from "@/lib/prospect/review/url";
import {
  validateReviewAiOutput,
  reviewAiOutputSchema,
} from "@/lib/prospect/ai/review-validation";
import { calculateBriefCompletion } from "@/lib/prospect/brief/schema";

describe("prospect review url", () => {
  it("normalizes bare domains", () => {
    const { domain } = normalizeWebsiteUrl("example.com");
    expect(domain).toBe("example.com");
  });

  it("rejects localhost", () => {
    expect(isValidWebsiteUrlInput("http://localhost")).toBe(false);
  });
});

describe("prospect ssrf hostnames", () => {
  it("blocks private IPv4", () => {
    expect(isPrivateOrReservedHostname("127.0.0.1")).toBe(true);
    expect(isPrivateOrReservedHostname("10.0.0.1")).toBe(true);
    expect(isPrivateOrReservedHostname("192.168.1.1")).toBe(true);
  });

  it("blocks metadata hosts", () => {
    expect(isPrivateOrReservedHostname("metadata.google.internal")).toBe(true);
  });
});

describe("review ai validation", () => {
  it("rejects findings with invalid evidence ids", () => {
    const output = reviewAiOutputSchema.parse({
      overallDirection: "FOCUSED_IMPROVEMENTS",
      executiveSummary: "Summary",
      strengths: [],
      findings: [
        {
          category: "Conversion",
          severity: "HIGH",
          title: "Test",
          explanation: "Test finding",
          evidenceIds: ["fake-id"],
          confidence: "HIGH",
        },
      ],
      priorities: [],
      nextSteps: [],
    });

    const validated = validateReviewAiOutput(output, new Set(["real-id"]), new Map());
    expect(validated.findings).toHaveLength(0);
  });

  it("rejects performance claims without evidence", () => {
    const output = reviewAiOutputSchema.parse({
      overallDirection: "FOCUSED_IMPROVEMENTS",
      executiveSummary: "Summary",
      strengths: [],
      findings: [
        {
          category: "Performance",
          severity: "HIGH",
          title: "Site is slow",
          explanation: "Your site is slow to load",
          evidenceIds: ["ev-1"],
          confidence: "HIGH",
        },
      ],
      priorities: [],
      nextSteps: [],
    });

    const validated = validateReviewAiOutput(
      output,
      new Set(["ev-1"]),
      new Map([["ev-1", "page_title"]]),
    );
    expect(validated.findings).toHaveLength(0);
  });
});

describe("brief completion", () => {
  it("calculates completion from sections", () => {
    const { completionPercent, completedSectionIds } = calculateBriefCompletion({
      "project-name": "Test project",
      "business-name": "Acme",
      "project-type": "redesign",
    });
    expect(completionPercent).toBeGreaterThan(0);
    expect(completedSectionIds.length).toBeGreaterThan(0);
  });
});
