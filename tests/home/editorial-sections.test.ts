import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/content/content-source", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/content/content-source")>();
  return {
    ...actual,
    resolveCmsContentRuntime: vi.fn(),
  };
});

vi.mock("@/lib/repositories/insightsRepository", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/repositories/insightsRepository")>();
  return {
    ...actual,
    listHomepageInsights: vi.fn(),
  };
});

vi.mock("@/lib/repositories/testimonialsRepository", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/repositories/testimonialsRepository")>();
  return {
    ...actual,
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
import { listHomepageInsights } from "@/lib/repositories/insightsRepository";
import { listCuratedHomepageTestimonials } from "@/lib/repositories/testimonialsRepository";
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
      expect(mockInsights).toHaveBeenCalledWith(3);
    });

    it("returns empty insights on DB query failure (fail closed)", async () => {
      mockInsights.mockRejectedValue(new Error("db down"));

      const insights = await loadHomepageInsights();

      expect(insights).toEqual([]);
    });

    it("resolves curated testimonials from DB in curation order", async () => {
      mockCuratedTestimonials.mockResolvedValue([
        {
          id: "c",
          name: "C",
          company: "Co C",
          quote: "Quote C",
          service: "SEO",
          published: true,
        },
        {
          id: "a",
          name: "A",
          company: "Co A",
          quote: "Quote A",
          service: "SEO",
          published: true,
        },
      ]);

      const items = await loadHomepageTestimonials(["c-ref", "a-ref"]);

      expect(items.map((item) => item.name)).toEqual(["C", "A"]);
      expect(mockCuratedTestimonials).toHaveBeenCalledWith(["c-ref", "a-ref"]);
    });

    it("does not use typed testimonials when curation is empty in DATABASE mode", async () => {
      mockCuratedTestimonials.mockResolvedValue([]);

      const items = await loadHomepageTestimonials([]);

      expect(items).toEqual([]);
      expect(mockCuratedTestimonials).not.toHaveBeenCalled();
    });

    it("loads insights and testimonials in parallel", async () => {
      mockInsights.mockResolvedValue([]);
      mockCuratedTestimonials.mockResolvedValue([]);

      await loadHomepageEditorialSections({
        curatedTestimonialIds: ["a"],
      });

      expect(mockInsights).toHaveBeenCalled();
      expect(mockCuratedTestimonials).toHaveBeenCalledWith(["a"]);
    });
  });

  describe("typed-fallback mode", () => {
    beforeEach(() => {
      mockRuntime.mockResolvedValue("typed-fallback");
    });

    it("uses markdown/typed insights fallback", async () => {
      const insights = await loadHomepageInsights();
      expect(insights[0]?.slug).toBe("typed-a");
      expect(mockInsights).not.toHaveBeenCalled();
    });

    it("uses typed testimonial IDs when curation empty", async () => {
      const items = await loadHomepageTestimonials([]);
      expect(items).toHaveLength(1);
      expect(items[0]?.id).toBe("typed-t1");
    });
  });

  describe("fail-closed mode", () => {
    beforeEach(() => {
      mockRuntime.mockRejectedValue(new CmsDatabaseUnavailableError());
    });

    it("returns empty insights without static resurrection", async () => {
      const insights = await loadHomepageInsights();
      expect(insights).toEqual([]);
    });

    it("returns empty testimonials without static resurrection", async () => {
      const items = await loadHomepageTestimonials(["any-id"]);
      expect(items).toEqual([]);
    });
  });
});

describe("homepage testimonial public mapping", () => {
  it("prefers displayExcerpt over quote for public output", async () => {
    const { toPublicTestimonial } = await import(
      "@/lib/repositories/testimonialsRepository"
    );
    const mapped = toPublicTestimonial({
      legacyId: "t1",
      name: "Name",
      company: "Co",
      role: null,
      serviceLabel: "SEO",
      quote: "Full approved quote text here.",
      displayExcerpt: "Full approved quote…",
      avatarPath: null,
      status: "PUBLISHED",
      verified: true,
    } as never);

    expect(mapped.quote).toBe("Full approved quote…");
    expect(mapped).not.toHaveProperty("displayExcerpt");
    expect(mapped).not.toHaveProperty("originalQuote");
  });
});

describe("homepage insight card mapping", () => {
  it("does not expose article body on homepage insight cards", async () => {
    const { toHomepageInsightCard } = await import(
      "@/lib/repositories/insightsRepository"
    );
    const card = toHomepageInsightCard({
      slug: "post-a",
      title: "Title",
      description: "Desc",
      categoryLabel: "SEO",
      bodyMarkdown: "secret draft body",
      status: "PUBLISHED",
      originalPublishedAt: new Date("2024-01-01"),
      publishedAt: new Date("2024-01-01"),
      readingTime: "1 min read",
      relatedServiceHrefs: [],
      noIndex: false,
    } as never);

    expect(card).not.toHaveProperty("content");
    expect(card.slug).toBe("post-a");
  });
});
