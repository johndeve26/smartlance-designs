import { describe, expect, it } from "vitest";
import {
  mergeSiteSettingsExtras,
  parseSiteSettingsExtras,
  resolveSitePresentation,
} from "@/lib/site-settings-extras";

describe("site settings extras", () => {
  it("merges env fallbacks when extras are empty", () => {
    const presentation = resolveSitePresentation({});
    expect(presentation.serviceAreas.length).toBeGreaterThan(0);
    expect(presentation.mediaMaxUploadMb).toBeGreaterThan(0);
  });

  it("prefers stored extras over env fallbacks", () => {
    const presentation = resolveSitePresentation({
      locationLabel: "Lagos, Nigeria",
      serviceAreas: "West Africa",
      responseExpectation: "We reply within 2 business days.",
      mediaMaxUploadMb: 12,
    });
    expect(presentation.locationLabel).toBe("Lagos, Nigeria");
    expect(presentation.serviceAreas).toBe("West Africa");
    expect(presentation.responseExpectation).toBe(
      "We reply within 2 business days.",
    );
    expect(presentation.mediaMaxUploadMb).toBe(12);
  });

  it("clears stored values when patched with empty strings", () => {
    const merged = mergeSiteSettingsExtras(
      { locationLabel: "Old value" },
      { locationLabel: "" },
    );
    expect(merged.locationLabel).toBeUndefined();
    expect(parseSiteSettingsExtras(merged).locationLabel).toBeUndefined();
  });
});
