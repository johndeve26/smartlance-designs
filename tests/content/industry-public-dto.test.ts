import { beforeEach, describe, expect, it, vi } from "vitest";
import { industriesCatalog } from "@/data/industries";
import {
  catalogToDetail,
  getPublishedIndustryBySlug,
  toPublicIndustryDetail,
} from "@/lib/repositories/industriesRepository";

vi.mock("@/lib/db", () => ({
  hasDatabaseUrl: vi.fn(),
  prisma: {
    industry: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/lib/public/cache", () => ({
  resolveCmsContentRuntime: vi.fn(),
  resolveWorkContentRuntime: vi.fn(),
  listPublishedIndustries: vi.fn(),
  getPublishedIndustryBySlug: vi.fn(),
  listPublishedWork: vi.fn(),
  getPublishedWorkBySlug: vi.fn(),
  listPublishedInsights: vi.fn(),
  getPublishedInsightBySlug: vi.fn(),
  getPublishedResourceBySlug: vi.fn(),
  listAllPublishedResourceListingRows: vi.fn(),
}));

import { hasDatabaseUrl, prisma } from "@/lib/db";
import { resolveCmsContentRuntime } from "@/lib/public/cache";
import { loadIndustryBySlug } from "@/lib/content/phase3-public";

const mockHasDatabaseUrl = vi.mocked(hasDatabaseUrl);
const mockFindFirst = vi.mocked(prisma.industry.findFirst);
const mockRuntime = vi.mocked(resolveCmsContentRuntime);

describe("Industry public DTO", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes typed catalog entries to IndustryPublicDetail", () => {
    const item = industriesCatalog.find((entry) => entry.slug === "hospitality")!;
    const detail = catalogToDetail(item);

    expect(detail.slug).toBe("hospitality");
    expect(detail.hasVerifiedProjectExperience).toBe(true);
    expect(detail.relatedSolutionSlugs).toEqual([]);
    expect(detail.seoTitle).toBeUndefined();
    expect(detail.seoDescription).toBeUndefined();
    expect(detail.noIndex).toBeUndefined();
    expect(detail.canonicalOverride).toBeUndefined();
    expect(detail.ogImagePath).toBeUndefined();
    expect(detail).not.toHaveProperty("displayOrder");
    expect(detail).not.toHaveProperty("status");
  });

  it("maps DB SEO fields without inventing values", () => {
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
      seoTitle: "Custom SEO title",
      seoDescription: "Custom SEO description",
      noIndex: true,
      canonicalOverride: "https://example.com/custom",
      ogImagePath: "/images/og/real-estate.webp",
      workLinks: [],
    });

    expect(detail.seoTitle).toBe("Custom SEO title");
    expect(detail.seoDescription).toBe("Custom SEO description");
    expect(detail.noIndex).toBe(true);
    expect(detail.canonicalOverride).toBe("https://example.com/custom");
    expect(detail.ogImagePath).toBe("/images/og/real-estate.webp");
    expect(detail.relatedServices).toEqual([
      { label: "Website Design", href: "/services/website-design" },
    ]);
  });

  it("filters invalid related service link JSON", () => {
    const detail = toPublicIndustryDetail({
      slug: "retail",
      name: "Retail",
      description: "Retail sector",
      icon: "store",
      group: "supported",
      featured: false,
      hasVerifiedProjectExperience: false,
      relatedServiceLinks: [
        { label: "Website Design", href: "/services/website-design" },
        { label: 123, href: true },
        null,
      ],
      workLinks: [],
    });

    expect(detail.relatedServices).toEqual([
      { label: "Website Design", href: "/services/website-design" },
    ]);
  });

  it("loadIndustryBySlug returns public detail shape in typed fallback", async () => {
    mockRuntime.mockResolvedValue("typed-fallback");

    const detail = await loadIndustryBySlug("hospitality");

    expect(detail?.slug).toBe("hospitality");
    expect(detail?.hasVerifiedProjectExperience).toBe(true);
    expect(Array.isArray(detail?.relatedSolutionSlugs)).toBe(true);
  });

  it("getPublishedIndustryBySlug does not resurrect typed catalog when DB misses slug", async () => {
    mockHasDatabaseUrl.mockReturnValue(true);
    mockFindFirst.mockResolvedValue(null);

    await expect(getPublishedIndustryBySlug("hospitality")).resolves.toBeNull();
  });
});
