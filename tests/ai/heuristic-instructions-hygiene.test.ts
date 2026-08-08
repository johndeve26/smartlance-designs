import { describe, expect, it } from "vitest";
import { heuristicPlatformProposal } from "@/lib/ai/content-assistants/platform/heuristic";
import { heuristicServiceProposal } from "@/lib/ai/content-assistants/service/heuristic";
import type { Platform, Service } from "@prisma/client";

describe("Heuristic customInstructions hygiene", () => {
  it("does not append editor instructions into Platform proposed copy", () => {
    const platform = {
      id: "p1",
      name: "WordPress",
      slug: "wordpress",
      summary: "Existing strong summary about hospitality and content sites.",
      description: "Existing strong description with trade-offs.",
      tagline: null,
      audiences: [],
      whenItFits: [],
      capabilities: [],
      challenges: [],
      faqs: null,
      seoTitle: "WordPress",
      seoDescription: "Fit guidance",
      ctaTitle: null,
      ctaDescription: null,
      conversionNote: null,
      migrationNote: null,
      seoSection: null,
      relatedServiceHrefs: [],
    } as unknown as Platform;

    const payload = heuristicPlatformProposal({
      platform,
      action: "RESEARCH_AND_IMPROVE",
      lockedFields: [],
      customInstructions: "Prefer official sources. Do not invent partner claims.",
      researchSources: [
        {
          url: "https://wordpress.org/",
          title: "WordPress",
          domain: "wordpress.org",
          sourceType: "OFFICIAL",
          checkedAt: new Date().toISOString(),
          whyUsed: "Open source CMS",
        },
      ],
    });

    const blob = JSON.stringify(payload.fields);
    expect(blob).not.toMatch(/Editor note/i);
    expect(blob).not.toMatch(/Prefer official sources/);
  });

  it("does not append editor instructions into Service proposed copy", () => {
    const service = {
      id: "s1",
      title: "Website Redesign",
      slug: "website-redesign",
      summary: "Transform outdated sites.",
      description: "Focused redesign for clarity and conversion.",
      audience: "Businesses with outdated websites",
      tagline: null,
      narrative: null,
      narrativeTitle: null,
      problems: [],
      deliverables: [],
      process: [],
      capabilities: [],
      idealFor: [],
      faqs: [],
      seoTitle: "Website Redesign",
      seoDescription: "Redesign services",
      primaryCtaLabel: null,
      primaryCtaHref: null,
      relatedProjectSlugs: [],
    } as unknown as Service;

    const payload = heuristicServiceProposal({
      service,
      action: "IMPROVE_SERVICE",
      lockedFields: [],
      customInstructions: "Differentiate from Website Design.",
    });

    const blob = JSON.stringify(payload.fields);
    expect(blob).not.toMatch(/Editor note/i);
    expect(blob).not.toMatch(/Differentiate from Website Design/);
  });
});
