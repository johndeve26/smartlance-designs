import { describe, it, expect } from "vitest";
import {
  formatChangeRequestNumber,
  parseChangeRequestNumber,
} from "@/lib/change-requests/change-request-number";
import { computeAssessmentHash } from "@/lib/change-requests/assessment-hash";

describe("change request number", () => {
  it("formats CR-YYYY-#### with minimum width", () => {
    expect(formatChangeRequestNumber(2026, 1)).toBe("CR-2026-0001");
    expect(formatChangeRequestNumber(2026, 9999)).toBe("CR-2026-9999");
    expect(formatChangeRequestNumber(2026, 10000)).toBe("CR-2026-10000");
  });

  it("parses change request numbers", () => {
    expect(parseChangeRequestNumber("CR-2026-0004")).toEqual({ year: 2026, sequence: 4 });
    expect(parseChangeRequestNumber("invalid")).toBeNull();
  });
});

describe("assessment hash", () => {
  it("is deterministic for the same assessment payload", () => {
    const input = {
      changeRequestId: "cr1",
      versionNumber: 1,
      classification: "OUT_OF_SCOPE",
      scopeImpactSummary: "Extra page",
      priceImpactMinor: 20000000,
      currency: "NGN",
      timelineImpactDays: 7,
    };
    const a = computeAssessmentHash(input);
    const b = computeAssessmentHash(input);
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });
});
