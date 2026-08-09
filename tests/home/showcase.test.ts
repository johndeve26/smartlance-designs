import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Project, ProjectCategory } from "@/types";
import { homepageHeroProjectSlug } from "@/data/home";
import { getHeroShowcaseProject } from "@/lib/home/showcase";

vi.mock("@/lib/content/work-source", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/content/work-source")>();
  return {
    ...actual,
    resolveWorkContentRuntime: vi.fn(),
  };
});

vi.mock("@/lib/repositories/workRepository", () => ({
  getPublishedHomepageHero: vi.fn(),
  listPublishedFeaturedWork: vi.fn(),
}));

import {
  resolveWorkContentRuntime,
  WorkDatabaseUnavailableError,
} from "@/lib/content/work-source";
import {
  getPublishedHomepageHero,
  listPublishedFeaturedWork,
} from "@/lib/repositories/workRepository";
import {
  SELECTED_WORK_LIMIT,
  getSelectedWorkProjects,
  loadHeroShowcaseProject,
  loadHomepageWorkShowcase,
  loadSelectedWorkProjects,
} from "@/lib/home/showcase";

const mockRuntime = vi.mocked(resolveWorkContentRuntime);
const mockHero = vi.mocked(getPublishedHomepageHero);
const mockFeatured = vi.mocked(listPublishedFeaturedWork);

function project(slug: string, extra: Partial<Project> = {}): Project {
  return {
    slug,
    name: slug,
    industry: "Hospitality",
    services: ["Website Design" as ProjectCategory],
    challenge: "Challenge",
    solution: "Solution",
    published: true,
    metaTitle: "Title",
    metaDescription: "Description",
    ...extra,
  };
}

