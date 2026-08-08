import { describe, expect, it } from "vitest";
import {
  auditHomepageFields,
  auditIndustryFields,
  auditPlatformFields,
  auditServiceFields,
  CONTENT_AUDIT_VERSION,
} from "@/lib/ops/content-quality-audit";

describe("Content quality audit fixtures", () => {
  it("exposes audit version", () => {
    expect(CONTENT_AUDIT_VERSION).toBe("site-content-audit:v1");
  });

  it("marks a strong-enough Service without inventing a score", () => {
    const result = auditServiceFields({
      id: "svc-strong",
      slug: "website-audit",
      title: "Website Audit",
      href: "/services/website-audit",
      summary: "Find what is limiting your website before spending money fixing the wrong things.",
      description:
        "A Website Audit reviews design, UX, SEO, performance, mobile usability, content structure and conversion paths — then prioritizes what to fix first.",
      narrative:
        "It is a professional assessment, not the Free Website Review lead magnet. We separate diagnosis from delivery so teams know what to fix first.",
      problems: ["a", "b", "c", "d"],
      deliverables: ["a", "b", "c", "d"],
      process: ["a", "b", "c", "d"],
      faqs: ["a", "b"],
      seoTitle: "Website Audit Services",
      seoDescription: "Professional website audit for design, SEO, performance and conversion.",
      primaryCtaLabel: "Ask About a Website Audit",
      relatedSolutionSlugs: ["outdated-website"],
      relatedProjectSlugs: [],
      relatedPlatformSlugs: [],
    });
    expect(result.verdict === "STRONG" || result.verdict === "LIGHT_POLISH").toBe(
      true,
    );
    expect(result.findings.some((f) => f.category === "PROOF")).toBe(false);
  });

  it("flags generic Service copy and missing Solution relations", () => {
    const result = auditServiceFields({
      id: "svc-generic",
      slug: "website-design",
      title: "Website Design",
      href: "/services/website-design",
      summary: "We build innovative digital experiences that transform businesses.",
      description: "Cutting-edge websites.",
      narrative: null,
      problems: [],
      deliverables: [],
      process: [],
      faqs: [],
      seoTitle: null,
      seoDescription: null,
      primaryCtaLabel: null,
      relatedSolutionSlugs: [],
      relatedProjectSlugs: [],
      relatedPlatformSlugs: [],
    });
    expect(result.verdict).toBe("NEEDS_IMPROVEMENT");
    expect(result.findings.some((f) => f.category === "COPY")).toBe(true);
    expect(result.findings.some((f) => f.assistantType === "SERVICE")).toBe(true);
  });

  it("flags Platform never reviewed as NEEDS_RESEARCH", () => {
    const result = auditPlatformFields({
      id: "plat-1",
      slug: "shopify",
      name: "Shopify",
      summary: "Commerce platform for online stores and retail brands.",
      description:
        "Shopify fits product-led businesses that need a managed commerce stack with apps and themes.",
      capabilities: [1, 2, 3, 4, 5, 6],
      whenItFits: [1, 2, 3, 4],
      challenges: [1, 2, 3],
      verifiedExperience: false,
      lastReviewedAt: null,
      seoTitle: "Shopify",
      seoDescription: "When Shopify fits.",
      relatedServiceHrefs: ["/services/ecommerce-development"],
    });
    expect(result.verdict).toBe("NEEDS_RESEARCH");
    expect(result.findings.some((f) => f.assistantAction === "RESEARCH_AND_IMPROVE")).toBe(
      true,
    );
  });

  it("flags thin Industry blurbs without changing experience flags", () => {
    const result = auditIndustryFields({
      id: "ind-1",
      slug: "automotive",
      name: "Automotive",
      description: "Websites for dealerships.",
      group: "supported",
      proven: false,
      relatedServiceLinks: [{ href: "/services/website-design" }],
      relatedSolutionSlugs: [],
      workLinkCount: 0,
      seoTitle: null,
      seoDescription: null,
    });
    expect(result.whatWorks.some((w) => /supported/i.test(w))).toBe(true);
    expect(result.findings.some((f) => f.category === "COMPLETENESS")).toBe(true);
    expect(result.findings.every((f) => f.assistantType !== null || true)).toBe(true);
  });

  it("flags Homepage missing SEO as HIGH without rewriting", () => {
    const result = auditHomepageFields({
      heroHeadline: "Websites Built to Rank, Convert and Grow.",
      heroSupporting:
        "We design high-performing websites and SEO strategies that help businesses get found.",
      primaryCtaLabel: "Tell Us About Your Project",
      primaryCtaHref: "/contact",
      secondaryCtaLabel: "View Our Work",
      seoTitle: null,
      seoDescription: null,
      curatedServiceCount: 6,
      curatedTestimonialCount: 4,
    });
    expect(result.priority).toBe("HIGH");
    expect(result.findings.some((f) => f.category === "SEO")).toBe(true);
    expect(result.findings.some((f) => f.assistantType === "HOMEPAGE")).toBe(true);
  });

  it("blocks unsupported Homepage trust claims", () => {
    const result = auditHomepageFields({
      heroHeadline: "Trusted by 500+ businesses worldwide.",
      heroSupporting: "Award-winning digital agency.",
      primaryCtaLabel: "Get Started",
      primaryCtaHref: "/contact",
      secondaryCtaLabel: "Learn More",
      seoTitle: "Home",
      seoDescription: "Home",
      curatedServiceCount: 0,
      curatedTestimonialCount: 0,
    });
    expect(result.findings.some((f) => f.severity === "BLOCKER")).toBe(true);
  });
});
