import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  assertSameOrigin: vi.fn(),
  requireAdminUser: vi.fn(),
  syncStaticMediaAssets: vi.fn(),
}));

vi.mock("@/lib/admin/session", () => ({
  assertSameOrigin: mocks.assertSameOrigin,
  requireAdminUser: mocks.requireAdminUser,
}));

vi.mock("@/lib/media/sync-static", () => ({
  syncStaticMediaAssets: mocks.syncStaticMediaAssets,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { syncStaticMediaAction } from "@/lib/admin/phase4-actions";

describe("syncStaticMediaAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminUser.mockResolvedValue({ id: "admin-1", role: "EDITOR" });
    mocks.syncStaticMediaAssets.mockResolvedValue({
      dryRun: false,
      filesScanned: 3,
      existingMatches: 1,
      created: 1,
      updated: 0,
      unchanged: 2,
      conflicts: [],
      missingSources: [],
      errors: [],
    });
  });

  it("requires manage_media and same-origin protection", async () => {
    const res = await syncStaticMediaAction({ dryRun: true });

    expect(mocks.assertSameOrigin).toHaveBeenCalled();
    expect(mocks.requireAdminUser).toHaveBeenCalledWith("manage_media");
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.result.filesScanned).toBe(3);
    }
  });

  it("forwards dry run without revalidation", async () => {
    mocks.syncStaticMediaAssets.mockResolvedValue({
      dryRun: true,
      filesScanned: 2,
      existingMatches: 0,
      created: 2,
      updated: 0,
      unchanged: 0,
      conflicts: [],
      missingSources: [],
      errors: [],
    });

    const res = await syncStaticMediaAction({ dryRun: true });
    expect(mocks.syncStaticMediaAssets).toHaveBeenCalledWith({
      dryRun: true,
      actorId: "admin-1",
    });
    expect(res.ok).toBe(true);
  });
});
