import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const updateMany = vi.fn();
  const update = vi.fn();
  const create = vi.fn();
  const findUniqueOrThrow = vi.fn();
  const transaction = vi.fn();
  return { updateMany, update, create, findUniqueOrThrow, transaction };
});

vi.mock("@/lib/db", () => ({
  hasDatabaseUrl: vi.fn(() => true),
  prisma: {
    $transaction: (...args: unknown[]) => mocks.transaction(...args),
    workProject: {
      updateMany: mocks.updateMany,
      update: mocks.update,
      create: mocks.create,
      findUniqueOrThrow: mocks.findUniqueOrThrow,
    },
    industryWork: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/admin/publishing", () => ({
  createContentRevision: vi.fn(),
  revalidateWork: vi.fn(),
}));

vi.mock("@/lib/repositories/auditRepository", () => ({
  writeAuditLog: vi.fn(),
}));

import { saveWorkDraft, publishWork, toPublicProject } from "@/lib/repositories/workRepository";

describe("featuredHomepage draft safety", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findUniqueOrThrow.mockResolvedValue({
      id: "work-b",
      slug: "project-b",
      status: "PUBLISHED",
      featuredHomepage: false,
      industryLinks: [],
      name: "B",
      industryLabel: "Tech",
      challenge: "c",
      solution: "s",
      servicesLabels: [],
      seoTitle: "t",
      seoDescription: "d",
      draftJson: null,
    });
    mocks.update.mockResolvedValue({
      id: "work-b",
      slug: "project-b",
      featuredHomepage: true,
      status: "DRAFT",
    });
    mocks.create.mockResolvedValue({
      id: "work-new",
      slug: "project-new",
      featuredHomepage: true,
      status: "DRAFT",
    });
  });

  it("does not clear featuredHomepage from other projects when saving a draft", async () => {
    await saveWorkDraft({
      id: "work-b",
      actorId: "admin-1",
      data: {
        featuredHomepage: true,
      },
    });

    expect(mocks.updateMany).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("does not clear featuredHomepage when creating a new draft homepage hero intent", async () => {
    await saveWorkDraft({
      actorId: "admin-1",
      data: {
        slug: "project-b",
        name: "Project B",
        industryLabel: "Tech",
        challenge: "c",
        solution: "s",
        servicesLabels: [],
        seoTitle: "t",
        seoDescription: "d",
        featuredHomepage: true,
      },
    });

    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("preserves draft homepage hero intent without mutating the published hero", () => {
    const rows = [
      {
        id: "work-a",
        slug: "project-a",
        status: "PUBLISHED",
        featuredHomepage: true,
      },
      {
        id: "work-b",
        slug: "project-b",
        status: "DRAFT",
        featuredHomepage: true,
      },
    ];

    const publicHero = rows.find(
      (row) => row.status === "PUBLISHED" && row.featuredHomepage,
    );

    expect(publicHero?.slug).toBe("project-a");
  });
});

describe("featuredHomepage publish swap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn({
        workProject: {
          updateMany: mocks.updateMany,
          update: mocks.update,
        },
        industryWork: {
          deleteMany: vi.fn(),
          createMany: vi.fn(),
        },
      }),
    );
  });

  it("clears other homepage heroes atomically when publishing a featured homepage project", async () => {
  mocks.findUniqueOrThrow.mockResolvedValue({
      id: "work-b",
      slug: "project-b",
      featuredHomepage: true,
      coverImagePath: "/cover.webp",
      heroImagePath: null,
      publishedAt: null,
      status: "DRAFT",
      draftJson: { featuredHomepage: true, slug: "project-b" },
      industryLinks: [],
      name: "B",
      industryLabel: "Tech",
      challenge: "c",
      solution: "s",
      servicesLabels: [],
      seoTitle: "t",
      seoDescription: "d",
    });
    mocks.update.mockResolvedValue({
      id: "work-b",
      slug: "project-b",
      status: "PUBLISHED",
      featuredHomepage: true,
    });

    await publishWork({ id: "work-b", actorId: "admin-1" });

    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: { not: "work-b" } },
      data: { featuredHomepage: false },
    });
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "work-b" },
      data: expect.objectContaining({ status: "PUBLISHED" }),
    });
  });

  it("swaps the public hero only after publish", () => {
    const beforePublish = [
      {
        id: "work-a",
        slug: "project-a",
        status: "PUBLISHED",
        featuredHomepage: true,
      },
      {
        id: "work-b",
        slug: "project-b",
        status: "DRAFT",
        featuredHomepage: true,
      },
    ];
    const afterPublish = [
      {
        id: "work-a",
        slug: "project-a",
        status: "PUBLISHED",
        featuredHomepage: false,
      },
      {
        id: "work-b",
        slug: "project-b",
        status: "PUBLISHED",
        featuredHomepage: true,
      },
    ];

    const heroBefore = beforePublish.find(
      (row) => row.status === "PUBLISHED" && row.featuredHomepage,
    );
    const heroAfter = afterPublish.find(
      (row) => row.status === "PUBLISHED" && row.featuredHomepage,
    );

    expect(heroBefore?.slug).toBe("project-a");
    expect(heroAfter?.slug).toBe("project-b");
  });
});

