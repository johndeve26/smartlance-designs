import { describe, expect, it } from "vitest";
import {
  aiAutomationMenu,
  companyMenu,
  footerNavigation,
  headerTopNavigation,
  mobileUtilityLinks,
  preFooterCta,
  primaryCta,
  resourcesMegaMenu,
  servicesMegaMenu,
  solutionsMenu,
  workMenu,
} from "@/data/navigation";
import { activeNavSection } from "@/lib/navigation/active-section";
import { PUBLIC_CTAS } from "@/lib/public/cta-map";

const INTERNAL_PATH = /^\/[a-z0-9\-./?#]*$/i;

function collectHrefs(links: { href: string }[]): string[] {
  return links.map((l) => l.href);
}

describe("public navigation IA", () => {
  it("exposes the curated top-level header items", () => {
    expect(headerTopNavigation.map((i) => i.label)).toEqual([
      "Services",
      "AI & Automation",
      "Solutions",
      "Work",
      "Resources",
      "Company",
    ]);
  });

  it("does not promote blog or contact as top-level header labels", () => {
    const labels = headerTopNavigation.map((i) => i.label.toLowerCase());
    expect(labels).not.toContain("blog");
    expect(labels).not.toContain("contact");
    expect(labels).not.toContain("about");
    expect(labels).not.toContain("how we work");
    expect(labels).not.toContain("pricing");
  });

  it("uses crawlable internal hrefs for primary CTA and hubs", () => {
    expect(primaryCta.href).toBe("/contact");
    expect(primaryCta.label).toBe("Tell Us About Your Project");
    for (const item of headerTopNavigation) {
      expect(item.href).toMatch(INTERNAL_PATH);
    }
  });

  it("maps active sections for services, AI, solutions, work, resources, and company", () => {
    expect(activeNavSection("/services/website-design")).toBe("services");
    expect(activeNavSection("/seo/local-seo")).toBe("services");
    expect(activeNavSection("/platforms/wordpress")).toBe("services");
    expect(activeNavSection("/ai-automation/ai-agents")).toBe("ai-automation");
    expect(activeNavSection("/solutions/slow-website")).toBe("solutions");
    expect(activeNavSection("/solutions/respond-to-leads-faster")).toBe("solutions");
    expect(activeNavSection("/blog/example")).toBe("resources");
    expect(activeNavSection("/free-tools")).toBe("resources");
    expect(activeNavSection("/how-we-work")).toBe("company");
    expect(activeNavSection("/about")).toBe("company");
    expect(activeNavSection("/pricing")).toBe("company");
    expect(activeNavSection("/work/example")).toBe("work");
  });

  it("lists core website services and platform groups", () => {
    expect(servicesMegaMenu.links.map((l) => l.label)).toEqual([
      "Web Design",
      "Development",
      "SEO",
      "Conversion",
      "Maintenance",
      "Digital Growth",
    ]);
    expect(servicesMegaMenu.platforms.map((p) => p.label)).toEqual([
      "Website & Commerce",
      "CRM & Business",
      "AI & Automation",
      "View All Platforms",
    ]);
  });

  it("lists AI and automation service lines", () => {
    expect(aiAutomationMenu.map((item) => item.label)).toEqual([
      "AI & Automation Overview",
      "AI Agents",
      "Workflow Automation",
      "Voice AI",
      "CRM & Lead Automation",
      "Integrations",
      "Custom AI Tools",
    ]);
    for (const link of aiAutomationMenu) {
      expect(link.href.startsWith("/ai-automation")).toBe(true);
    }
  });

  it("lists problem-category solutions with direct routes where available", () => {
    const hrefs = collectHrefs(solutionsMenu);
    expect(hrefs).toContain("/solutions#website-quality");
    expect(hrefs).toContain("/solutions/respond-to-leads-faster");
    expect(hrefs).toContain("/solutions/automate-repetitive-work");
    expect(hrefs).toContain("/solutions");
  });

  it("organizes work and company menus", () => {
    expect(workMenu.map((item) => item.label)).toEqual([
      "Websites",
      "AI",
      "Automation",
      "View All Work",
    ]);
    expect(companyMenu.map((item) => item.href)).toEqual([
      "/about",
      "/how-we-work",
      "/contact",
      "/pricing",
    ]);
  });

  it("organizes resources by free tools and learn", () => {
    const freeTools = resourcesMegaMenu.groups.find((g) => g.title === "Free Tools");
    expect(freeTools?.links.map((l) => l.href)).toEqual([
      "/free-website-review",
      "/website-brief",
      "/project-planner",
    ]);
    const learn = resourcesMegaMenu.groups.find((g) => g.title === "Learn");
    expect(learn?.links.map((l) => l.href)).toEqual([
      "/guides",
      "/blog",
      "/glossary",
      "/templates",
    ]);
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

  it("uses curated footer columns including AI and company", () => {
    expect(footerNavigation.services.length).toBeLessThanOrEqual(8);
    expect(footerNavigation.aiAutomation.length).toBe(7);
    expect(footerNavigation.company.some((l) => l.href === "/how-we-work")).toBe(
      true,
    );
    expect(footerNavigation.resources.some((l) => l.href === "/free-tools")).toBe(
      true,
    );
    expect(footerNavigation.legal.some((l) => l.href === "/sitemap.xml")).toBe(
      true,
    );
  });

  it("defines pre-footer commercial CTAs", () => {
    expect(preFooterCta.primary.href).toBe("/contact");
    expect(preFooterCta.secondary.href).toBe("/project-planner");
    expect(preFooterCta.secondary.label).toBe("Plan Your Project");
  });

  it("centralizes canonical public CTA destinations", () => {
    expect(PUBLIC_CTAS.project.href).toBe("/contact");
    expect(PUBLIC_CTAS.freeReview.href).toBe("/free-website-review");
    expect(PUBLIC_CTAS.howWeWork.href).toBe("/how-we-work");
    expect(PUBLIC_CTAS.freeTools.href).toBe("/free-tools");
  });
});
