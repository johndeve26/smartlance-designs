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

const SLUG = "freelance-os";

describe("Freelance OS case study content", () => {
  const project = getProjectBySlug(SLUG);
  const narrative = caseStudyNarratives[SLUG];

  it("exists in the published portfolio catalog", () => {
    expect(project).toBeTruthy();
    expect(project?.published).toBe(true);
    expect(project?.featured).toBe(true);
  });

  it("appears near the top of /work ordering", () => {
    const visible = getVisibleProjects();
    expect(visible[0]?.slug).toBe("padeya");
    expect(visible[1]?.slug).toBe(SLUG);
    expect(visible.some((item) => item.slug === SLUG)).toBe(true);
  });

  it("defines core project identity", () => {
    expect(project?.name).toBe("Freelance OS");
    expect(project?.client).toBe("Freelance OS");
    expect(project?.industry).toBe("Freelance Technology / SaaS");
    expect(project?.year).toBe(2026);
    expect(project?.platform).toBe("Next.js + FastAPI");
    expect(project?.websiteUrl).toBe("https://getfreelanceos.com/");
    expect(project?.caseStudyKind).toBe("product");
  });

  it("lists the requested services", () => {
    expect(project?.services).toEqual([
      "Product Design",
      "SaaS Development",
      "AI Integration",
      "Platform Architecture",
      "Automation",
    ]);
  });

  it("includes SaaS product narrative sections", () => {
    expect(narrative.heroStatement).toBe("The AI operating system for freelancers.");
    expect(narrative.heroSupportingCopy).toMatch(/fragmented workflow/i);
    expect(narrative.challenges).toHaveLength(7);
    expect(narrative.productPrinciples).toHaveLength(6);
    expect(narrative.approachSteps).toHaveLength(6);
    expect(narrative.productFeatures?.length).toBeGreaterThanOrEqual(8);
    expect(narrative.saasInfrastructure?.length).toBeGreaterThanOrEqual(5);
    expect(narrative.showArchitectureDiagram).toBe(true);
  });

  it("resolves product feature sections for rendering", () => {
    const content = resolveCaseStudyContent(project!);

    expect(content.heroEyebrow).toBe("Project · AI SaaS Platform");
    expect(content.heroSupportingCopy).toMatch(/managing clients/i);
    expect(content.productPrinciples).toHaveLength(6);
    expect(content.productFeatures.length).toBeGreaterThanOrEqual(8);
    expect(content.productFeatures.some((f) => f.title === "Today")).toBe(true);
    expect(
      content.productFeatures.some((f) => f.title === "Opportunity Intelligence"),
    ).toBe(true);
    expect(
      content.productFeatures.some((f) => f.title === "AI Proposal Generator"),
    ).toBe(true);
    expect(content.productFeatures.some((f) => f.title === "Career Coach")).toBe(
      true,
    );
    expect(content.productFeatures.some((f) => f.title === "Public Profile")).toBe(
      true,
    );
    expect(content.saasInfrastructure.length).toBeGreaterThanOrEqual(5);
    expect(content.showArchitectureDiagram).toBe(true);
    expect(content.externalLinkLabel).toBe("Visit Freelance OS");
    expect(content.caseStudyCta?.primaryLabel).toBe("Tell Us About Your Product");
  });

  it("does not include unverified affiliate marketing claims", () => {
    const joined = JSON.stringify(narrative).toLowerCase();
    expect(joined).not.toContain("affiliate center");
    expect(joined).not.toContain("leaderboard");
  });

  it("links related product work", () => {
    const related = getRelatedProjects(project?.relatedSlugs);
    expect(related.map((item) => item.slug)).toEqual(["padeya", "nashville-home-viewer"]);
  });

  it("participates in previous/next navigation", () => {
    const { previous, next } = getAdjacentProjects(SLUG);
    expect(previous?.slug).toBe("padeya");
    expect(next?.slug).toBe("banyan-vacations");
  });

  it("builds SEO metadata and breadcrumb structured data", async () => {
    const metadata = await buildPageMetadata({
      title: project!.metaTitle,
      description: project!.metaDescription,
      path: `/work/${SLUG}`,
      image: project!.heroImage,
    });

    expect(metadata.title).toBe("Freelance OS SaaS Case Study");
    expect(metadata.description).toMatch(/AI-powered SaaS platform/i);
    expect(metadata.alternates?.canonical).toBe(
      "https://smartlancedesigns.com/work/freelance-os",
    );

    const breadcrumb = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Work", path: "/work" },
      { name: "Freelance OS", path: `/work/${SLUG}` },
    ]);
    expect(breadcrumb.itemListElement).toHaveLength(3);
  });

  it("uses placeholder portfolio assets that resolve on disk", () => {
    const assets = [
      project!.image,
      project!.heroImage,
      ...(project!.gallery ?? []).map((item) => item.src),
      ...(narrative.productFeatures ?? [])
        .map((item) => item.image?.src)
        .filter(Boolean),
    ].filter(Boolean) as string[];

    for (const asset of assets) {
      expect(
        existsSync(join(process.cwd(), "public", asset.replace(/^\//, ""))),
      ).toBe(true);
    }
  });

  it("avoids localhost and secret-like strings in public copy", () => {
    const blob = JSON.stringify({ project, narrative });
    expect(blob).not.toMatch(/localhost|127\.0\.0\.1|api_key|bearer /i);
  });
});
