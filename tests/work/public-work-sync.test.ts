import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Project, ProjectCategory } from "@/types";
import { homepageHeroProjectSlug } from "@/data/home";
import { getVisibleProjects } from "@/data/portfolio";
import { getLegacyCaseStudyNarrative } from "@/lib/case-study";

vi.mock("@/lib/content/work-source", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/content/work-source")>();
  return {
    ...actual,
    resolveWorkContentRuntime: vi.fn(),
  };
});

vi.mock("@/lib/repositories/workRepository", () => ({
  listPublishedWork: vi.fn(),
  getPublishedWorkBySlug: vi.fn(),
  getAdjacentPublicWork: vi.fn(),
  listRelatedPublicWork: vi.fn(),
  sortPublicWorkProjects: (projects: Project[]) =>
    [...projects].sort((a, b) => a.name.localeCompare(b.name)),
}));

import {
  resolveWorkContentRuntime,
  WorkDatabaseUnavailableError,
} from "@/lib/content/work-source";
import {
  getPublishedWorkBySlug,
  getAdjacentPublicWork,
  listPublishedWork,
  listRelatedPublicWork,
} from "@/lib/repositories/workRepository";
import {
  loadAdjacentWork,
  loadPublishedWork,
  loadRelatedWork,
  loadWorkBySlug,
} from "@/lib/content/phase3-public";

const mockRuntime = vi.mocked(resolveWorkContentRuntime);
const mockList = vi.mocked(listPublishedWork);
const mockBySlug = vi.mocked(getPublishedWorkBySlug);
const mockAdjacent = vi.mocked(getAdjacentPublicWork);
const mockRelated = vi.mocked(listRelatedPublicWork);

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

describe("Phase 2 public Work sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("DATABASE runtime", () => {
    beforeEach(() => {
      mockRuntime.mockResolvedValue("database");
    });

    it("lists only published DB projects without typed merge", async () => {
      mockList.mockResolvedValue([
        project("project-a"),
        project("project-b"),
      ]);

      const rows = await loadPublishedWork();

      expect(rows.map((item) => item.slug)).toEqual(["project-a", "project-b"]);
      expect(rows.some((item) => item.slug === "zen-stays-rental")).toBe(false);
    });

    it("returns empty listing when zero published DB rows exist", async () => {
      mockList.mockResolvedValue([]);

      const rows = await loadPublishedWork();
      expect(rows).toEqual([]);
      expect(getVisibleProjects().length).toBeGreaterThan(0);
    });

    it("returns 404-equivalent null for archived typed-only slugs", async () => {
      mockBySlug.mockResolvedValue(null);

      const archived = await loadWorkBySlug("zen-stays-rental");
      expect(archived).toBeNull();
    });

    it("returns null for draft/missing DB slugs even when typed project exists", async () => {
      mockBySlug.mockResolvedValue(null);

      await expect(loadWorkBySlug("padeya")).resolves.toBeNull();
    });

    it("returns published DB detail without typed entity fallback", async () => {
      mockBySlug.mockResolvedValue(project("padeya", { name: "Pàdéyá" }));

      const detail = await loadWorkBySlug("padeya");
      expect(detail?.name).toBe("Pàdéyá");
    });

    it("fails closed on authority probe errors", async () => {
      mockRuntime.mockRejectedValue(new WorkDatabaseUnavailableError());

      await expect(loadPublishedWork()).resolves.toEqual([]);
      await expect(loadWorkBySlug("padeya")).resolves.toBeNull();
    });

    it("fails closed when DB listing throws", async () => {
      mockList.mockRejectedValue(new Error("connection timeout"));

      await expect(loadPublishedWork()).resolves.toEqual([]);
    });

    it("fails closed when DB detail lookup throws", async () => {
      mockBySlug.mockRejectedValue(new Error("connection timeout"));

      await expect(loadWorkBySlug("padeya")).resolves.toBeNull();
    });

    it("uses published DB catalog for adjacent navigation", async () => {
      mockList.mockResolvedValue([
        project("project-a"),
        project("project-b"),
        project("project-c"),
      ]);
      mockAdjacent.mockReturnValue({
        previous: project("project-a"),
        next: project("project-c"),
      });

      const adjacent = await loadAdjacentWork("project-b");

      expect(mockAdjacent).toHaveBeenCalledWith(
        "project-b",
        expect.arrayContaining([
          expect.objectContaining({ slug: "project-a" }),
          expect.objectContaining({ slug: "project-c" }),
        ]),
      );
      expect(adjacent.previous?.slug).toBe("project-a");
      expect(adjacent.next?.slug).toBe("project-c");
    });

    it("uses published DB catalog for related projects", async () => {
      const current = project("project-b", {
        industry: "Hospitality",
        relatedSlugs: ["project-a"],
      });
      mockList.mockResolvedValue([
        project("project-a"),
        project("project-c"),
      ]);
      mockRelated.mockReturnValue([project("project-a")]);

      const related = await loadRelatedWork(current, 2);

      expect(mockRelated).toHaveBeenCalledWith(
        current,
        expect.any(Array),
        2,
      );
      expect(related.map((item) => item.slug)).toEqual(["project-a"]);
    });
  });

  describe("typed-fallback runtime", () => {
    beforeEach(() => {
      mockRuntime.mockResolvedValue("typed-fallback");
    });

    it("preserves typed /work listing fallback", async () => {
      const rows = await loadPublishedWork();
      expect(rows).toEqual(getVisibleProjects());
      expect(mockList).not.toHaveBeenCalled();
    });

    it("preserves typed detail fallback", async () => {
      const detail = await loadWorkBySlug("padeya");
      expect(detail?.slug).toBe("padeya");
      expect(mockBySlug).not.toHaveBeenCalled();
    });
  });

  describe("legacy narrative enrichment", () => {
    it("keeps rich Pàdéyá narrative available for enrichment only", () => {
      const narrative = getLegacyCaseStudyNarrative("padeya");
      expect(narrative?.productFeatures?.length).toBeGreaterThan(0);
    });

    it("does not treat narrative presence as public entity existence", async () => {
      mockRuntime.mockResolvedValue("database");
      mockBySlug.mockResolvedValue(null);

      const detail = await loadWorkBySlug("padeya");
      expect(getLegacyCaseStudyNarrative("padeya")).toBeTruthy();
      expect(detail).toBeNull();
    });
  });

});

describe("typed fallback catalog sanity", () => {
  it("still exposes the curated homepage hero slug in pre-import mode", () => {
    expect(homepageHeroProjectSlug).toBe("freelance-os");
    expect(getVisibleProjects().some((item) => item.slug === "padeya")).toBe(
      true,
    );
  });
});
