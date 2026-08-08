import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import {
  PLATFORM_FIELD_ALLOWLIST,
  PLATFORM_PROTECTED_FIELDS,
  INDUSTRY_FIELD_ALLOWLIST,
  INDUSTRY_PROTECTED_FIELDS,
  filterAllowedFields,
} from "@/lib/ai/content-assistants/allowlists";
import {
  containsUnsupportedIndustryExperience,
  containsUnsafePlatformClaim,
  containsVolatilePriceClaim,
} from "@/lib/ai/content-assistants/helpers";
import { heuristicPlatformProposal } from "@/lib/ai/content-assistants/platform/heuristic";
import {
  heuristicIndustryProposal,
  looksLikeGenericIndustryCopy,
} from "@/lib/ai/content-assistants/industry/heuristic";
import {
  preferOfficialSources,
  isOfficialOrPrimary,
} from "@/lib/ai/content-assistants/research";
import { getContentAssistant } from "@/lib/ai/content-assistants/registry";
import {
  commercialActionLabel,
  isCommercialPageRecommendation,
} from "@/lib/ai/topic-intelligence/content-assistant-handoff";
import { canUseContentAssistant } from "@/lib/ai/content-assistants/security";
import type { Industry, Platform } from "@prisma/client";

function basePlatform(over: Partial<Platform> = {}): Platform {
  return {
    id: "plat1",
    slug: "shopify",
    href: "/platforms/shopify",
    name: "Shopify",
    title: "Shopify",
    summary: "Existing summary",
    description: "Existing description about ecommerce storefronts.",
    tagline: null,
    icon: "shopping-bag",
    group: "commerce",
    prominence: "primary",
    featured: true,
    navigationFeatured: true,
    verifiedExperience: false,
    platformMatch: "shopify",
    displayOrder: 1,
    audiences: ["Merchants"],
    whenItFits: null,
    capabilities: ["Online storefront"],
    challenges: null,
    seoSection: null,
    relatedServiceHrefs: [],
    relatedSeoHrefs: null,
    faqs: null,
    legacyUrl: null,
    conversionNote: null,
    migrationNote: null,
    ctaTitle: null,
    ctaDescription: null,
    seoTitle: "Shopify | Smartlance",
    seoDescription: "Shopify fit guidance",
    ogTitle: null,
    ogDescription: null,
    ogImagePath: null,
    noIndex: false,
    canonicalOverride: null,
    lastReviewedAt: null,
    status: "PUBLISHED",
    publishedAt: new Date(),
    createdById: null,
    updatedById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  } as Platform;
}

function baseIndustry(over: Partial<Industry> = {}): Industry {
  return {
    id: "ind1",
    slug: "hospitality",
    name: "Hospitality",
    description: "Generic websites for businesses online.",
    icon: "building",
    group: "supported",
    hasVerifiedProjectExperience: false,
    featured: false,
    displayOrder: 1,
    relatedServiceLinks: [],
    relatedSolutionSlugs: null,
    seoTitle: null,
    seoDescription: null,
    ogTitle: null,
    ogDescription: null,
    ogImagePath: null,
    noIndex: false,
    canonicalOverride: null,
    status: "PUBLISHED",
    publishedAt: new Date(),
    createdById: null,
    updatedById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  } as Industry;
}

