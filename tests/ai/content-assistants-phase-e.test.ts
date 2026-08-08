import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import {
  HOMEPAGE_FIELD_ALLOWLIST,
  HOMEPAGE_PROTECTED_FIELDS,
  filterAllowedFields,
} from "@/lib/ai/content-assistants/allowlists";
import {
  containsUnsupportedHomepageTrustClaim,
  homepageAssistant,
} from "@/lib/ai/content-assistants/homepage";
import { getContentAssistant, listContentAssistants } from "@/lib/ai/content-assistants/registry";
import {
  assertHandoffTypeMatch,
  commercialActionLabel,
  forcesInsightOverride,
  isCommercialPageRecommendation,
  isForbiddenTestimonialGeneration,
  isResourceExpandRecommendation,
  recommendationToEntityType,
} from "@/lib/ai/topic-intelligence/content-assistant-handoff";
import { assertPlatformSelectorScenarios } from "@/lib/platform-selector-scenarios";
import {
  effectiveHomepageFields,
  hasHomepageDraft,
  publishedFieldsFromRow,
} from "@/lib/repositories/homepageRepository";
import type { HomepageContent } from "@prisma/client";

function mockHomepageRow(
  overrides: Partial<HomepageContent> = {},
): HomepageContent {
  return {
    id: "home",
    heroEyebrow: "Digital growth",
    heroHeadline: "Websites that win work",
    heroHeadlineAccent: null,
    heroSupporting: "Smartlance builds conversion-focused websites.",
    primaryCtaLabel: "Tell Us About Your Project",
    primaryCtaHref: "/contact",
    secondaryCtaLabel: "View Our Work",
    secondaryCtaHref: "/work",
    metaTitle: "Smartlance",
    metaDescription: "Websites and growth systems",
    sections: {},
    sectionVisibility: { hero: true },
    curatedServiceItems: [],
    curatedTestimonialIds: [],
    seoTitle: "Smartlance",
    seoDescription: "Websites and growth systems",
    ogTitle: null,
    ogDescription: null,
    ogImagePath: null,
    noIndex: false,
    canonicalOverride: null,
    draftJson: null,
    draftUpdatedAt: null,
    draftUpdatedById: null,
    updatedById: null,
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  } as HomepageContent;
}

describe("Phase E registry", () => {
  it("registers Homepage among 13 specialized assistants", () => {
    expect(getContentAssistant("HOMEPAGE").displayName).toBe("Homepage");
    expect(listContentAssistants()).toHaveLength(13);
    expect(
      getContentAssistant("HOMEPAGE").actions.some((a) => a.id === "IMPROVE_HERO"),
    ).toBe(true);
    expect(
      getContentAssistant("HOMEPAGE").actions.some((a) => a.id === "REWRITE_WEBSITE"),
    ).toBe(false);
  });
});

describe("Homepage draft boundary", () => {
  it("public fields ignore draftJson overlay helpers correctly", () => {
    const published = mockHomepageRow({
      heroHeadline: "Live headline",
      draftJson: {
        heroHeadline: "Draft headline",
        heroSupporting: "Draft supporting",
      },
    });
    expect(publishedFieldsFromRow(published).heroHeadline).toBe("Live headline");
    expect(effectiveHomepageFields(published).heroHeadline).toBe("Draft headline");
    expect(hasHomepageDraft(published)).toBe(true);
    expect(hasHomepageDraft(mockHomepageRow())).toBe(false);
  });

  it("saveHomepageDraft path does not revalidate public homepage", () => {
    const repo = readFileSync(
      join(process.cwd(), "lib/repositories/homepageRepository.ts"),
      "utf8",
    );
    const draftFn = repo.slice(
      repo.indexOf("export async function saveHomepageDraft"),
      repo.indexOf("export async function publishHomepage"),
    );
    expect(draftFn).not.toContain("revalidateHomepage");
    expect(repo).toMatch(/export async function publishHomepage[\s\S]*revalidateHomepage/);
  });

  it("AI cannot call publishHomepage from assistant module", () => {
    const src = readFileSync(
      join(process.cwd(), "lib/ai/content-assistants/homepage/index.ts"),
      "utf8",
    );
    expect(src).toContain("saveHomepageDraft");
    expect(src).not.toContain("publishHomepage");
  });
});

describe("Homepage allowlists + proof", () => {
  it("rejects protected fields", () => {
    expect(
      filterAllowedFields(
        {
          heroHeadline: "ok",
          sectionVisibility: { hero: false },
          noIndex: true,
          draftJson: {},
          status: "PUBLISHED",
        },
        HOMEPAGE_FIELD_ALLOWLIST,
        HOMEPAGE_PROTECTED_FIELDS,
      ),
    ).toEqual({ heroHeadline: "ok" });
  });

  it("blocks unsupported trust claims", () => {
    expect(
      containsUnsupportedHomepageTrustClaim(
        "Trusted by 500+ businesses worldwide.",
      ),
    ).toBe(true);
    expect(
      containsUnsupportedHomepageTrustClaim(
        "Award-winning digital agency #1",
      ),
    ).toBe(true);
    expect(
      containsUnsupportedHomepageTrustClaim(
        "Websites and systems built for international businesses.",
      ),
    ).toBe(false);
  });

  it("scrubs fake trust claims from IMPROVE_CTA generic labels only when safe", async () => {
    const result = await homepageAssistant.generateProposal({
      entity: {
        id: "home",
        heroHeadline: "Clear value",
        heroSupporting: "Trusted by 500+ businesses worldwide.",
        primaryCtaLabel: "Get Started",
        primaryCtaHref: "/contact",
      },
      action: "IMPROVE_CTA",
      context: {
        candidates: { services: [], work: [], testimonials: [] },
        effective: {
          heroHeadline: "Clear value",
          heroSupporting: "Trusted by 500+ businesses worldwide.",
          primaryCtaLabel: "Get Started",
          primaryCtaHref: "/contact",
        },
      },
      lockedFields: [],
      forceHeuristic: true,
    });
    const cta = result.payload.fields.find((f) => f.field === "primaryCtaLabel");
    expect(cta?.proposed).toBe("Tell Us About Your Project");
  });
});

