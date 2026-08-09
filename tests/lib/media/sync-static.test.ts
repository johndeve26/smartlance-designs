import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  discover: vi.fn(),
  inventory: vi.fn(),
  writeAuditLog: vi.fn(),
  findMany: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  auditFindFirst: vi.fn(),
}));

vi.mock("@/lib/media/static-discovery", () => ({
  discoverStaticMediaAssets: mocks.discover,
}));

vi.mock("@/lib/media/inventory", () => ({
  buildMediaReferenceInventory: mocks.inventory,
}));

vi.mock("@/lib/repositories/auditRepository", () => ({
  writeAuditLog: mocks.writeAuditLog,
}));

vi.mock("@/lib/db", () => ({
  hasDatabaseUrl: vi.fn(() => true),
  prisma: {
    mediaAsset: {
      findMany: mocks.findMany,
      create: mocks.create,
      update: mocks.update,
    },
    auditLog: {
      findFirst: mocks.auditFindFirst,
    },
  },
}));

import { syncStaticMediaAssets } from "@/lib/media/sync-static";

const sampleAsset = {
  publicPath: "/images/projects/sample.webp",
  absolutePath: "/tmp/public/images/projects/sample.webp",
  extension: "webp",
  mimeType: "image/webp",
  byteSize: 1200,
  width: 800,
  height: 600,
};

describe("syncStaticMediaAssets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.discover.mockReturnValue([sampleAsset]);
    mocks.inventory.mockResolvedValue({
      generatedAt: new Date().toISOString(),
      staticFilesScanned: 1,
      mediaAssetRows: 0,
      staticMediaAssetRows: 0,
      contentReferences: [],
      orphanedMediaRows: [],
      duplicateStorageKeys: [],
      missingStaticSources: [],
      unresolvedReferences: [],
    });
    mocks.findMany.mockResolvedValue([]);
    mocks.create.mockResolvedValue({
      id: "media-1",
      byteSize: 1200,
      width: 800,
      height: 600,
      mimeType: "image/webp",
    });
  });

  it("creates a MediaAsset row for a discovered static file", async () => {
    const result = await syncStaticMediaAssets({ actorId: "admin-1" });

    expect(result.created).toBe(1);
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          storageKey: "static:/images/projects/sample.webp",
          publicUrl: "/images/projects/sample.webp",
          sourceType: "STATIC_EXISTING",
        }),
      }),
    );
    expect(mocks.writeAuditLog).toHaveBeenCalled();
  });

  it("is idempotent when the row already exists", async () => {
    mocks.findMany.mockResolvedValue([
      {
        id: "media-1",
        storageKey: "static:/images/projects/sample.webp",
        publicUrl: "/images/projects/sample.webp",
        byteSize: 1200,
        width: 800,
        height: 600,
        mimeType: "image/webp",
      },
    ]);

    const first = await syncStaticMediaAssets({ actorId: "admin-1" });
    const second = await syncStaticMediaAssets({ actorId: "admin-1" });

    expect(first.created).toBe(0);
    expect(first.unchanged).toBe(1);
    expect(second.created).toBe(0);
    expect(second.unchanged).toBe(1);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("dry run reports intended changes without DB mutations", async () => {
    const result = await syncStaticMediaAssets({ dryRun: true });

    expect(result.dryRun).toBe(true);
    expect(result.created).toBe(1);
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.writeAuditLog).not.toHaveBeenCalled();
  });

  it("updates only missing safe metadata without overwriting alt text", async () => {
    mocks.findMany.mockResolvedValue([
      {
        id: "media-1",
        storageKey: "static:/images/projects/sample.webp",
        publicUrl: "/images/projects/sample.webp",
        byteSize: 0,
        width: null,
        height: null,
        mimeType: "application/octet-stream",
      },
    ]);

    const result = await syncStaticMediaAssets({ actorId: "admin-1" });

    expect(result.updated).toBe(1);
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          byteSize: 1200,
          width: 800,
          height: 600,
          mimeType: "image/webp",
        }),
      }),
    );
    expect(mocks.update.mock.calls[0][0].data).not.toHaveProperty("altText");
  });

  it("reports missing static sources without deleting rows", async () => {
    mocks.findMany.mockResolvedValue([
      {
        id: "media-2",
        storageKey: "static:/images/projects/missing.webp",
        publicUrl: "/images/projects/missing.webp",
        byteSize: 100,
        width: null,
        height: null,
        mimeType: "image/webp",
      },
    ]);
    mocks.discover.mockReturnValue([]);

    const result = await syncStaticMediaAssets({ dryRun: true });

    expect(result.missingSources).toContain("/images/projects/missing.webp");
  });

  it("still completes sync when content inventory audit fails", async () => {
    mocks.inventory.mockRejectedValue(new Error("column missing"));

    const result = await syncStaticMediaAssets({ dryRun: true });

    expect(result.created).toBe(1);
    expect(result.errors.some((item) => item.includes("content inventory"))).toBe(
      true,
    );
  });
});