describe("Platform allowlists + protection", () => {
  it("rejects protected Platform fields including verifiedExperience", () => {
    const filtered = filterAllowedFields(
      {
        summary: "ok",
        verifiedExperience: true,
        platformMatch: "hack",
        status: "PUBLISHED",
        lastReviewedAt: new Date().toISOString(),
        featured: true,
      },
      PLATFORM_FIELD_ALLOWLIST,
      PLATFORM_PROTECTED_FIELDS,
    );
    expect(filtered).toEqual({ summary: "ok" });
  });

  it("blocks unsafe partner/certification language", () => {
    expect(
      containsUnsafePlatformClaim("Smartlance is a certified Shopify partner"),
    ).toBe(true);
    expect(containsUnsafePlatformClaim("Shopify can suit many catalogues")).toBe(
      false,
    );
  });

  it("flags volatile price claims without research", () => {
    expect(containsVolatilePriceClaim("Shopify currently costs $29 per month")).toBe(
      true,
    );
    const payload = heuristicPlatformProposal({
      platform: basePlatform({ summary: "" }),
      action: "IMPROVE_PLATFORM",
      lockedFields: [],
    });
    // Heuristic itself should not invent pricing
    const blob = JSON.stringify(payload.fields);
    expect(blob).not.toMatch(/\$\d+/);
  });

  it("Fill Missing does not overwrite populated fields", () => {
    const payload = heuristicPlatformProposal({
      platform: basePlatform(),
      action: "FILL_MISSING",
      lockedFields: [],
    });
    expect(payload.fields.some((f) => f.field === "summary")).toBe(false);
  });

  it("prefers official sources over competitor agency blogs", () => {
    const ranked = preferOfficialSources([
      {
        url: "https://random-agency-blog.com/shopify-tips",
        domain: "random-agency-blog.com",
        sourceType: "COMPETITOR",
        checkedAt: new Date().toISOString(),
      },
      {
        url: "https://help.shopify.com/en/manual",
        domain: "help.shopify.com",
        sourceType: "OFFICIAL",
        checkedAt: new Date().toISOString(),
        title: "Shopify Help",
      },
    ]);
    expect(ranked[0]?.domain).toContain("shopify.com");
    expect(isOfficialOrPrimary(ranked[0]!.sourceType)).toBe(true);
  });

  it("partial source support: feature ok, SEO superiority not", () => {
    const text =
      "Shopify supports online checkout. It is always better for SEO than alternatives.";
    expect(/always better for seo/i.test(text)).toBe(true);
    const payload = heuristicPlatformProposal({
      platform: basePlatform({ description: "" }),
      action: "IMPROVE_PLATFORM",
      lockedFields: [],
      researchSources: [
        {
          url: "https://help.shopify.com/en",
          domain: "help.shopify.com",
          sourceType: "OFFICIAL",
          checkedAt: new Date().toISOString(),
        },
      ],
    });
    const desc = String(
      payload.fields.find((f) => f.field === "description")?.proposed || "",
    );
    expect(desc.toLowerCase()).not.toMatch(/always better for seo/);
  });
});

