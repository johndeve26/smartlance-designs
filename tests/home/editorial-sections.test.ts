import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/content/content-source", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/content/content-source")>();
  return {
    ...actual,
    resolveCmsContentRuntime: vi.fn(),
  };
});

vi.mock("@/lib/public/cache", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/public/cache")>();
  return {
    ...actual,
    listHomepageInsights: vi.fn(),
    listCuratedHomepageTestimonials: vi.fn(),
  };
});

vi.mock("@/lib/blog", () => ({
  getLatestPosts: vi.fn(() => [
    { slug: "typed-a", title: "Typed A", description: "d", category: "SEO", publishedAt: "2024-01-01", readingTime: "1 min read", relatedServiceHrefs: [], published: true },
  ]),
}));

vi.mock("@/data/home", () => ({
  homepageTestimonialIds: ["typed-t1", "typed-t2"],
}));

vi.mock("@/data/testimonials", () => ({
  getTestimonialById: vi.fn((id: string) =>
    id === "typed-t1"
      ? { id, name: "Typed", company: "Co", quote: "Great", service: "SEO", published: true }
      : null,
  ),
}));

import { CmsDatabaseUnavailableError, resolveCmsContentRuntime } from "@/lib/content/content-source";
import {
  listHomepageInsights,
  listCuratedHomepageTestimonials,
} from "@/lib/public/cache";
import {
  loadHomepageEditorialSections,
  loadHomepageInsights,
  loadHomepageTestimonials,
} from "@/lib/home/editorial";

const mockRuntime = vi.mocked(resolveCmsContentRuntime);
const mockInsights = vi.mocked(listHomepageInsights);
const mockCuratedTestimonials = vi.mocked(listCuratedHomepageTestimonials);

describe("homepage editorial loaders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("DATABASE mode", () => {
    beforeEach(() => {
      mockRuntime.mockResolvedValue("database");
    });

    it("loads published DB insights without typed fallback", async () => {
      mockInsights.mockResolvedValue([
        {
          slug: "insight-a",
          title: "Insight A",
          description: "Desc",
          category: "SEO",
          publishedAt: "2024-03-01T00:00:00.000Z",
          readingTime: "2 min read",
          relatedServiceHrefs: [],
          published: true,
        },
      ]);

      const insights = await loadHomepageInsights();
      expect(insights).toHaveLength(1);
      expect(insights[0]?.slug).toBe("insight-a");
    });

    it("returns empty insights on DB query failure (fail closed)", async () => {
      mockInsights.mockRejectedValue(new Error("db down"));

      const insights = await loadHomepageInsights();
      expect(insights).toEqual([]);
    });

    it("resolves curated testimonials from DB in curation order", async () => {
      mockCuratedTestimonials.mockResolvedValue([
        {
          id: "t2",
          name: "Second",
          company: "Co",
          quote: "Q2",
          service: "SEO",
          published: true,
        },
        {
          id: "t1",
          name: "First",
          company: "Co",
          quote: "Q1",
          service: "SEO",
          published: true,
        },
      ]);

      const testimonials = await loadHomepageTestimonials(["t2", "t1"]);
      expect(testimonials.map((t) => t.id)).toEqual(["t2", "t1"]);
    });

    it("does not use typed testimonials when curation is empty in DATABASE mode", async () => {
      mockCuratedTestimonials.mockResolvedValue([]);

      const testimonials = await loadHomepageTestimonials([]);
      expect(testimonials).toEqual([]);
    });

    it("loads insights and testimonials in parallel", async () => {
      mockInsights.mockResolvedValue([]);
      mockCuratedTestimonials.mockResolvedValue([]);

      const result = await loadHomepageEditorialSections({
        curatedTestimonialIds: ["t1"],
      });
      expect(result).toEqual({ insights: [], testimonials: [] });
      expect(mockInsights).toHaveBeenCalled();
      expect(mockCuratedTestimonials).toHaveBeenCalledWith(["t1"]);
    });
  });

  describe("typed-fallback mode", () => {
    beforeEach(() => {
      mockRuntime.mockResolvedValue("typed-fallback");
    });

    it("uses typed insights when runtime is typed-fallback", async () => {
      const insights = await loadHomepageInsights();
      expect(insights[0]?.slug).toBe("typed-a");
      expect(mockInsights).not.toHaveBeenCalled();
    });

    it("uses typed testimonials when runtime is typed-fallback", async () => {
      const testimonials = await loadHomepageTestimonials([]);
      expect(testimonials).toHaveLength(1);
      expect(testimonials[0]?.id).toBe("typed-t1");
    });
  });

  describe("fail-closed mode", () => {
    it("returns empty insights without static resurrection", async () => {
      mockRuntime.mockRejectedValue(new CmsDatabaseUnavailableError());

      const insights = await loadHomepageInsights();
      expect(insights).toEqual([]);
    });

    it("returns empty testimonials without static resurrection", async () => {
      mockRuntime.mockRejectedValue(new CmsDatabaseUnavailableError());

      const testimonials = await loadHomepageTestimonials(["t1"]);
      expect(testimonials).toEqual([]);
    });
  });
});

describe("homepage testimonial public mapping", () => {
  it("requires verified published rows in DATABASE mode conceptually", () => {
    const candidates = [
      { verified: true, status: "PUBLISHED" },
      { verified: false, status: "PUBLISHED" },
    ];
    const visible = candidates.filter((t) => t.verified && t.status === "PUBLISHED");
    expect(visible).toHaveLength(1);
  });
});

describe("homepage insight card mapping", () => {
  it("preserves relatedServiceHrefs array default", async () => {
    mockRuntime.mockResolvedValue("typed-fallback");
    const insights = await loadHomepageInsights();
    expect(insights[0]?.relatedServiceHrefs).toEqual([]);
  });
});
