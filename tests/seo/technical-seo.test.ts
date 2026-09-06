import { describe, expect, it } from "vitest";
import { sanitizeSiteOrigin } from "@/lib/site";
import {
  resolveCanonicalUrl,
  siteOriginFromConfig,
} from "@/lib/seo/canonical";
import { buildMetadataWithOrigin } from "@/lib/seo/page-metadata";
import {
  organizationJsonLd,
  articleJsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
} from "@/lib/structured-data";
import { buildPublicSitemapEntries } from "@/lib/seo/sitemap-entries";
import { isIndexNowEnabled } from "@/lib/seo/indexnow";
import { aiAutomationSlugs } from "@/lib/public/ai-automation-routes";
import {
  getOperationsSolution,
  operationsSolutionSlugs,
} from "@/lib/public/operations-solutions-content";

describe("sanitizeSiteOrigin", () => {
  it("returns default for empty or malformed values", () => {
    expect(sanitizeSiteOrigin("")).toBe("https://smartlancedesigns.com");
    expect(sanitizeSiteOrigin("   ")).toBe("https://smartlancedesigns.com");
    expect(
      sanitizeSiteOrigin(
        "http://localhost:3000DATABASE_URL=postgresql://user:pass@host/db",
      ),
    ).toBe("http://localhost:3000");
  });

  it("normalizes bare hosts and strips trailing slashes via URL parsing", () => {
    expect(sanitizeSiteOrigin("smartlancedesigns.com")).toBe(
      "https://smartlancedesigns.com",
    );
    expect(sanitizeSiteOrigin("https://smartlancedesigns.com/")).toBe(
      "https://smartlancedesigns.com",
    );
  });
});

describe("canonical resolution", () => {
  const origin = "https://smartlancedesigns.com";

  it("uses self-referencing path by default", () => {
    expect(
      resolveCanonicalUrl({ origin, path: "/services/website-design" }),
    ).toBe("https://smartlancedesigns.com/services/website-design");
  });

  it("supports relative canonical override paths", () => {
    expect(
      resolveCanonicalUrl({
        origin,
        path: "/services/website-design",
        canonicalOverride: "/services/website-design",
      }),
    ).toBe("https://smartlancedesigns.com/services/website-design");
  });

  it("supports absolute canonical override URLs", () => {
    expect(
      resolveCanonicalUrl({
        origin,
        path: "/blog/old-slug",
        canonicalOverride: "https://smartlancedesigns.com/blog/new-slug",
      }),
    ).toBe("https://smartlancedesigns.com/blog/new-slug");
  });
});

describe("buildMetadataWithOrigin", () => {
  it("emits canonical, robots, and social tags", () => {
    const metadata = buildMetadataWithOrigin({
      origin: "https://smartlancedesigns.com",
      title: "Website Design",
      description: "Design services",
      path: "/services/website-design",
    });

    expect(metadata.alternates?.canonical).toBe(
      "https://smartlancedesigns.com/services/website-design",
    );
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.openGraph?.url).toBe(
      "https://smartlancedesigns.com/services/website-design",
    );
    expect(metadata.twitter).toBeTruthy();
  });

  it("respects noindex", () => {
    const metadata = buildMetadataWithOrigin({
      origin: "https://smartlancedesigns.com",
      title: "Draft",
      description: "Hidden",
      path: "/admin/seo",
      noIndex: true,
    });
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});

describe("structured data helpers", () => {
  it("produces valid organization JSON-LD without fake ratings", () => {
    const data = organizationJsonLd();
    expect(data["@type"]).toEqual(["Organization", "ProfessionalService"]);
    expect(data.aggregateRating).toBeUndefined();
    expect(JSON.parse(JSON.stringify(data))).toBeTruthy();
  });

  it("uses publisher organization when author is omitted", () => {
    const data = articleJsonLd({
      title: "Technical SEO Foundations",
      description: "Guide",
      path: "/blog/technical-seo-foundations",
      publishedAt: "2024-01-01",
    });
    expect(data["@type"]).toBe("BlogPosting");
    const author = data.author as Record<string, string>;
    expect(author["@type"]).toBe("Organization");
  });

  it("serializes breadcrumb and FAQ schema", () => {
    const breadcrumb = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Services", path: "/services" },
    ]);
    expect(breadcrumb["@type"]).toBe("BreadcrumbList");

    const faq = faqJsonLd([{ question: "Q?", answer: "A." }]);
    expect(faq["@type"]).toBe("FAQPage");
    expect(JSON.parse(JSON.stringify(faq))).toBeTruthy();
  });
});

describe("sitemap builder", () => {
  it(
    "returns canonical absolute URLs on configured origin",
    async () => {
      const entries = await buildPublicSitemapEntries();
      expect(entries.length).toBeGreaterThan(20);
      for (const entry of entries) {
        expect(entry.url.startsWith("http")).toBe(true);
        expect(entry.url.includes("localhost")).toBe(false);
        expect(entry.url.includes("/admin")).toBe(false);
      }
    },
    20_000,
  );

  it("includes homepage and core hubs", async () => {
    const entries = await buildPublicSitemapEntries();
    const urls = entries.map((e) => e.url);
    const origin = siteOriginFromConfig();
    expect(urls.some((u) => u === origin || u === `${origin}/`)).toBe(true);
    expect(urls.some((u) => u.endsWith("/services"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/blog"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/how-we-work"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/free-tools"))).toBe(true);
  });

  it("includes all AI hub and child routes in sitemap", async () => {
    const entries = await buildPublicSitemapEntries();
    const urls = entries.map((e) => e.url);
    const origin = siteOriginFromConfig();

    expect(urls).toContain(`${origin}/ai-automation`);
    for (const slug of aiAutomationSlugs) {
      expect(urls).toContain(`${origin}/ai-automation/${slug}`);
    }
  });

  it("includes all six operations solution routes in sitemap", async () => {
    const entries = await buildPublicSitemapEntries();
    const urls = entries.map((e) => e.url);
    const origin = siteOriginFromConfig();

    for (const slug of operationsSolutionSlugs) {
      expect(urls).toContain(`${origin}/solutions/${slug}`);
    }
  });

  it("excludes admin, portal, workspace, and legacy AI service paths", async () => {
    const entries = await buildPublicSitemapEntries();
    const urls = entries.map((e) => e.url);

    for (const url of urls) {
      expect(url).not.toMatch(/\/admin(\/|$)/);
      expect(url).not.toMatch(/\/portal(\/|$)/);
      expect(url).not.toMatch(/\/workspace(\/|$)/);
      expect(url).not.toMatch(/\/services\/ai-/);
    }
  });

  it("gives each operations solution a distinct metaTitle", () => {
    const titles = operationsSolutionSlugs.map(
      (slug) => getOperationsSolution(slug)!.metaTitle,
    );
    expect(new Set(titles).size).toBe(operationsSolutionSlugs.length);
  });
});

describe("IndexNow configuration", () => {
  it("is disabled unless explicitly enabled with key", () => {
    expect(isIndexNowEnabled()).toBe(false);
  });
});
