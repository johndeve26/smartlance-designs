import { describe, expect, it } from "vitest";
import type { AdminRole } from "@prisma/client";
import {
  assertCan,
  can,
  type AdminCapability,
} from "@/lib/admin/rbac";

const ALL_CAPABILITIES: AdminCapability[] = [
  "login",
  "dashboard",
  "edit_draft",
  "publish",
  "preview",
  "manage_users",
  "slug_redirect",
  "view_audit",
  "view_audit_limited",
];

const ROLE_EXPECTED: Record<AdminRole, ReadonlySet<AdminCapability>> = {
  SUPER_ADMIN: new Set([
    "login",
    "dashboard",
    "edit_draft",
    "publish",
    "preview",
    "manage_users",
    "slug_redirect",
    "view_audit",
  ]),
  EDITOR: new Set([
    "login",
    "dashboard",
    "edit_draft",
    "publish",
    "preview",
    "slug_redirect",
    "view_audit",
  ]),
  CONTENT_MANAGER: new Set([
    "login",
    "dashboard",
    "edit_draft",
    "preview",
    "view_audit_limited",
  ]),
  REVIEWER: new Set([
    "login",
    "dashboard",
    "preview",
    "view_audit_limited",
  ]),
};

const ROLES = Object.keys(ROLE_EXPECTED) as AdminRole[];

describe("rbac can()", () => {
  for (const role of ROLES) {
    it(`matches capability matrix for ${role}`, () => {
      const expected = ROLE_EXPECTED[role];
      for (const capability of ALL_CAPABILITIES) {
        const allowed = can(role, capability);
        if (capability === "view_audit") {
          expect(allowed).toBe(
            expected.has("view_audit") || expected.has("view_audit_limited"),
          );
        } else {
          expect(allowed).toBe(expected.has(capability));
        }
      }
    });
  }
});

describe("rbac assertCan()", () => {
  it("does not throw when capability is allowed", () => {
    expect(() => assertCan("SUPER_ADMIN", "manage_users")).not.toThrow();
    expect(() => assertCan("EDITOR", "publish")).not.toThrow();
    expect(() => assertCan("CONTENT_MANAGER", "edit_draft")).not.toThrow();
    expect(() => assertCan("REVIEWER", "preview")).not.toThrow();
  });

  it("throws Forbidden when capability is missing", () => {
    expect(() => assertCan("REVIEWER", "publish")).toThrow(
      /Forbidden: missing capability "publish"/,
    );
    expect(() => assertCan("CONTENT_MANAGER", "manage_users")).toThrow(
      /Forbidden: missing capability "manage_users"/,
    );
    expect(() => assertCan("EDITOR", "manage_users")).toThrow(
      /Forbidden: missing capability "manage_users"/,
    );
  });

  it("allows AI Writer for editors and content managers, not reviewers", () => {
    expect(can("SUPER_ADMIN", "use_ai_writer")).toBe(true);
    expect(can("EDITOR", "use_ai_writer")).toBe(true);
    expect(can("CONTENT_MANAGER", "use_ai_writer")).toBe(true);
    expect(can("REVIEWER", "use_ai_writer")).toBe(false);
    expect(can("REVIEWER", "manage_ai_settings")).toBe(false);
    expect(can("CONTENT_MANAGER", "manage_ai_settings")).toBe(false);
    expect(can("EDITOR", "approve_ai_cms")).toBe(true);
  });
});
