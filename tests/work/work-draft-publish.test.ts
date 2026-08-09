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

vi.mock("@/lib/repositories/redirectsRepository", () => ({
  upsertSlugRedirect: vi.fn(),
}));

import {
  discardWorkDraft,
  effectiveWorkFields,
  hasWorkDraft,
  publishWork,
  publishedFieldsFromRow,
  saveWorkDraft,
  toPublicProject,
} from "@/lib/repositories/workRepository";

const publishedRow = {
  id: "work-a",
  slug: "project-a",
  name: "Project A",
  industryLabel: "Tech",
  challenge: "Published challenge",
  solution: "Published solution",
  servicesLabels: [],
  seoTitle: "SEO",
  seoDescription: "Desc",
  status: "PUBLISHED",
  featuredHomepage: false,
  featuredWorkArchive: false,
  featured: false,
  displayOrder: 1,
  approvedForAI: false,
  noIndex: false,
  caseStudyKind: "WEBSITE",
  caseStudyContent: null,
  draftJson: null,
  draftUpdatedAt: null,
  draftUpdatedById: null,
  coverImagePath: "/cover.webp",
  heroImagePath: null,
  publishedAt: new Date("2024-01-01"),
  industryLinks: [],
} as const;

describe("Work draft/publish separation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findUniqueOrThrow.mockResolvedValue({ ...publishedRow, industryLinks: [] });
    mocks.update.mockImplementation(({ data }: { data: Record<string, unknown> }) => ({
      ...publishedRow,
      ...data,
    }));
  });

  it("saveWorkDraft keeps published status and stores overlay in draftJson", async () => {
    await saveWorkDraft({
      id: "work-a",
      actorId: "admin-1",
      data: { name: "Draft name" },
    });

    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "work-a" },
        data: expect.objectContaining({
          draftJson: expect.objectContaining({ name: "Draft name" }),
          draftUpdatedAt: expect.any(Date),
        }),
      }),
    );
    expect(mocks.update.mock.calls[0][0].data).not.toHaveProperty("status");
  });

  it("effectiveWorkFields overlays draft without mutating published snapshot conceptually", () => {
    const row = {
      ...publishedRow,
      draftJson: { name: "Draft name", challenge: "Draft challenge" },
    };
    const effective = effectiveWorkFields(row as never, []);
    expect(effective.name).toBe("Draft name");
    expect(effective.challenge).toBe("Draft challenge");
    expect(publishedFieldsFromRow(row as never, []).name).toBe("Project A");
  });

  it("hasWorkDraft detects saved overlay", () => {
    expect(hasWorkDraft({ ...publishedRow, draftJson: { name: "x" } } as never)).toBe(
      true,
    );
    expect(hasWorkDraft(publishedRow as never)).toBe(false);
  });

  it("discardWorkDraft clears overlay only", async () => {
    await discardWorkDraft({ id: "work-a", actorId: "admin-1" });
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          draftJson: expect.anything(),
        }),
      }),
    );
  });

  it("publishWork promotes effective draft fields in a transaction", async () => {
    mocks.findUniqueOrThrow.mockResolvedValue({
      ...publishedRow,
      draftJson: { name: "Published name", challenge: "New challenge" },
      industryLinks: [],
    });
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
    mocks.update.mockResolvedValue({
      ...publishedRow,
      name: "Published name",
      status: "PUBLISHED",
    });

    await publishWork({ id: "work-a", actorId: "admin-1" });

    expect(mocks.transaction).toHaveBeenCalled();
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Published name",
          status: "PUBLISHED",
        }),
      }),
    );
  });

  it("toPublicProject never exposes draftJson or private facts", () => {
    const mapped = toPublicProject({
      ...publishedRow,
      draftJson: { name: "secret draft" },
      approvedProjectFacts: { objective: "secret" },
    } as never);

    expect(mapped).not.toHaveProperty("draftJson");
    expect(mapped).not.toHaveProperty("approvedProjectFacts");
    expect(mapped.name).toBe("Project A");
  });
});

describe("featuredHomepage draft safety", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findUniqueOrThrow.mockResolvedValue({ ...publishedRow, industryLinks: [] });
    mocks.update.mockResolvedValue(publishedRow);
  });

  it("does not clear featuredHomepage from other projects when saving a draft", async () => {
    await saveWorkDraft({
      id: "work-a",
      actorId: "admin-1",
      data: { featuredHomepage: true },
    });

    expect(mocks.updateMany).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
