import { describe, expect, it } from "vitest";
import {
  MANAGED_PAGE_HERO_DEFAULTS,
  normalizeManagedPageText,
  resolveManagedPageHero,
} from "@/lib/managed-pages/hero";

describe("managed page hero overrides", () => {
  it("uses CMS override when present", () => {
    const hero = resolveManagedPageHero(MANAGED_PAGE_HERO_DEFAULTS.about, {
      heroEyebrow: "CMS eyebrow",
      heroHeadline: "CMS headline",
      heroSupporting: "CMS supporting copy",
    });

    expect(hero).toEqual({
      eyebrow: "CMS eyebrow",
      headline: "CMS headline",
      supporting: "CMS supporting copy",
    });
  });

  it("falls back to static hero when CMS values are blank", () => {
    const hero = resolveManagedPageHero(MANAGED_PAGE_HERO_DEFAULTS.contact, {
      heroEyebrow: "   ",
      heroHeadline: "",
      heroSupporting: null,
    });

    expect(hero).toEqual(MANAGED_PAGE_HERO_DEFAULTS.contact);
  });

  it("normalizes whitespace-only strings to null", () => {
    expect(normalizeManagedPageText("  hello  ")).toBe("hello");
    expect(normalizeManagedPageText("   ")).toBeNull();
    expect(normalizeManagedPageText(undefined)).toBeNull();
  });
});
