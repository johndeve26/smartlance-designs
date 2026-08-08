import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { caseStudyNarratives } from "@/data/case-study-narratives";
import {
  getProjectBySlug,
  getRelatedProjects,
  getVisibleProjects,
} from "@/data/portfolio";
import {
  getAdjacentProjects,
  resolveCaseStudyContent,
} from "@/lib/case-study";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { breadcrumbJsonLd } from "@/lib/structured-data";

const SLUG = "padeya";

describe("Pàdéyá case study content", () => {
  const project = getProjectBySlug(SLUG);
  const narrative = caseStudyNarratives[SLUG];

  it("exists in the published portfolio catalog", () => {
    expect(project).toBeTruthy();
    expect(project?.published).toBe(true);
    expect(project?.featured).toBe(true);
  });

  it("appears first on /work ordering", () => {
    const visible = getVisibleProjects();
    expect(visible[0]?.slug).toBe(SLUG);
    expect(visible.some((item) => item.slug === SLUG)).toBe(true);
  });

  it("defines core project identity", () => {
    expect(project?.name).toBe("Pàdéyá");
    expect(project?.client).toBe("Pàdéyá");
    expect(project?.industry).toBe("Event Technology");
    expect(project?.year).toBe(2026);
    expect(project?.platform).toBe("Next.js + FastAPI");
    expect(project?.websiteUrl).toBe("https://padeya.com/");
    expect(project?.caseStudyKind).toBe("product");
  });

  it("lists the requested services", () => {
    expect(project?.services).toEqual([
      "Product Design",
      "Web Application Development",
      "Platform Architecture",
      "Automation",
    ]);
  });

  it("includes narrative sections for the product case study", () => {
    expect(narrative.heroStatement).toMatch(/before, during and after an event/i);
    expect(narrative.introHeading).toMatch(/more than an event ticketing website/i);
    expect(narrative.challenges).toHaveLength(5);
    expect(narrative.approachSteps).toHaveLength(5);
    expect(narrative.solutionPoints).toHaveLength(10);
    expect(narrative.highlights.length).toBeGreaterThanOrEqual(10);
    expect(narrative.engineeringStacks?.length).toBeGreaterThanOrEqual(6);
  });

  it("resolves case study content for rendering", () => {
    const content = resolveCaseStudyContent(project!);

    expect(content.heroStatement).toMatch(/hosts, fans, ambassadors and sponsors/i);
    expect(content.introHeading).toMatch(/ticketing website/i);
    expect(content.challenges).toHaveLength(5);
    expect(content.approachSteps).toHaveLength(5);
    expect(content.solutionPoints).toHaveLength(10);
    expect(content.highlights.length).toBeGreaterThanOrEqual(10);
    expect(content.outcomes.length).toBeGreaterThanOrEqual(10);
    expect(content.engineeringStacks?.length).toBeGreaterThanOrEqual(6);
    expect(content.externalLinkLabel).toBe("Visit Pàdéyá");
    expect(content.sectionHeadings.challenge).toMatch(/disconnected event workflows/i);
    expect(content.sectionHeadings.approach).toBe("How we approached the product");
    expect(content.sectionHeadings.solution).toBe("What we designed and built");
    expect(content.sectionHeadings.engineering).toBe(
      "Built as a modern web application",
    );
    expect(content.platformHeading).toBe("Built with Next.js and FastAPI");
    expect(content.caseStudyCta?.title).toMatch(/Digital Product or Platform/i);
  });

  it("links services without inventing missing pages", () => {
    const content = resolveCaseStudyContent(project!);
    expect(content.serviceLinks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Product & UI Design",
          href: "/services/website-design",
        }),
        expect.objectContaining({
          label: "Web Application Development",
          href: "/services/website-development",
        }),
        expect.objectContaining({
          label: "Automation & Integrations",
        }),
      ]),
    );

    const automation = content.serviceLinks?.find(
      (item) => item.label === "Automation & Integrations",
    );
    expect(automation?.href).toBeUndefined();
  });

  it("selects related projects from existing work", () => {
    const related = getRelatedProjects(project?.relatedSlugs);
    expect(related.map((item) => item.slug)).toEqual([
      "nashville-home-viewer",
      "gemini-corporate-relocations",
    ]);
  });

  it("participates in previous/next navigation", () => {
    const { previous, next } = getAdjacentProjects(SLUG);
    expect(previous).toBeNull();
    expect(next?.slug).toBe("banyan-vacations");
  });

  it("builds SEO metadata and breadcrumb structured data", async () => {
    const metadata = await buildPageMetadata({
      title: project!.metaTitle,
      description: project!.metaDescription,
      path: `/work/${SLUG}`,
      image: project!.heroImage,
    });

    expect(metadata.title).toBe("Pàdéyá Event Platform Case Study");
    expect(metadata.description).toMatch(/multi-sided event technology platform/i);
    expect(metadata.alternates?.canonical).toBe(
      "https://smartlancedesigns.com/work/padeya",
    );

    const breadcrumb = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Work", path: "/work" },
      { name: "Pàdéyá", path: `/work/${SLUG}` },
    ]);
    expect(breadcrumb.itemListElement).toHaveLength(3);
  });

  it("uses placeholder portfolio assets that resolve on disk", () => {
    const assets = [
      project!.image,
      project!.heroImage,
      ...(project!.gallery ?? []).map((item) => item.src),
    ].filter(Boolean) as string[];

    for (const asset of assets) {
      expect(
        existsSync(join(process.cwd(), "public", asset.replace(/^\//, ""))),
      ).toBe(true);
    }
  });
});
