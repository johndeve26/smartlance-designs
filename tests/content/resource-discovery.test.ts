import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPublishedComparisons } from "@/data/comparisons";
import { getPublishedTools } from "@/data/tools";

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

vi.mock("@/lib/repositories/resourcesRepository", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/repositories/resourcesRepository")>();
  return {
    ...actual,
    listPublishedResourceListingRows: vi.fn(),
  };
});

import { CmsDatabaseUnavailableError } from "@/lib/content/content-source";
import {
  resolveCmsContentRuntime,
  listAllPublishedResourceListingRows,
} from "@/lib/public/cache";
import { listPublishedResourceListingRows } from "@/lib/repositories/resourcesRepository";
import {
  loadPublishedComparisons,
  loadPublishedResourceCards,
  loadPublishedTools,
  loadResourceDiscoveryCounts,
} from "@/lib/content/phase3-public";
import {
  getPublicResourceHref,
  toPublicResourceCard,
  toComparisonListingContent,
} from "@/lib/resources/discovery";

const mockRuntime = vi.mocked(resolveCmsContentRuntime);
const mockListByType = vi.mocked(listPublishedResourceListingRows);
const mockListAll = vi.mocked(listAllPublishedResourceListingRows);

const comparisonRow = {
  id: "cmp-1",
  type: "comparison" as const,
  slug: "wordpress-vs-webflow",
  title: "WordPress vs Webflow",
  description: "Compare platforms",
  deck: null,
  href: "/compare/wordpress-vs-webflow",
  featured: true,
  featuredOnResources: true,
  featuredOrder: 0,
  readingTime: "12 min read",
  heroImagePath: null,
  heroImageAlt: null,
  publishedAt: new Date("2026-08-07"),
  acronym: null,
  shortDefinition: null,
  aliases: null,
  payload: {
    optionA: "WordPress",
    optionB: "Webflow",
    keyCategories: ["Content", "Design"],
  },
};

describe("resource public discovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses typed fallback only in STATIC/PRE_IMPORT runtime", async () => {
    mockRuntime.mockResolvedValue("typed-fallback");

    const comparisons = await loadPublishedComparisons();

    expect(comparisons).toEqual(getPublishedComparisons());
    expect(mockListByType).not.toHaveBeenCalled();
  });

  it("lists only published DB comparisons in DATABASE mode", async () => {
    mockRuntime.mockResolvedValue("database");
    mockListByType.mockResolvedValue([comparisonRow]);

    const comparisons = await loadPublishedComparisons();

    expect(comparisons).toHaveLength(1);
    expect(comparisons[0]?.slug).toBe("wordpress-vs-webflow");
    expect(getPublishedComparisons()).toHaveLength(1);
    expect(comparisons[0]?.slug).toBe(getPublishedComparisons()[0]?.slug);
  });

  it("does not resurrect archived or static-only resources", async () => {
    mockRuntime.mockResolvedValue("database");
    mockListByType.mockResolvedValue([]);

    const comparisons = await loadPublishedComparisons();

    expect(comparisons).toEqual([]);
    expect(getPublishedComparisons()[0]?.slug).toBe("wordpress-vs-webflow");
  });

  it("returns empty lists when DB query throws", async () => {
    mockRuntime.mockResolvedValue("database");
    mockListByType.mockRejectedValue(new Error("db down"));

    await expect(loadPublishedComparisons()).resolves.toEqual([]);
  });

  it("fails closed when authority probe throws", async () => {
    mockRuntime.mockRejectedValue(new CmsDatabaseUnavailableError());

    await expect(loadPublishedTools()).resolves.toEqual([]);
    expect(mockListByType).not.toHaveBeenCalled();
  });

  it("builds hub cards without payload body fields", async () => {
    mockRuntime.mockResolvedValue("database");
    mockListAll.mockResolvedValue([comparisonRow]);

    const cards = await loadPublishedResourceCards();

    expect(cards).toHaveLength(1);
    expect(cards[0]).toEqual(toPublicResourceCard(comparisonRow));
    expect(cards[0]).not.toHaveProperty("payload");
    expect(cards[0]).not.toHaveProperty("status");
  });

  it("derives discovery counts from DB cards", async () => {
    mockRuntime.mockResolvedValue("database");
    mockListAll.mockResolvedValue([
      comparisonRow,
      { ...comparisonRow, id: "guide-1", type: "guide", slug: "website-redesign-guide" },
    ]);

    const counts = await loadResourceDiscoveryCounts();

    expect(counts.comparison).toBe(1);
    expect(counts.guide).toBe(1);
    expect(counts.tool).toBe(0);
  });

  it("maps resource types to canonical public hrefs", () => {
    expect(getPublicResourceHref("guide", "website-redesign-guide")).toBe(
      "/guides/website-redesign-guide",
    );
    expect(getPublicResourceHref("comparison", "wordpress-vs-webflow")).toBe(
      "/compare/wordpress-vs-webflow",
    );
    expect(getPublicResourceHref("tool", "website-platform-selector")).toBe(
      "/tools/website-platform-selector",
    );
  });

  it("preserves comparison listing metadata without full payload", () => {
    const listing = toComparisonListingContent(comparisonRow);

    expect(listing.optionA).toBe("WordPress");
    expect(listing.optionB).toBe("Webflow");
    expect(listing.comparisonCriteria).toEqual([]);
    expect(listing.sections).toEqual([]);
  });

  it("typed fallback keeps static tool index working", async () => {
    mockRuntime.mockResolvedValue("typed-fallback");

    const tools = await loadPublishedTools();

    expect(tools).toEqual(getPublishedTools());
  });
});
