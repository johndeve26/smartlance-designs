import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  homepageFindUnique: vi.fn(),
  siteSettingsFindUnique: vi.fn(),
  workFindMany: vi.fn(),
  insightFindMany: vi.fn(),
  testimonialFindMany: vi.fn(),
  managedFindMany: vi.fn(),
  resourceFindMany: vi.fn(),
  serviceFindMany: vi.fn(),
  solutionFindMany: vi.fn(),
  platformFindMany: vi.fn(),
  industryFindMany: vi.fn(),
  assetReferenceFindMany: vi.fn(),
  mediaFindUnique: vi.fn(),
  mediaDelete: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  hasDatabaseUrl: vi.fn(() => true),
  prisma: {
    homepageContent: { findUnique: mocks.homepageFindUnique },
    siteSettings: { findUnique: mocks.siteSettingsFindUnique },
    workProject: { findMany: mocks.workFindMany },
    insight: { findMany: mocks.insightFindMany },
    testimonial: { findMany: mocks.testimonialFindMany },
    managedPage: { findMany: mocks.managedFindMany },
    cmsResource: { findMany: mocks.resourceFindMany },
    service: { findMany: mocks.serviceFindMany },
    solution: { findMany: mocks.solutionFindMany },
    platform: { findMany: mocks.platformFindMany },
    industry: { findMany: mocks.industryFindMany },
    assetReference: { findMany: mocks.assetReferenceFindMany },
    mediaAsset: {
      findUnique: mocks.mediaFindUnique,
      delete: mocks.mediaDelete,
    },
  },
}));

vi.mock("@/lib/repositories/auditRepository", () => ({
  writeAuditLog: vi.fn(),
}));

function emptyLists() {
  mocks.homepageFindUnique.mockResolvedValue(null);
  mocks.siteSettingsFindUnique.mockResolvedValue(null);
  mocks.insightFindMany.mockResolvedValue([]);
  mocks.testimonialFindMany.mockResolvedValue([]);
  mocks.managedFindMany.mockResolvedValue([]);
  mocks.resourceFindMany.mockResolvedValue([]);
  mocks.serviceFindMany.mockResolvedValue([]);
  mocks.solutionFindMany.mockResolvedValue([]);
  mocks.platformFindMany.mockResolvedValue([]);
  mocks.industryFindMany.mockResolvedValue([]);
  mocks.assetReferenceFindMany.mockResolvedValue([]);
}

import { findMediaUsages } from "@/lib/media/usage";
import { permanentlyDeleteMediaAsset } from "@/lib/repositories/mediaRepository";

describe("findMediaUsages delete protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    emptyLists();
  });

  it("blocks delete when Work hero image is referenced", async () => {
    mocks.workFindMany.mockResolvedValue([
      {
        id: "work-1",
        name: "Project A",
        status: "PUBLISHED",
        coverImagePath: null,
        heroImagePath: "/images/projects/a.webp",
        ogImagePath: null,
        gallery: [],
        caseStudyContent: null,
        draftJson: null,
      },
    ]);
    mocks.mediaFindUnique.mockResolvedValue({
      id: "media-a",
      publicUrl: "/images/projects/a.webp",
      sourceType: "STATIC_EXISTING",
      storageProvider: "static",
      storageKey: "static:/images/projects/a.webp",
    });

    const usages = await findMediaUsages("/images/projects/a.webp");
    expect(usages.some((u) => u.field === "heroImagePath")).toBe(true);

    await expect(
      permanentlyDeleteMediaAsset({
        id: "media-a",
        actorId: "admin-1",
      }),
    ).rejects.toThrow(/published record/i);
  });

  it("blocks delete when caseStudyContent gallery references media", async () => {
    mocks.workFindMany.mockResolvedValue([
      {
        id: "work-2",
        name: "Padeya",
        status: "PUBLISHED",
        coverImagePath: null,
        heroImagePath: null,
        ogImagePath: null,
        gallery: [],
        caseStudyContent: {
          version: 1,
          gallery: [
            {
              id: "g1",
              src: "/images/projects/padeya/hero.webp",
              alt: "Hero",
            },
          ],
        },
        draftJson: null,
      },
    ]);
    mocks.mediaFindUnique.mockResolvedValue({
      id: "media-b",
      publicUrl: "/images/projects/padeya/hero.webp",
      sourceType: "STATIC_EXISTING",
      storageProvider: "static",
      storageKey: "static:/images/projects/padeya/hero.webp",
    });

    const usages = await findMediaUsages("/images/projects/padeya/hero.webp");
    expect(
      usages.some((u) => u.field.startsWith("caseStudyContent")),
    ).toBe(true);

    await expect(
      permanentlyDeleteMediaAsset({
        id: "media-b",
        actorId: "admin-1",
      }),
    ).rejects.toThrow(/published record/i);
  });

  it("blocks delete when only a saved draft references media", async () => {
    mocks.workFindMany.mockResolvedValue([
      {
        id: "work-3",
        name: "Draft project",
        status: "PUBLISHED",
        coverImagePath: null,
        heroImagePath: null,
        ogImagePath: null,
        gallery: [],
        caseStudyContent: null,
        draftJson: {
          heroImagePath: "/images/projects/draft-only.webp",
        },
      },
    ]);
    mocks.mediaFindUnique.mockResolvedValue({
      id: "media-c",
      publicUrl: "/images/projects/draft-only.webp",
      sourceType: "STATIC_EXISTING",
      storageProvider: "static",
      storageKey: "static:/images/projects/draft-only.webp",
    });

    const usages = await findMediaUsages("/images/projects/draft-only.webp");
    expect(usages.some((u) => u.published === false)).toBe(true);

    await expect(
      permanentlyDeleteMediaAsset({
        id: "media-c",
        actorId: "admin-1",
      }),
    ).rejects.toThrow(/referenced by/i);
  });

  it("reports orphaned media with no usages", async () => {
    mocks.mediaFindUnique.mockResolvedValue({
      id: "media-d",
      publicUrl: "/images/projects/orphan.webp",
      sourceType: "STATIC_EXISTING",
      storageProvider: "static",
      storageKey: "static:/images/projects/orphan.webp",
    });

    const usages = await findMediaUsages("/images/projects/orphan.webp");
    expect(usages).toHaveLength(0);
  });
});
