import { describe, expect, it } from "vitest";
import {
  clampBulkIds,
  emptyBulkResult,
  formatBulkResultMessage,
  friendlyDeleteError,
  isBulkSuccess,
} from "@/lib/crm/bulk";
import { CRM_BULK_MAX_IDS } from "@/lib/crm/constants";

describe("CRM bulk helpers", () => {
  it("clamps and dedupes ids to CRM_BULK_MAX_IDS", () => {
    const ids = Array.from({ length: CRM_BULK_MAX_IDS + 20 }, (_, i) => `id-${i}`);
    ids.push("id-0", "id-1");
    const clamped = clampBulkIds(ids);
    expect(clamped).toHaveLength(CRM_BULK_MAX_IDS);
    expect(new Set(clamped).size).toBe(CRM_BULK_MAX_IDS);
  });

  it("formats update and delete messages", () => {
    expect(
      formatBulkResultMessage({ updated: 3, deleted: 0, failed: [] }, "contact(s)"),
    ).toBe("Updated 3 contact(s).");
    expect(
      formatBulkResultMessage({ updated: 0, deleted: 2, failed: [] }, "lead(s)"),
    ).toBe("Deleted 2 lead(s).");
  });

  it("includes failure sample in message", () => {
    const msg = formatBulkResultMessage(
      {
        updated: 1,
        deleted: 0,
        failed: [
          { id: "a", reason: "Linked to a project" },
          { id: "b", reason: "Record not found" },
        ],
      },
      "contact(s)",
    );
    expect(msg).toContain("Updated 1 contact(s)");
    expect(msg).toContain("Failed 2");
    expect(msg).toContain("Linked to a project");
  });

  it("treats empty result as unsuccessful", () => {
    expect(isBulkSuccess(emptyBulkResult())).toBe(false);
    expect(isBulkSuccess({ updated: 2, deleted: 0, failed: [] })).toBe(true);
    expect(isBulkSuccess({ updated: 1, deleted: 0, failed: [{ id: "x", reason: "nope" }] })).toBe(
      false,
    );
  });

  it("maps Prisma FK delete errors to a readable reason", () => {
    expect(friendlyDeleteError({ code: "P2003", message: "fk" })).toMatch(/Linked to a project/i);
    expect(
      friendlyDeleteError(new Error("Foreign key constraint failed on the field")),
    ).toMatch(/Linked to a project/i);
    expect(friendlyDeleteError({ code: "P2025" })).toBe("Record not found");
    expect(friendlyDeleteError(new Error("boom boom"))).toBe("boom boom");
  });

  it("returns No changes for empty bulk result", () => {
    expect(formatBulkResultMessage(emptyBulkResult(), "contact(s)")).toBe("No changes.");
  });
});
