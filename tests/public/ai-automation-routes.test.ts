import { describe, expect, it } from "vitest";
import {
  AI_AUTOMATION_HUB,
  aiAutomationPaths,
  aiAutomationSlugs,
  isAiAutomationSlug,
  legacyAiServiceRedirects,
} from "@/lib/public/ai-automation-routes";
import { getAiAutomationPage } from "@/lib/public/ai-automation-content";
import { getOperationsSolution, operationsSolutionSlugs } from "@/lib/public/operations-solutions-content";
import { getAvailableWorkCapabilities, countWorkCapability } from "@/lib/public/work-capabilities";
import { aiAutomationMenu } from "@/data/navigation";
import { activeNavSection } from "@/lib/navigation/active-section";
import { buildMetadataWithOrigin } from "@/lib/seo/page-metadata";
import { siteOriginFromConfig } from "@/lib/seo/canonical";

const ORIGIN = siteOriginFromConfig();

describe("AI & Automation routes", () => {
  it("defines hub and child slugs", () => {
    expect(aiAutomationSlugs).toHaveLength(6);
    expect(aiAutomationPaths["ai-agents"].path).toBe("/ai-automation/ai-agents");
  });

  it("provides substantial page content for every child route", () => {
    for (const slug of aiAutomationSlugs) {
      const page = getAiAutomationPage(slug);
      expect(page).not.toBeNull();
      expect(page?.heroTitle.length).toBeGreaterThan(20);
      expect(page?.sections.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("gives each child route unique metaTitle, metaDescription, and heroTitle", () => {
    const metaTitles = new Set<string>();
    const metaDescriptions = new Set<string>();
    const heroTitles = new Set<string>();

    for (const slug of aiAutomationSlugs) {
      const page = getAiAutomationPage(slug);
      expect(page).not.toBeNull();
      metaTitles.add(page!.metaTitle);
      metaDescriptions.add(page!.metaDescription);
      heroTitles.add(page!.heroTitle);
    }

    expect(metaTitles.size).toBe(aiAutomationSlugs.length);
    expect(metaDescriptions.size).toBe(aiAutomationSlugs.length);
    expect(heroTitles.size).toBe(aiAutomationSlugs.length);
  });

  it("self-canonicalizes each child route via metadata path", () => {
    for (const slug of aiAutomationSlugs) {
      const page = getAiAutomationPage(slug);
      expect(page).not.toBeNull();
      const metadata = buildMetadataWithOrigin({
        origin: ORIGIN,
        title: page!.metaTitle,
        description: page!.metaDescription,
        path: `/ai-automation/${slug}`,
      });
      expect(metadata.alternates?.canonical).toBe(
        `${ORIGIN}/ai-automation/${slug}`,
      );
      expect(metadata.robots).toEqual({ index: true, follow: true });
    }
  });

  it("redirects legacy /services/ai-* paths", () => {
    expect(legacyAiServiceRedirects["/services/ai-agents"]).toBe(
      "/ai-automation/ai-agents",
    );
    expect(legacyAiServiceRedirects["/services/ai-solutions"]).toBe(AI_AUTOMATION_HUB);
  });

  it("defines all six legacy /services/ai-* redirect keys with exact destinations", () => {
    const expected: Record<string, string> = {
      "/services/ai-solutions": AI_AUTOMATION_HUB,
      "/services/ai-agents": "/ai-automation/ai-agents",
      "/services/workflow-automation": "/ai-automation/workflow-automation",
      "/services/voice-ai": "/ai-automation/voice-ai",
      "/services/ai-integrations": "/ai-automation/integrations",
      "/services/custom-ai-tools": "/ai-automation/custom-ai-tools",
    };
    expect(Object.keys(legacyAiServiceRedirects).sort()).toEqual(
      Object.keys(expected).sort(),
    );
    for (const [from, to] of Object.entries(expected)) {
      expect(legacyAiServiceRedirects[from]).toBe(to);
    }
  });

  it("rejects invalid slugs (notFound gate)", () => {
    expect(isAiAutomationSlug("not-real")).toBe(false);
    expect(getAiAutomationPage("not-real" as never)).toBeNull();
  });

  it("maps /ai-automation/* to ai-automation nav section", () => {
    expect(activeNavSection("/ai-automation")).toBe("ai-automation");
    expect(activeNavSection("/ai-automation/voice-ai")).toBe("ai-automation");
    expect(activeNavSection("/services/website-design")).toBe("services");
  });

  it("header AI links resolve to canonical routes", () => {
    for (const link of aiAutomationMenu) {
      expect(link.href.startsWith("/ai-automation")).toBe(true);
    }
  });

  it("validates ai slug helper", () => {
    expect(isAiAutomationSlug("ai-agents")).toBe(true);
    expect(isAiAutomationSlug("invalid")).toBe(false);
  });
});

describe("operations solution pages", () => {
  it("defines six distinct operations solutions", () => {
    expect(operationsSolutionSlugs).toHaveLength(6);
    for (const slug of operationsSolutionSlugs) {
      const content = getOperationsSolution(slug);
      expect(content?.whyItHappens.length).toBeGreaterThan(3);
      expect(content?.capabilities.length).toBeGreaterThan(0);
    }
  });
});

describe("work capability filters", () => {
  it("only exposes populated capability filters in menu", () => {
    const links = getAvailableWorkCapabilities();
    expect(links.some((l) => l.label === "View All Work")).toBe(true);
    if (countWorkCapability("ai") === 0) {
      expect(links.some((l) => l.href.includes("capability=ai"))).toBe(false);
    }
  });
});
