/**
 * Pilot tuning regressions — Platform preservation, Service relations, Industry specificity.
 */

import { describe, expect, it } from "vitest";
import type { Industry, Platform, Service } from "@prisma/client";
import { heuristicPlatformProposal } from "@/lib/ai/content-assistants/platform/heuristic";
import { heuristicServiceProposal } from "@/lib/ai/content-assistants/service/heuristic";
import {
  heuristicIndustryProposal,
  looksLikeGenericIndustryCopy,
  failsIndustrySubstitutionTest,
} from "@/lib/ai/content-assistants/industry/heuristic";
import {
  buildSpecificIndustryDescription,
  matchIndustryProfile,
} from "@/lib/ai/content-assistants/industry/specificity";
import {
  rankSolutionsForService,
  scoreServiceSolutionRelation,
} from "@/lib/ai/content-assistants/service/relations";
import { PROMPT_VERSIONS } from "@/lib/ai/prompts";
import { PLATFORM_ACTIONS } from "@/lib/ai/content-assistants/platform";
import { SERVICE_ACTIONS } from "@/lib/ai/content-assistants/service";
import { INDUSTRY_ACTIONS } from "@/lib/ai/content-assistants/industry";

function strongPlatform(over: Partial<Platform> = {}): Platform {
  return {
    id: "plat-strong",
    slug: "example-cms",
    href: "/platforms/example-cms",
    name: "ExampleCMS",
    title: "ExampleCMS",
    summary:
      "ExampleCMS suits content-led sites that need flexible publishing, plugin ecosystems, and clear ownership of hosting trade-offs — not a one-size vendor pitch.",
    description:
      "Teams choose ExampleCMS when editorial workflows, extensibility, and familiar tooling matter more than a closed visual builder. Strengths include content modelling and a large ecosystem; challenges include maintenance discipline, plugin quality, and performance work that still depends on execution. Smartlance helps evaluate fit and deliver related website work without inventing partner status.",
    tagline: "Flexible publishing with honest trade-offs",
    icon: "layout",
    group: "cms",
    prominence: "primary",
    featured: true,
    navigationFeatured: true,
    verifiedExperience: false,
    platformMatch: null,
    displayOrder: 1,
    audiences: ["Editors", "Marketing teams"],
    whenItFits: ["Content-heavy sites", "Teams comfortable with ongoing maintenance"],
    capabilities: ["Content publishing", "Extensible plugin model"],
    challenges: ["Plugin quality varies", "Performance needs active care"],
    seoSection: null,
    relatedServiceHrefs: [],
    relatedSeoHrefs: null,
    faqs: null,
    legacyUrl: null,
    conversionNote: "Conversion still depends on structure and messaging.",
    migrationNote: "Plan redirects and content mapping carefully.",
    ctaTitle: "Discuss ExampleCMS fit",
    ctaDescription: "Share constraints before committing.",
    seoTitle: "ExampleCMS | Smartlance Designs",
    seoDescription: "Fit, strengths, and trade-offs for ExampleCMS websites.",
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

function redesignService(over: Partial<Service> = {}): Service {
  return {
    id: "svc-redesign",
    slug: "website-redesign",
    href: "/services/website-redesign",
    title: "Website Redesign",
    name: "Website Redesign",
    summary:
      "Website Redesign improves structure, UX, and messaging on sites that no longer convert or reflect the business — distinct from greenfield Website Design.",
    description:
      "Redesign engagements diagnose what is outdated or underperforming, then rebuild information architecture, page templates, and conversion paths without treating every project like a brand-new Website Design engagement or a pure development build.",
    audience: "Businesses with an existing site that needs a material refresh",
    tagline: "Rebuild what no longer works",
    narrative: null,
    narrativeTitle: null,
    problems: ["Outdated structure", "Weak conversion paths"],
    deliverables: ["IA and template plan", "Redesigned key templates"],
    process: [
      { title: "Audit", description: "Review current site and goals." },
      { title: "Rebuild", description: "Design and implement priority templates." },
    ],
    capabilities: ["Information architecture", "Template redesign", "Conversion path clarity"],
    idealFor: ["Teams with an existing site"],
    faqs: [],
    seoTitle: "Website Redesign | Smartlance Designs",
    seoDescription: "Practical website redesign for clarity and conversion.",
    primaryCtaLabel: null,
    primaryCtaHref: null,
    ctaTitle: null,
    ctaDescription: null,
    relatedSolutionSlugs: [],
    relatedPlatformSlugs: [],
    relatedProjectSlugs: [],
    relatedServiceSlugs: [],
    group: "core",
    category: "websites",
    status: "PUBLISHED",
    publishedAt: new Date(),
    featured: true,
    displayOrder: 1,
    createdById: null,
    updatedById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  } as unknown as Service;
}

describe("Platform RESEARCH_AND_IMPROVE preservation", () => {
  it("strong current copy + research → NO_CHANGE / no broad rewrite", () => {
    const payload = heuristicPlatformProposal({
      platform: strongPlatform(),
      action: "RESEARCH_AND_IMPROVE",
      lockedFields: [],
      writingProviderAvailable: false,
      researchSources: [
        {
          url: "https://example.com/docs",
          domain: "example.com",
          sourceType: "OFFICIAL",
          checkedAt: new Date().toISOString(),
        },
      ],
    });
    expect(payload.fields.some((f) => f.field === "summary")).toBe(false);
    expect(payload.fields.some((f) => f.field === "description")).toBe(false);
    expect(payload.resultMode).toMatch(
      /NO_CHANGE_RECOMMENDED|WRITING_PROVIDER_REQUIRED|PARTIAL_CHANGE/,
    );
    expect(payload.reviewFindings?.some((f) => /PRESERVATION|OUTCOME|WRITING/i.test(f.section))).toBe(
      true,
    );
  });

  it("empty description may be filled; strong summary preserved", () => {
    const payload = heuristicPlatformProposal({
      platform: strongPlatform({ description: "" }),
      action: "RESEARCH_AND_IMPROVE",
      lockedFields: [],
      writingProviderAvailable: false,
      researchSources: [
        {
          url: "https://example.com/docs",
          domain: "example.com",
          sourceType: "OFFICIAL",
          checkedAt: new Date().toISOString(),
        },
      ],
    });
    expect(payload.fields.some((f) => f.field === "summary")).toBe(false);
    expect(payload.fields.some((f) => f.field === "description")).toBe(true);
    expect(payload.resultMode).toBe("PARTIAL_CHANGE_RECOMMENDED");
  });

  it("no writing provider does not invent broad summary/description replacement", () => {
    const payload = heuristicPlatformProposal({
      platform: strongPlatform(),
      action: "RESEARCH_AND_IMPROVE",
      lockedFields: [],
      writingProviderAvailable: false,
      researchSources: [
        {
          url: "https://wordpress.org/",
          domain: "wordpress.org",
          sourceType: "OFFICIAL",
          checkedAt: new Date().toISOString(),
        },
      ],
    });
    const blob = JSON.stringify(payload.fields);
    expect(blob).not.toMatch(/fit, strengths, and trade-offs for teams deciding/);
  });

  it("no research sources yields research warning rather than fake improvement of strong copy", () => {
    const payload = heuristicPlatformProposal({
      platform: strongPlatform(),
      action: "RESEARCH_AND_IMPROVE",
      lockedFields: [],
      writingProviderAvailable: false,
    });
    expect(payload.fields.some((f) => f.field === "summary")).toBe(false);
    expect(
      payload.reviewFindings?.some((f) => f.section === "RESEARCH SIGNAL"),
    ).toBe(true);
  });

  it("prompt version bumped for research-improve", () => {
    expect(PROMPT_VERSIONS.platformResearchImprove).toBe("platform.research-improve:v2");
    expect(
      PLATFORM_ACTIONS.find((a) => a.id === "RESEARCH_AND_IMPROVE")?.promptVersion,
    ).toBe("platform.research-improve:v2");
  });
});

describe("Service relationship ranking + body preservation", () => {
  const pool = [
    {
      slug: "zzz-unrelated-consulting",
      name: "Brand Naming Workshop",
      shortDescription: "Help invent product names for consumer packaging.",
      problemSymptoms: ["Confused brand naming"],
      possibleCauses: ["No naming process"],
      relatedServiceHrefs: [],
      category: "brand",
    },
    {
      slug: "outdated-website",
      name: "Outdated Website",
      shortDescription: "The site looks dated and no longer reflects the business.",
      problemSymptoms: ["Outdated design", "Weak structure"],
      possibleCauses: ["Years without redesign"],
      relatedServiceHrefs: ["/services/website-redesign"],
      category: "websites",
    },
    {
      slug: "low-website-conversions",
      name: "Low Website Conversions",
      shortDescription: "Visitors arrive but do not enquire or buy.",
      problemSymptoms: ["Low conversions", "Unclear CTA"],
      possibleCauses: ["UX and messaging problems"],
      relatedServiceHrefs: [],
      category: "conversion",
    },
    {
      slug: "aaa-first-in-db-order",
      name: "Accessibility Audit Tips",
      shortDescription: "Educational notes about accessibility checklists.",
      problemSymptoms: ["Missing alt text"],
      relatedServiceHrefs: [],
      category: "education",
    },
  ];

  it("does not return first-N Solutions by input/database order", () => {
    const ranked = rankSolutionsForService({
      serviceTitle: "Website Redesign",
      serviceHref: "/services/website-redesign",
      serviceSummary: "Rebuild outdated sites for conversion.",
      serviceCapabilities: ["UX", "structure", "messaging"],
      candidates: pool,
    });
    expect(ranked[0]?.slug).not.toBe("aaa-first-in-db-order");
    expect(ranked[0]?.slug).not.toBe("zzz-unrelated-consulting");
    expect(ranked.map((r) => r.slug)).toContain("outdated-website");
  });

  it("honors reciprocal Solution→Service links", () => {
    const scored = scoreServiceSolutionRelation({
      serviceTitle: "Website Redesign",
      serviceHref: "/services/website-redesign",
      candidate: pool[1]!,
    });
    expect(scored.score).toBeGreaterThanOrEqual(100);
    expect(scored.reasons[0]).toMatch(/reciprocal/i);
  });

  it("excludes weak candidates and requires specific reasons", () => {
    const ranked = rankSolutionsForService({
      serviceTitle: "Website Redesign",
      serviceHref: "/services/website-redesign",
      candidates: pool,
    });
    expect(ranked.every((r) => r.slug !== "zzz-unrelated-consulting")).toBe(true);
    expect(ranked.every((r) => r.reason && !/^Relevant to this Service\.?$/i.test(r.reason))).toBe(
      true,
    );
  });

  it("Website Redesign regression: preserve body, suggest CTA, rank Solutions", () => {
    const improve = heuristicServiceProposal({
      service: redesignService(),
      action: "IMPROVE_SERVICE",
      lockedFields: [],
      reviewFindings: [
        { section: "CTA", severity: "WARNING", message: "Primary CTA label is empty." },
        {
          section: "BODY STRENGTH",
          severity: "PASS",
          message: "Summary/description look strong.",
        },
      ],
    });
    expect(improve.fields.some((f) => f.field === "summary")).toBe(false);
    expect(improve.fields.some((f) => f.field === "description")).toBe(false);
    expect(improve.fields.some((f) => f.field === "primaryCtaLabel")).toBe(true);

    const relations = heuristicServiceProposal({
      service: redesignService(),
      action: "SUGGEST_RELATIONSHIPS",
      lockedFields: [],
      relationPool: {
        solutions: pool,
        platforms: [
          { slug: "wordpress", name: "WordPress" },
          { slug: "webflow", name: "Webflow" },
        ],
        work: [],
        services: [],
      },
    });
    const slugs = (relations.suggestedRelations || [])
      .filter((r) => r.kind === "solution")
      .map((r) => r.slug);
    expect(slugs[0]).not.toBe("aaa-first-in-db-order");
    expect(slugs).toContain("outdated-website");
  });

  it("prompt versions bumped for improve + relations", () => {
    expect(PROMPT_VERSIONS.serviceImprove).toBe("service.improve:v2");
    expect(PROMPT_VERSIONS.serviceRelations).toBe("service.relations:v2");
    expect(SERVICE_ACTIONS.find((a) => a.id === "IMPROVE_SERVICE")?.promptVersion).toBe(
      "service.improve:v2",
    );
  });
});

describe("Industry specificity", () => {
  it("profiles differ by sector family", () => {
    const str = matchIndustryProfile("Short-Term Rentals", "short-term-rentals");
    const pro = matchIndustryProfile("Professional Services", "professional-services");
    const ecom = matchIndustryProfile("E-commerce", "ecommerce");
    expect(str?.id).toBe("short-term-rentals");
    expect(pro?.id).toBe("professional-services");
    expect(ecom?.id).toBe("ecommerce");
    expect(str?.cues.join(" ")).not.toEqual(pro?.cues.join(" "));

    const strCopy = buildSpecificIndustryDescription({
      name: "Short-Term Rentals",
      slug: "short-term-rentals",
      verified: true,
      publishedWork: [{ name: "Cabin Stay site" }],
    });
    const proCopy = buildSpecificIndustryDescription({
      name: "Professional Services",
      slug: "professional-services",
      verified: false,
    });
    expect(strCopy.toLowerCase()).toMatch(/guest|booking|propert/);
    expect(proCopy.toLowerCase()).toMatch(/consultation|expertise|credibility/);
    expect(strCopy).not.toEqual(proCopy.replace(/Professional Services/g, "Short-Term Rentals"));
  });

  it("flags generic copy and passes specific copy", () => {
    expect(
      looksLikeGenericIndustryCopy(
        "Businesses in this industry need a strong online presence and a professional website to attract more customers and grow your business.",
        "Short-Term Rentals",
      ),
    ).toBe(true);
    expect(
      failsIndustrySubstitutionTest(
        "Businesses in Short-Term Rentals need a strong online presence to attract more customers.",
        "Short-Term Rentals",
      ),
    ).toBe(true);
    expect(
      looksLikeGenericIndustryCopy(
        "Short-Term Rentals sites help guests compare availability, policies, and booking paths before they trust a direct enquiry.",
        "Short-Term Rentals",
      ),
    ).toBe(false);
  });

  it("IMPROVE_INDUSTRY replaces generic blurb with sector-specific copy", () => {
    const industry = {
      id: "ind-str",
      slug: "short-term-rentals",
      name: "Short-Term Rentals",
      description:
        "Businesses in this industry need a professional website to attract more customers and stand out in a competitive market.",
      group: "proven",
      hasVerifiedProjectExperience: true,
      relatedServiceLinks: [],
      relatedSolutionSlugs: null,
      seoTitle: null,
      seoDescription: null,
    } as unknown as Industry;

    const payload = heuristicIndustryProposal({
      industry,
      action: "IMPROVE_INDUSTRY",
      lockedFields: [],
      verified: true,
      publishedWork: [{ name: "Zen Cabin", slug: "zen-cabin" }],
    });
    const desc = String(payload.fields.find((f) => f.field === "description")?.proposed || "");
    expect(desc.length).toBeGreaterThan(40);
    expect(looksLikeGenericIndustryCopy(desc, "Short-Term Rentals")).toBe(false);
    expect(failsIndustrySubstitutionTest(desc, "Short-Term Rentals")).toBe(false);
    expect(desc.toLowerCase()).toMatch(/guest|booking|propert|availab/);
  });

  it("GENERATE_SEO avoids mechanical expert templates", () => {
    const payload = heuristicIndustryProposal({
      industry: {
        id: "ind1",
        slug: "short-term-rentals",
        name: "Short-Term Rentals",
        description: "",
        seoTitle: null,
        seoDescription: null,
      } as unknown as Industry,
      action: "GENERATE_SEO",
      lockedFields: [],
      verified: false,
    });
    const title = String(payload.fields.find((f) => f.field === "seoTitle")?.proposed || "");
    expect(title.toLowerCase()).not.toMatch(/expert .+ web design agency/);
    expect(title.toLowerCase()).not.toMatch(/^web design for /);
  });

  it("prompt versions bumped for industry improve/seo/specificity", () => {
    expect(PROMPT_VERSIONS.industryImprove).toBe("industry.improve:v2");
    expect(PROMPT_VERSIONS.industrySeo).toBe("industry.seo:v2");
    expect(PROMPT_VERSIONS.industrySpecificity).toBe("industry.specificity:v2");
    expect(INDUSTRY_ACTIONS.find((a) => a.id === "IMPROVE_INDUSTRY")?.promptVersion).toBe(
      "industry.improve:v2",
    );
  });
});
