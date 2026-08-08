import { describe, expect, it } from "vitest";
import {
  footerNavigation,
  headerTopNavigation,
  industriesMenu,
  mobileUtilityLinks,
  preFooterCta,
  primaryCta,
  resourcesMegaMenu,
  servicesMegaMenu,
  solutionsMenu,
} from "@/data/navigation";
import { activeNavSection } from "@/lib/navigation/active-section";

const INTERNAL_PATH = /^\/[a-z0-9\-./]*$/i;

function collectHrefs(links: { href: string }[]): string[] {
  return links.map((l) => l.href);
}

describe("public navigation IA", () => {
  it("exposes the curated top-level header items", () => {
    expect(headerTopNavigation.map((i) => i.label)).toEqual([
      "Services",
      "Solutions",
      "Work",
      "Industries",
      "Resources",
      "About",
    ]);
  });

  it("does not promote blog, pricing, or contact to top-level header", () => {
    const labels = headerTopNavigation.map((i) => i.label.toLowerCase());
    expect(labels).not.toContain("blog");
    expect(labels).not.toContain("pricing");
    expect(labels).not.toContain("contact");
    expect(labels).not.toContain("platforms");
  });

  it("uses crawlable internal hrefs for primary CTA and hubs", () => {
    expect(primaryCta.href).toBe("/contact");
    expect(primaryCta.label).toBe("Tell Us About Your Project");
    for (const item of headerTopNavigation) {
      expect(item.href).toMatch(INTERNAL_PATH);
    }
  });

  it("maps active sections for services, solutions, resources, and platforms", () => {
    expect(activeNavSection("/services/website-design")).toBe("services");
    expect(activeNavSection("/seo/local-seo")).toBe("services");
    expect(activeNavSection("/platforms/wordpress")).toBe("services");
    expect(activeNavSection("/solutions/slow-website")).toBe("solutions");
    expect(activeNavSection("/industries/hospitality")).toBe("industries");
    expect(activeNavSection("/blog/example")).toBe("resources");
    expect(activeNavSection("/guides/example")).toBe("resources");
    expect(activeNavSection("/work/example")).toBe("work");
    expect(activeNavSection("/about")).toBe("about");
  });

  it("includes services mega menu groups and platform shortcuts", () => {
    expect(servicesMegaMenu.groups.map((g) => g.title)).toEqual([
      "Build",
      "Grow",
      "Improve",
    ]);
    expect(servicesMegaMenu.platforms.map((p) => p.label)).toEqual([
      "WordPress",
      "Shopify",
      "Webflow",
      "WooCommerce",
      "View All Platforms",
    ]);
    expect(servicesMegaMenu.actions.some((a) => a.href === "/pricing")).toBe(
      true,
    );
  });

  it("lists problem-led solutions with canonical slugs", () => {
    const hrefs = collectHrefs(solutionsMenu);
    expect(hrefs).toContain("/solutions/website-not-generating-leads");
    expect(hrefs).toContain("/solutions/local-business-visibility");
    expect(hrefs).toContain("/solutions");
  });

  it("features industries with detail routes and explore hub", () => {
    const hrefs = collectHrefs(industriesMenu);
    expect(hrefs).toContain("/industries/short-term-rentals");
    expect(hrefs).toContain("/industries");
  });

  it("organizes resources by purpose including platform selector", () => {
    const learn = resourcesMegaMenu.groups.find((g) => g.title === "Learn");
    expect(learn?.links.map((l) => l.href)).toEqual([
      "/blog",
      "/guides",
      "/glossary",
    ]);
    const decide = resourcesMegaMenu.groups.find(
      (g) => g.title === "Make decisions",
    );
    expect(decide?.links.some((l) => l.href === "/tools/website-platform-selector")).toBe(
      true,
    );
  });

  it("keeps mobile utility links out of primary header labels", () => {
    const labels = headerTopNavigation.map((l) => l.label);
    for (const link of mobileUtilityLinks) {
      expect(labels).not.toContain(link.label);
    }
    expect(mobileUtilityLinks.map((l) => l.href)).toEqual([
      "/project-planner",
      "/pricing",
      "/contact",
    ]);
  });

  it("uses curated footer columns without sitemap dumping", () => {
    expect(footerNavigation.services.length).toBeLessThanOrEqual(8);
    expect(footerNavigation.solutions.length).toBeLessThanOrEqual(6);
    expect(footerNavigation.explore.some((l) => l.href === "/work")).toBe(true);
    expect(footerNavigation.legal.some((l) => l.href === "/sitemap.xml")).toBe(
      true,
    );
  });

  it("defines pre-footer commercial CTAs", () => {
    expect(preFooterCta.primary.href).toBe("/contact");
    expect(preFooterCta.secondary.href).toBe("/project-planner");
    expect(preFooterCta.secondary.label).toBe("Plan Your Project");
  });
});
