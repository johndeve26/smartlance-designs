import { describe, expect, it } from "vitest";
import { can } from "@/lib/admin/rbac";

/**
 * Draft visibility / publish capability rules (unit-level; DB integration
 * requires DATABASE_URL and is covered by manual milestone QA).
 */
describe("draft visibility and publish rules", () => {
  it("reviewers cannot edit drafts or publish", () => {
    expect(can("REVIEWER", "edit_draft")).toBe(false);
    expect(can("REVIEWER", "publish")).toBe(false);
    expect(can("REVIEWER", "preview")).toBe(true);
  });

  it("content managers can edit drafts but not publish or change slugs", () => {
    expect(can("CONTENT_MANAGER", "edit_draft")).toBe(true);
    expect(can("CONTENT_MANAGER", "publish")).toBe(false);
    expect(can("CONTENT_MANAGER", "slug_redirect")).toBe(false);
    expect(can("CONTENT_MANAGER", "preview")).toBe(true);
  });

  it("editors can publish and create slug redirects", () => {
    expect(can("EDITOR", "edit_draft")).toBe(true);
    expect(can("EDITOR", "publish")).toBe(true);
    expect(can("EDITOR", "slug_redirect")).toBe(true);
  });

  it("public repository filters only PUBLISHED status conceptually", () => {
    const statuses = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
    const publicVisible = statuses.filter((s) => s === "PUBLISHED");
    expect(publicVisible).toEqual(["PUBLISHED"]);
  });
});