describe("homepage work showcase loaders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("DB-authoritative mode", () => {
    beforeEach(() => {
      mockRuntime.mockResolvedValue("database");
    });

    it("uses published featuredHomepage project as hero", async () => {
      mockHero.mockResolvedValue(
        project("project-a", {
          featured: true,
          heroImage: "/images/a.webp",
        }),
      );
      mockFeatured.mockResolvedValue([
        project("project-c", { featured: true, displayOrder: 10 }),
        project("project-b", { featured: true, displayOrder: 20 }),
      ]);

      const result = await loadHomepageWorkShowcase();

      expect(result.heroProject?.slug).toBe("project-a");
      expect(mockHero).toHaveBeenCalledTimes(1);
    });

    it("does not leak unpublished hero onto homepage", async () => {
      mockHero.mockResolvedValue(null);
      mockFeatured.mockResolvedValue([project("project-b", { featured: true })]);

      const hero = await loadHeroShowcaseProject();
      expect(hero).toBeUndefined();
    });

    it("does not resurrect typed hero when DB has no featuredHomepage row", async () => {
      mockHero.mockResolvedValue(null);

      const hero = await loadHeroShowcaseProject();
      expect(hero).toBeUndefined();
      expect(hero?.slug).not.toBe(homepageHeroProjectSlug);
    });

    it("returns selected featured work ordered by repository, excluding hero", async () => {
      mockFeatured.mockResolvedValue([
        project("featured-c", { featured: true, displayOrder: 10 }),
        project("featured-b", { featured: true, displayOrder: 20 }),
      ]);

      const selected = await loadSelectedWorkProjects({ excludeHeroSlug: "hero-a" });

      expect(mockFeatured).toHaveBeenCalledWith("hero-a");
      expect(selected.map((p) => p.slug)).toEqual(["featured-c", "featured-b"]);
    });

    it("excludes hero and non-featured projects from selected work", async () => {
      mockHero.mockResolvedValue(project("hero-a"));
      mockFeatured.mockResolvedValue([
        project("featured-c", { featured: true, displayOrder: 10 }),
        project("featured-b", { featured: true, displayOrder: 20 }),
      ]);

      const { heroProject, selectedProjects } = await loadHomepageWorkShowcase();

      expect(heroProject?.slug).toBe("hero-a");
      expect(selectedProjects.map((p) => p.slug)).toEqual([
        "featured-c",
        "featured-b",
      ]);
      expect(selectedProjects.some((p) => p.slug === "hero-a")).toBe(false);
    });

    it("caps selected work at the homepage layout limit", async () => {
      mockHero.mockResolvedValue(project("hero-a"));
      mockFeatured.mockResolvedValue([
        project("one", { featured: true, displayOrder: 1 }),
        project("two", { featured: true, displayOrder: 2 }),
        project("three", { featured: true, displayOrder: 3 }),
        project("four", { featured: true, displayOrder: 4 }),
      ]);

      const { selectedProjects } = await loadHomepageWorkShowcase();
      expect(selectedProjects).toHaveLength(SELECTED_WORK_LIMIT);
      expect(selectedProjects.map((p) => p.slug)).toEqual(["one", "two", "three"]);
    });

    it("returns empty selected work when nothing is featured", async () => {
      mockHero.mockResolvedValue(project("hero-a"));
      mockFeatured.mockResolvedValue([]);

      const { selectedProjects } = await loadHomepageWorkShowcase();
      expect(selectedProjects).toEqual([]);
    });

    it("fails closed when the authority probe throws", async () => {
      mockRuntime.mockRejectedValue(new WorkDatabaseUnavailableError());

      const bundle = await loadHomepageWorkShowcase();
      expect(bundle.heroProject).toBeUndefined();
      expect(bundle.selectedProjects).toEqual([]);
      expect(bundle.heroProject?.slug).not.toBe(homepageHeroProjectSlug);
      expect(mockHero).not.toHaveBeenCalled();
      expect(mockFeatured).not.toHaveBeenCalled();
    });

    it("fails closed when database queries throw", async () => {
      mockHero.mockRejectedValue(new Error("connection timeout"));

      const bundle = await loadHomepageWorkShowcase();
      expect(bundle.heroProject).toBeUndefined();
      expect(bundle.selectedProjects).toEqual([]);
      expect(getHeroShowcaseProject()?.slug).toBe(homepageHeroProjectSlug);
      expect(bundle.heroProject?.slug).not.toBe(homepageHeroProjectSlug);
    });

    it("does not resurrect archived typed projects after DB query failure", async () => {
      mockHero.mockRejectedValue(new Error("database unavailable"));
      mockFeatured.mockRejectedValue(new Error("database unavailable"));

      const bundle = await loadHomepageWorkShowcase();
      expect(bundle).toEqual({
        heroProject: undefined,
        selectedProjects: [],
      });
    });
  });

  describe("static fallback mode", () => {
    beforeEach(() => {
      mockRuntime.mockResolvedValue("typed-fallback");
    });

    it("continues to use typed homepage hero fallback", async () => {
      const hero = await loadHeroShowcaseProject();
      expect(hero?.slug).toBe(homepageHeroProjectSlug);
      expect(mockHero).not.toHaveBeenCalled();
    });

    it("continues to use typed selected work fallback", async () => {
      const selected = await loadSelectedWorkProjects();
      const typed = getSelectedWorkProjects();

      expect(selected).toEqual(typed);
      expect(selected.every((p) => p.slug !== homepageHeroProjectSlug)).toBe(true);
      expect(mockFeatured).not.toHaveBeenCalled();
    });

    it("loads typed showcase bundle without database calls", async () => {
      const bundle = await loadHomepageWorkShowcase();
      expect(bundle.heroProject?.slug).toBe(getHeroShowcaseProject()?.slug);
      expect(bundle.selectedProjects).toEqual(getSelectedWorkProjects());
      expect(mockHero).not.toHaveBeenCalled();
      expect(mockFeatured).not.toHaveBeenCalled();
    });
  });
});

describe("homepage revalidation wiring", () => {
  it("revalidates homepage when work changes", async () => {
    const publishing = await import("@/lib/admin/publishing");
    const source = publishing.revalidateWork.toString();
    expect(source).toContain("revalidateHomepage");
  });
});
