import { describe, expect, it } from "vitest";
import type { Industry, Platform, Service, Solution } from "@prisma/client";
import { shouldUseHeuristicFirst } from "@/lib/ai/content-assistants/heuristic-routing";
import { heuristicIndustryProposal } from "@/lib/ai/content-assistants/industry/heuristic";
import { heuristicServiceProposal } from "@/lib/ai/content-assistants/service/heuristic";
import { heuristicSolutionProposal } from "@/lib/ai/content-assistants/solution/heuristic";
import { heuristicPlatformProposal } from "@/lib/ai/content-assistants/platform/heuristic";
import { getContentAssistant } from "@/lib/ai/content-assistants/registry";

function baseService(over: Partial<Service> = {}): Service {
  return {
    id: "svc1",
    slug: "website-design",
    href: "/services/website-design",
    title: "Website Design",
    summary: "Draft service summary.",
    description: "Draft service description.",
    narrative: null,
    category: "design",
    icon: "palette",
    featured: false,
    navigationFeatured: false,
    displayOrder: 1,
    primaryCtaLabel: null,
    primaryCtaHref: null,
    problems: [],
    deliverables: [],
    process: [],
    faqs: [],
    relatedSolutionSlugs: [],
    relatedProjectSlugs: [],
    relatedPlatformSlugs: [],
    seoTitle: null,
    seoDescription: null,
    ogTitle: null,
    ogDescription: null,
    ogImagePath: null,
    noIndex: false,
    canonicalOverride: null,
    status: "DRAFT",
    publishedAt: null,
    createdById: null,
    updatedById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  } as Service;
}

function baseSolution(over: Partial<Solution> = {}): Solution {
  return {
    id: "sol1",
    slug: "slow-website",
    href: "/solutions/slow-website",
    name: "Slow Website",
    title: "Slow Website",
    summary: "Draft solution summary.",
    description: "Draft solution description.",
    icon: "gauge",
    featured: false,
    displayOrder: 1,
    relatedServiceSlugs: [],
    seoTitle: null,
    seoDescription: null,
    ogTitle: null,
    ogDescription: null,
    ogImagePath: null,
    noIndex: false,
    canonicalOverride: null,
    pageContent: null,
    status: "DRAFT",
    publishedAt: null,
    createdById: null,
    updatedById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  } as Solution;
}

function basePlatform(over: Partial<Platform> = {}): Platform {
  return {
    id: "plat1",
    slug: "shopify",
    href: "/platforms/shopify",
    name: "Shopify",
    title: "Shopify",
    summary: "Draft platform summary.",
    description: "Draft platform description.",
    tagline: null,
    icon: "shopping-bag",
    group: "commerce",
    prominence: "primary",
    featured: true,
    navigationFeatured: true,
    verifiedExperience: false,
    platformMatch: "shopify",
    displayOrder: 1,
    capabilities: [],
    whenItFits: [],
    challenges: [],
    relatedServiceHrefs: [],
    seoTitle: null,
    seoDescription: null,
    ogTitle: null,
    ogDescription: null,
    ogImagePath: null,
    noIndex: false,
    canonicalOverride: null,
    lastReviewedAt: null,
    status: "DRAFT",
    publishedAt: null,
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
    slug: "shopify",
    name: "Shopify",
    description: "descr",
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
    status: "DRAFT",
    publishedAt: null,
    createdById: null,
    updatedById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  } as Industry;
}

describe("shouldUseHeuristicFirst", () => {
  it("routes core editorial actions through heuristics", () => {
    expect(shouldUseHeuristicFirst("INDUSTRY", "IMPROVE_INDUSTRY")).toBe(true);
    expect(shouldUseHeuristicFirst("SERVICE", "IMPROVE_SERVICE")).toBe(true);
    expect(shouldUseHeuristicFirst("SOLUTION", "IMPROVE_SOLUTION")).toBe(true);
    expect(shouldUseHeuristicFirst("PLATFORM", "IMPROVE_PLATFORM")).toBe(true);
    expect(shouldUseHeuristicFirst("GUIDE", "IMPROVE_GUIDE")).toBe(true);
  });
});

describe("improve actions on thin draft content produce fields", () => {
  it("INDUSTRY IMPROVE_INDUSTRY", () => {
    const payload = heuristicIndustryProposal({
      industry: baseIndustry(),
      action: "IMPROVE_INDUSTRY",
      lockedFields: [],
      verified: false,
    });
    expect(payload.fields.length).toBeGreaterThan(0);
    expect(payload.fields.some((f) => f.field === "description")).toBe(true);
  });

  it("SERVICE IMPROVE_SERVICE", () => {
    const payload = heuristicServiceProposal({
      service: baseService(),
      action: "IMPROVE_SERVICE",
      lockedFields: [],
    });
    expect(payload.fields.length).toBeGreaterThan(0);
  });

  it("SOLUTION IMPROVE_SOLUTION", () => {
    const payload = heuristicSolutionProposal({
      solution: baseSolution(),
      action: "IMPROVE_SOLUTION",
      lockedFields: [],
    });
    expect(payload.fields.length).toBeGreaterThan(0);
  });

  it("PLATFORM IMPROVE_PLATFORM", () => {
    const payload = heuristicPlatformProposal({
      platform: basePlatform(),
      action: "IMPROVE_PLATFORM",
      lockedFields: [],
    });
    expect(payload.fields.length).toBeGreaterThan(0);
  });
});

describe("registry improve actions", () => {
  const cases: Array<{
    entityType:
      | "GUIDE"
      | "COMPARISON"
      | "CHECKLIST"
      | "GLOSSARY"
      | "TEMPLATE"
      | "TOOL"
      | "HOMEPAGE";
    actionPrefix: string;
  }> = [
    { entityType: "GUIDE", actionPrefix: "IMPROVE" },
    { entityType: "COMPARISON", actionPrefix: "IMPROVE" },
    { entityType: "CHECKLIST", actionPrefix: "IMPROVE" },
    { entityType: "GLOSSARY", actionPrefix: "IMPROVE" },
    { entityType: "TEMPLATE", actionPrefix: "IMPROVE" },
    { entityType: "TOOL", actionPrefix: "IMPROVE" },
    { entityType: "HOMEPAGE", actionPrefix: "IMPROVE" },
  ];

  it.each(cases)(
    "$entityType improve action uses heuristic-first routing",
    ({ entityType, actionPrefix }) => {
      const mod = getContentAssistant(entityType);
      const action =
        mod.actions.find((a) => a.id.startsWith(actionPrefix))?.id || "";
      expect(action).toBeTruthy();
      expect(shouldUseHeuristicFirst(entityType, action)).toBe(true);
    },
  );
});
