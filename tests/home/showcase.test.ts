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

vi.mock("@/lib/public/cache", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/public/cache")>();
  return {
    ...actual,
    getPublishedHomepageHero: vi.fn(),
    getPublishedFeaturedWork: vi.fn(),
  };
});

import {
  resolveWorkContentRuntime,
  WorkDatabaseUnavailableError,
} from "@/lib/content/work-source";
import {
  getPublishedHomepageHero,
  getPublishedFeaturedWork,
} from "@/lib/public/cache";
import {
  SELECTED_WORK_LIMIT,
  getSelectedWorkProjects,
  loadHeroShowcaseProject,
  loadHomepageWorkShowcase,
  loadSelectedWorkProjects,
} from "@/lib/home/showcase";

const mockRuntime = vi.mocked(resolveWorkContentRuntime);
const mockHero = vi.mocked(getPublishedHomepageHero);
const mockFeatured = vi.mocked(getPublishedFeaturedWork);

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
    heroImage: "/images/work/hero.jpg",
    ...extra,
  };
}

describe("homepage work showcase loaders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("DATABASE mode", () => {
    beforeEach(() => {
      mockRuntime.mockResolvedValue("database");
    });

    it("loads hero and selected work from DB", async () => {
      mockHero.mockResolvedValue(project("hero-slug"));
      mockFeatured.mockResolvedValue([
        project("a"),
        project("b"),
        project("c"),
      ]);

      const bundle = await loadHomepageWorkShowcase();
      expect(bundle.heroProject?.slug).toBe("hero-slug");
      expect(bundle.selectedProjects).toHaveLength(SELECTED_WORK_LIMIT);
    });
  });

  describe("typed-fallback mode", () => {
    beforeEach(() => {
      mockRuntime.mockResolvedValue("typed-fallback");
    });

    it("uses typed showcase bundle", async () => {
      const bundle = await loadHomepageWorkShowcase();
      expect(bundle.selectedProjects.length).toBeGreaterThan(0);
      expect(mockHero).not.toHaveBeenCalled();
    });

    it("sync typed hero helper still works", () => {
      expect(getHeroShowcaseProject()?.slug).toBeTruthy();
    });
  });

  describe("fail-closed mode", () => {
    it("returns empty showcase on authority failure", async () => {
      mockRuntime.mockRejectedValue(new WorkDatabaseUnavailableError());
      const bundle = await loadHomepageWorkShowcase();
      expect(bundle).toEqual({ heroProject: undefined, selectedProjects: [] });
    });
  });
});

describe("selected work helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRuntime.mockResolvedValue("typed-fallback");
  });

  it("typed selected work excludes homepage hero slug", () => {
    const selected = getSelectedWorkProjects();
    expect(selected.every((p) => p.slug !== homepageHeroProjectSlug)).toBe(true);
  });

  it("loadSelectedWorkProjects returns typed rows in fallback mode", async () => {
    const rows = await loadSelectedWorkProjects();
    expect(rows.length).toBeGreaterThan(0);
  });

  it("loadHeroShowcaseProject returns typed hero in fallback mode", async () => {
    const hero = await loadHeroShowcaseProject();
    expect(hero?.slug).toBeTruthy();
  });
});
