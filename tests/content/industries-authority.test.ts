import { beforeEach, describe, expect, it, vi } from "vitest";
import { industriesCatalog } from "@/data/industries";

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

import { CmsDatabaseUnavailableError } from "@/lib/content/content-source";
import {
  resolveCmsContentRuntime,
  getPublishedIndustryBySlug,
  listPublishedIndustries,
} from "@/lib/public/cache";
import {
  loadIndustryBySlug,
  loadPublishedIndustries,
} from "@/lib/content/phase3-public";

const mockRuntime = vi.mocked(resolveCmsContentRuntime);
const mockList = vi.mocked(listPublishedIndustries);
const mockBySlug = vi.mocked(getPublishedIndustryBySlug);

describe("homepage industries authority", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses typed fallback only in STATIC/PRE_IMPORT runtime", async () => {
    mockRuntime.mockResolvedValue("typed-fallback");

    const industries = await loadPublishedIndustries();

    expect(industries).toEqual(industriesCatalog);
    expect(mockList).not.toHaveBeenCalled();
  });

  it("returns empty list when DB is authoritative but has zero published industries", async () => {
    mockRuntime.mockResolvedValue("database");
    mockList.mockResolvedValue([]);

    const industries = await loadPublishedIndustries();

    expect(industries).toEqual([]);
  });

  it("does not resurrect archived industries from typed catalog", async () => {
    mockRuntime.mockResolvedValue("database");
    mockList.mockResolvedValue([
      {
        slug: "real-estate",
        name: "Real Estate",
        description: "Published only",
        icon: "building",
        group: "proven",
      },
    ]);
    mockBySlug.mockResolvedValue(null);

    const industries = await loadPublishedIndustries();
    const hospitality = industries.find((item) => item.slug === "hospitality");

    expect(hospitality).toBeUndefined();
    expect(await loadIndustryBySlug("hospitality")).toBeNull();
  });

  it("fails closed when DB query throws", async () => {
    mockRuntime.mockResolvedValue("database");
    mockList.mockRejectedValue(new Error("db down"));

    await expect(loadPublishedIndustries()).resolves.toEqual([]);
  });

  it("fails closed when authority probe throws", async () => {
    mockRuntime.mockRejectedValue(new CmsDatabaseUnavailableError());

    await expect(loadPublishedIndustries()).resolves.toEqual([]);
    expect(mockList).not.toHaveBeenCalled();
  });
});
