import { describe, it, expect } from "vitest";
import {
  getBriefSectionCount,
  getBriefSections,
  validateBriefAnswers,
} from "@/lib/prospect/brief/schema";

describe("prospect brief schema", () => {
  it("uses the canonical 14-section website project brief template", () => {
    expect(getBriefSectionCount()).toBe(14);
    expect(getBriefSections()).toHaveLength(14);
    const ids = getBriefSections().map((s) => s.id);
    expect(new Set(ids).size).toBe(14);
  });

  it("validates brief answer shapes", () => {
    expect(validateBriefAnswers({ "project-name": "Acme" })).toBe(true);
    expect(validateBriefAnswers({ tags: ["a", "b"] })).toBe(true);
    expect(validateBriefAnswers(null)).toBe(false);
    expect(validateBriefAnswers({ bad: 1 })).toBe(false);
  });
});
