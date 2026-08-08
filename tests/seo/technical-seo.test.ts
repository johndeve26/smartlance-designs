import { describe, expect, it } from "vitest";
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
  it("returns canonical absolute URLs on configured origin", async () => {
    const entries = await buildPublicSitemapEntries();
    expect(entries.length).toBeGreaterThan(20);
    for (const entry of entries) {
      expect(entry.url.startsWith("http")).toBe(true);
      expect(entry.url.includes("localhost")).toBe(false);
      expect(entry.url.includes("/admin")).toBe(false);
    }
  });

  it("includes homepage and core hubs", async () => {
    const entries = await buildPublicSitemapEntries();
    const urls = entries.map((e) => e.url);
    const origin = siteOriginFromConfig();
    expect(urls.some((u) => u === origin || u === `${origin}/`)).toBe(true);
    expect(urls.some((u) => u.endsWith("/services"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/blog"))).toBe(true);
  });
});

describe("IndexNow configuration", () => {
  it("is disabled unless explicitly enabled with key", () => {
    expect(isIndexNowEnabled()).toBe(false);
  });
});