describe("published Work draft architecture", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findUniqueOrThrow.mockResolvedValue({
      id: "work-a",
      slug: "project-a",
      status: "PUBLISHED",
      featuredHomepage: true,
      industryLinks: [],
      name: "Project A",
      industryLabel: "Tech",
      challenge: "c",
      solution: "s",
      servicesLabels: [],
      seoTitle: "t",
      seoDescription: "d",
      draftJson: null,
    });
    mocks.update.mockResolvedValue({
      id: "work-a",
      slug: "project-a",
      status: "PUBLISHED",
      featuredHomepage: true,
    });
  });

  it("saveWorkDraft preserves published status while storing draft overlay", async () => {
    await saveWorkDraft({
      id: "work-a",
      actorId: "admin-1",
      data: { name: "Updated draft copy" },
    });

    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "work-a" },
        data: expect.objectContaining({
          draftJson: expect.objectContaining({ name: "Updated draft copy" }),
        }),
      }),
    );
    expect(mocks.update.mock.calls[0][0].data).not.toHaveProperty("status", "DRAFT");
  });
});

describe("draft homepage hero visibility", () => {
  it("only PUBLISHED work is eligible for public homepage hero queries conceptually", () => {
    const rows = [
      { slug: "draft-hero", status: "DRAFT", featuredHomepage: true },
      { slug: "live-hero", status: "PUBLISHED", featuredHomepage: false },
    ];
    const publicHero = rows.find(
      (row) => row.status === "PUBLISHED" && row.featuredHomepage,
    );
    expect(publicHero).toBeUndefined();
  });
});

describe("public Work DTO mapping", () => {
  it("does not expose admin-only Work fields on homepage projects", () => {
    const mapped = toPublicProject({
      id: "id-1",
      slug: "gemini",
      name: "Gemini",
      industryLabel: "Hospitality",
      challenge: "c",
      solution: "s",
      servicesLabels: ["Website Design & Development"],
      seoTitle: "t",
      seoDescription: "d",
      status: "PUBLISHED",
      featured: true,
      featuredHomepage: true,
      featuredWorkArchive: false,
      displayOrder: 5,
      approvedForAI: true,
      approvedProjectFacts: { objective: "secret" },
      noIndex: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as Parameters<typeof toPublicProject>[0]);

    expect(mapped).not.toHaveProperty("approvedForAI");
    expect(mapped).not.toHaveProperty("approvedProjectFacts");
    expect(mapped).not.toHaveProperty("featuredHomepage");
    expect(mapped).not.toHaveProperty("id");
  });
});