describe("Homepage curation suggestions", () => {
  it("suggests only candidate service/work/testimonial IDs", async () => {
    const services = [
      { id: "svc-1", slug: "web", href: "/services/web", title: "Web" },
    ];
    const work = [{ id: "work-1", slug: "acme", name: "Acme" }];
    const testimonials = [
      { id: "t-1", name: "Jane", company: "Acme Co" },
    ];

    const svc = await homepageAssistant.generateProposal({
      entity: { id: "home" },
      action: "SUGGEST_SERVICE_CURATION",
      context: {
        candidates: { services, work, testimonials },
        effective: {},
      },
      lockedFields: [],
    });
    expect(svc.payload.suggestedRelations?.[0]?.id).toBe("svc-1");
    expect(svc.payload.fields).toEqual([]);

    const tm = await homepageAssistant.generateProposal({
      entity: { id: "home" },
      action: "SUGGEST_TESTIMONIAL_CURATION",
      context: {
        candidates: { services, work, testimonials },
        effective: {},
      },
      lockedFields: [],
    });
    expect(tm.payload.suggestedRelations?.[0]?.kind).toBe("testimonial");
    expect(tm.payload.suggestedRelations?.[0]?.id).toBe("t-1");
  });
});

describe("Topic Intelligence Phase E routing", () => {
  it("maps all implemented recommendation types", () => {
    expect(recommendationToEntityType("WRITE_NEW")).toBeNull();
    expect(recommendationToEntityType("UPDATE_SERVICE_PAGE")).toBe("SERVICE");
    expect(recommendationToEntityType("UPDATE_SOLUTION_PAGE")).toBe("SOLUTION");
    expect(recommendationToEntityType("UPDATE_PLATFORM_PAGE")).toBe("PLATFORM");
    expect(recommendationToEntityType("UPDATE_INDUSTRY_PAGE")).toBe("INDUSTRY");
    expect(recommendationToEntityType("UPDATE_WORK_PAGE")).toBe("WORK");
    expect(recommendationToEntityType("UPDATE_HOMEPAGE")).toBe("HOMEPAGE");
    expect(isResourceExpandRecommendation("EXPAND_EXISTING_RESOURCE")).toBe(
      true,
    );
  });

  it("labels handoff actions explicitly", () => {
    expect(commercialActionLabel("UPDATE_WORK_PAGE")).toBe("Update Case Study");
    expect(commercialActionLabel("UPDATE_HOMEPAGE")).toBe("Update Homepage");
    expect(commercialActionLabel("EXPAND_EXISTING_RESOURCE")).toBe(
      "Update Resource",
    );
    expect(commercialActionLabel("WRITE_NEW")).toBe("Create Insight Project");
  });

  it("blocks wrong-type handoff mismatch", () => {
    expect(() =>
      assertHandoffTypeMatch("UPDATE_COMPARISON" as never, "GUIDE"),
    ).not.toThrow(); // UPDATE_COMPARISON is not a TopicRecommendation — use EXPAND
    expect(() =>
      assertHandoffTypeMatch("UPDATE_SERVICE_PAGE", "GUIDE"),
    ).toThrow(/mismatch/);
    expect(() =>
      assertHandoffTypeMatch("EXPAND_EXISTING_RESOURCE", "SERVICE"),
    ).toThrow(/mismatch/);
    expect(() =>
      assertHandoffTypeMatch("UPDATE_PLATFORM_PAGE", "PLATFORM"),
    ).not.toThrow();
  });

  it("never allows Generate Testimonial paths", () => {
    expect(isForbiddenTestimonialGeneration("GENERATE_TESTIMONIAL")).toBe(true);
    expect(isForbiddenTestimonialGeneration("WRITE_TESTIMONIAL")).toBe(true);
    expect(isForbiddenTestimonialGeneration("UPDATE_SERVICE_PAGE")).toBe(false);
    expect(isCommercialPageRecommendation("UPDATE_WORK_PAGE")).toBe(true);
    expect(forcesInsightOverride("UPDATE_HOMEPAGE")).toBe(true);
  });

  it("handoff module does not auto-invoke providers", () => {
    const src = readFileSync(
      join(
        process.cwd(),
        "lib/ai/topic-intelligence/content-assistant-handoff.ts",
      ),
      "utf8",
    );
    expect(src).not.toContain("createContentProposal");
    expect(src).not.toContain("generateContentProposal");
    expect(src).not.toContain("OPTIMIZE_SCORING");
  });
});

describe("Homepage context hygiene", () => {
  it("homepage context never queries Enquiry", () => {
    const src = readFileSync(
      join(process.cwd(), "lib/ai/content-assistants/homepage/index.ts"),
      "utf8",
    );
    expect(src).not.toMatch(/enquiry/i);
    expect(src).not.toMatch(/EnquiryNote/);
  });
});

describe("Platform Selector regression", () => {
  it("deterministic scenarios still pass", () => {
    assertPlatformSelectorScenarios();
  });
});
