import { beforeEach, describe, expect, it, vi } from "vitest";
import { industriesCatalog } from "@/data/industries";
import {
  catalogToDetail,
  toPublicIndustryDetail,
} from "@/lib/repositories/industriesRepository";
import { resolveCanonicalUrl } from "@/lib/seo/canonical";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { buildResourcePageMetadata } from "@/lib/seo/resource-metadata";

vi.mock("@/lib/db", () => ({
  hasDatabaseUrl: vi.fn(() => false),
  prisma: {
    managedPage: { findMany: vi.fn().mockResolvedValue([]) },
    service: { findMany: vi.fn().mockResolvedValue([]) },
    solution: { findMany: vi.fn().mockResolvedValue([]) },
    platform: { findMany: vi.fn().mockResolvedValue([]) },
    industry: { findMany: vi.fn().mockResolvedValue([]) },
    insight: { findMany: vi.fn().mockResolvedValue([]) },
    cmsResource: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
    },
    workProject: { findMany: vi.fn().mockResolvedValue([]) },
    siteSettings: { findUnique: vi.fn().mockResolvedValue(null) },
  },
}));

vi.mock("@/lib/seo/canonical", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/seo/canonical")>();
  return {
    ...actual,
    getSiteOrigin: vi.fn().mockResolvedValue("https://smartlancedesigns.com"),
  };
});

import { hasDatabaseUrl, prisma } from "@/lib/db";
import { buildPublicSitemapEntries } from "@/lib/seo/sitemap-entries";

const mockHasDatabaseUrl = vi.mocked(hasDatabaseUrl);
const mockIndustryFindMany = vi.mocked(prisma.industry.findMany);

beforeEach(() => {
  mockHasDatabaseUrl.mockReturnValue(false);
  mockIndustryFindMany.mockResolvedValue([]);
});

describe("industry detail routing", () => {
  it("maps catalog industries to public detail shape", () => {
    const item = industriesCatalog.find((i) => i.slug === "short-term-rentals");
    expect(item).toBeTruthy();
    const detail = catalogToDetail(item!);
    expect(detail.slug).toBe("short-term-rentals");
    expect(detail.hasVerifiedProjectExperience).toBe(true);
    expect(detail.projectSlugs?.length).toBeGreaterThan(0);
  });

  it("keeps supported industries from implying verified work without relations", () => {
    const supported = industriesCatalog.find((i) => i.group === "supported");
    expect(supported).toBeTruthy();
    const detail = catalogToDetail(supported!);
    expect(detail.hasVerifiedProjectExperience).toBe(false);
  });

  it("uses self canonical /industries/{slug}", async () => {
    const metadata = await buildPageMetadata({
      title: "Short-Term Rentals",
      description: "Sector page",
      path: "/industries/short-term-rentals",
    });
    expect(metadata.alternates?.canonical).toBe(
      "https://smartlancedesigns.com/industries/short-term-rentals",
    );
  });

  it("respects industry noindex in metadata", async () => {
    const metadata = await buildPageMetadata({
      title: "Draft Industry",
      description: "Hidden",
      path: "/industries/draft-industry",
      noIndex: true,
    });
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("includes catalog industry URLs in sitemap when DB is unavailable", async () => {
    mockHasDatabaseUrl.mockReturnValue(false);
    const entries = await buildPublicSitemapEntries();
    const urls = entries.map((entry) => entry.url);
    expect(
      urls.some((url) => url.endsWith("/industries/short-term-rentals")),
    ).toBe(true);
    expect(mockIndustryFindMany).not.toHaveBeenCalled();
  });

  it("includes published DB industry URLs in sitemap when DB is available", async () => {
    mockHasDatabaseUrl.mockReturnValue(true);
    mockIndustryFindMany.mockResolvedValue([
      { slug: "short-term-rentals", updatedAt: new Date("2026-01-01") },
    ] as Awaited<ReturnType<typeof mockIndustryFindMany>>);
    const entries = await buildPublicSitemapEntries();
    const urls = entries.map((entry) => entry.url);
    expect(
      urls.some((url) => url.endsWith("/industries/short-term-rentals")),
    ).toBe(true);
    expect(mockIndustryFindMany).toHaveBeenCalled();
  });
});

describe("resource CMS metadata helper", () => {
  it("falls back to typed content when DB row is unavailable", async () => {
    const metadata = await buildResourcePageMetadata({
      kind: "guide",
      slug: "website-redesign-guide",
      path: "/guides/website-redesign-guide",
      fallbackTitle: "Website Redesign Guide",
      fallbackDescription: "Planning a redesign",
      article: true,
    });
    expect(metadata.title).toBeTruthy();
    expect(metadata.alternates?.canonical).toBe(
      "https://smartlancedesigns.com/guides/website-redesign-guide",
    );
  });

  it("uses subtype canonical routes", () => {
    const origin = "https://smartlancedesigns.com";
    expect(
      resolveCanonicalUrl({ origin, path: "/compare/wordpress-vs-webflow" }),
    ).toBe("https://smartlancedesigns.com/compare/wordpress-vs-webflow");
    expect(
      resolveCanonicalUrl({ origin, path: "/glossary/call-to-action" }),
    ).toBe("https://smartlancedesigns.com/glossary/call-to-action");
  });
});

describe("toPublicIndustryDetail", () => {
  it("maps DB row fields without inventing proof", () => {
    const detail = toPublicIndustryDetail({
      slug: "real-estate",
      name: "Real Estate",
      description: "Sector description",
      icon: "building",
      group: "supported",
      featured: false,
      hasVerifiedProjectExperience: false,
      relatedServiceLinks: [{ label: "Website Design", href: "/services/website-design" }],
      relatedSolutionSlugs: ["website-not-generating-leads"],
      seoTitle: null,
      seoDescription: null,
      noIndex: false,
      canonicalOverride: null,
      ogImagePath: null,
      workLinks: [],
    });
    expect(detail.hasVerifiedProjectExperience).toBe(false);
    expect(detail.projectSlugs).toBeUndefined();
    expect(detail.relatedSolutionSlugs).toEqual(["website-not-generating-leads"]);
  });
});