describe("Industry experience boundary", () => {
  it("protects group and hasVerifiedProjectExperience", () => {
    const filtered = filterAllowedFields(
      {
        description: "ok",
        group: "proven",
        hasVerifiedProjectExperience: true,
        status: "PUBLISHED",
      },
      INDUSTRY_FIELD_ALLOWLIST,
      INDUSTRY_PROTECTED_FIELDS,
    );
    expect(filtered).toEqual({ description: "ok" });
  });

  it("supported industry cannot claim client experience", () => {
    expect(
      containsUnsupportedIndustryExperience(
        "We've worked with numerous businesses in this sector.",
      ),
    ).toBe(true);

    const payload = heuristicIndustryProposal({
      industry: baseIndustry(),
      action: "IMPROVE_INDUSTRY",
      lockedFields: [],
      verified: false,
    });
    const desc = String(
      payload.fields.find((f) => f.field === "description")?.proposed || "",
    );
    expect(containsUnsupportedIndustryExperience(desc)).toBe(false);
    expect(desc.toLowerCase()).not.toMatch(/we've helped many/);
  });

  it("proven industry may reference verified Work name only", () => {
    const payload = heuristicIndustryProposal({
      industry: baseIndustry({
        group: "proven",
        hasVerifiedProjectExperience: true,
        description: "",
      }),
      action: "FILL_MISSING",
      lockedFields: [],
      verified: true,
      publishedWork: [
        {
          name: "Harbour Hotel site",
          slug: "harbour-hotel",
          shortDescription: "Brochure site refresh",
        },
      ],
    });
    const desc = String(
      payload.fields.find((f) => f.field === "description")?.proposed || "",
    );
    expect(desc).toContain("Harbour Hotel site");
    expect(desc.toLowerCase()).not.toMatch(/increased revenue by/);
  });

  it("IMPROVE_INDUSTRY replaces draft placeholder description", () => {
    const payload = heuristicIndustryProposal({
      industry: baseIndustry({
        description: "Draft industry description.",
        name: "Shopify",
        slug: "shopify",
      }),
      action: "IMPROVE_INDUSTRY",
      lockedFields: [],
      verified: false,
    });
    const desc = payload.fields.find((f) => f.field === "description");
    expect(desc?.proposed).toBeTruthy();
    expect(String(desc?.proposed)).toContain("Shopify");
    expect(String(desc?.proposed)).not.toContain("Draft industry description");
  });

  it("flags generic industry copy", () => {
    expect(
      looksLikeGenericIndustryCopy(
        "Generic websites for businesses online help companies improve their digital presence and win more enquiries.",
        "Hospitality",
      ),
    ).toBe(true);
    expect(
      looksLikeGenericIndustryCopy(
        "Hospitality brands need booking paths guests trust, clear stay packages, and enquiry flows that match how travellers shortlist hotels.",
        "Hospitality",
      ),
    ).toBe(false);
  });

  it("SUGGEST_WORK blocks inventing proof for supported industries", () => {
    const payload = heuristicIndustryProposal({
      industry: baseIndustry(),
      action: "SUGGEST_WORK",
      lockedFields: [],
      verified: false,
    });
    expect(
      payload.reviewFindings?.some((f) => f.severity === "BLOCKER"),
    ).toBe(true);
  });
});

describe("Topic Intelligence commercial handoffs", () => {
  it("recognises commercial page recommendations", () => {
    expect(isCommercialPageRecommendation("UPDATE_PLATFORM_PAGE")).toBe(true);
    expect(isCommercialPageRecommendation("UPDATE_SERVICE_PAGE")).toBe(true);
    expect(isCommercialPageRecommendation("UPDATE_SOLUTION_PAGE")).toBe(true);
    expect(isCommercialPageRecommendation("UPDATE_INDUSTRY_PAGE")).toBe(true);
    expect(isCommercialPageRecommendation("WRITE_NEW")).toBe(false);
  });

  it("uses explicit Update labels", () => {
    expect(commercialActionLabel("UPDATE_PLATFORM_PAGE")).toBe("Update Platform");
    expect(commercialActionLabel("UPDATE_SERVICE_PAGE")).toBe("Update Service");
  });

  it("handoff module does not create Insight projects", () => {
    const src = readFileSync(
      join(
        process.cwd(),
        "lib/ai/topic-intelligence/content-assistant-handoff.ts",
      ),
      "utf8",
    );
    expect(src).not.toMatch(/createAIProject/);
    expect(src).toMatch(/admin\/platforms/);
    expect(src).toMatch(/admin\/services/);
  });
});

describe("Registry + RBAC Phase B", () => {
  it("registers Platform and Industry assistants", () => {
    expect(getContentAssistant("PLATFORM").actions.length).toBeGreaterThan(5);
    expect(getContentAssistant("INDUSTRY").actions.length).toBeGreaterThan(5);
  });

  it("still requires use_ai_writer + edit_draft", () => {
    expect(canUseContentAssistant("EDITOR")).toBe(true);
    expect(canUseContentAssistant("REVIEWER")).toBe(false);
  });
});

describe("PII exclusion Phase B", () => {
  it("Platform/Industry context builders never query Enquiries", () => {
    for (const rel of [
      "lib/ai/content-assistants/platform/context.ts",
      "lib/ai/content-assistants/industry/context.ts",
    ]) {
      const src = readFileSync(join(process.cwd(), rel), "utf8");
      expect(src).not.toMatch(/prisma\.enquiry/i);
      expect(src).not.toMatch(/EnquiryNote/);
    }
  });
});
