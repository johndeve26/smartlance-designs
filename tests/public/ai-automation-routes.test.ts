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

  it("redirects legacy /services/ai-* paths", () => {
    expect(legacyAiServiceRedirects["/services/ai-agents"]).toBe(
      "/ai-automation/ai-agents",
    );
    expect(legacyAiServiceRedirects["/services/ai-solutions"]).toBe(AI_AUTOMATION_HUB);
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
