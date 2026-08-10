import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import { buildMetadata } from "@/lib/seo";
import { buildMetadataWithOrigin } from "@/lib/seo/page-metadata";
import { siteOriginFromConfig } from "@/lib/seo/canonical";
import {
  aiAutomationSlugs,
  AI_AUTOMATION_HUB,
} from "@/lib/public/ai-automation-routes";
import { getAiAutomationPage } from "@/lib/public/ai-automation-content";
import { getOperationsSolution } from "@/lib/public/operations-solutions-content";

const ORIGIN = siteOriginFromConfig();

describe("indexability acceptance", () => {
  it("keeps work page canonical at /work regardless of query semantics", () => {
    const metadata = buildMetadata({
      title: "Work",
      description: "Selected projects",
      path: "/work",
    });
    expect(metadata.alternates?.canonical).toBe(`${ORIGIN}/work`);
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });

  it("does not apply noIndex to public AI hub or child pages", () => {
    const hub = buildMetadataWithOrigin({
      origin: ORIGIN,
      title: "AI & Automation",
      description: "Practical AI",
      path: AI_AUTOMATION_HUB,
    });
    expect(hub.robots).toEqual({ index: true, follow: true });

    for (const slug of aiAutomationSlugs) {
      const page = getAiAutomationPage(slug)!;
      const metadata = buildMetadataWithOrigin({
        origin: ORIGIN,
        title: page.metaTitle,
        description: page.metaDescription,
        path: `/ai-automation/${slug}`,
      });
      expect(metadata.robots).toEqual({ index: true, follow: true });
    }
  });

  it("robots.txt allows public crawl and disallows admin and api", async () => {
    const config = await robots();
    const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
    const defaultRule = rules.find(
      (r) => typeof r === "object" && r.userAgent === "*",
    );
    expect(defaultRule).toBeTruthy();
    if (defaultRule && typeof defaultRule === "object") {
      expect(defaultRule.allow).toBe("/");
      expect(defaultRule.disallow).toEqual(
        expect.arrayContaining(["/admin/", "/api/"]),
      );
    }
    expect(config.sitemap).toMatch(/\/sitemap\.xml$/);
  });

  it("differentiates AI child pages by heroTitle and first section heading", () => {
    const signatures = aiAutomationSlugs.map((slug) => {
      const page = getAiAutomationPage(slug)!;
      const firstHeading = page.sections[0]?.title ?? "";
      return `${page.heroTitle}::${firstHeading}`;
    });
    expect(new Set(signatures).size).toBe(aiAutomationSlugs.length);
  });

  it("gives lead-related operations solutions distinct metaTitles", () => {
    const leadSlugs = [
      "respond-to-leads-faster",
      "stop-leads-falling-through-the-cracks",
      "automate-customer-enquiries",
    ] as const;
    const titles = leadSlugs.map(
      (slug) => getOperationsSolution(slug)!.metaTitle,
    );
    expect(new Set(titles).size).toBe(leadSlugs.length);
  });
});
