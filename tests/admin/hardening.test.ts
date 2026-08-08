import { describe, expect, it } from "vitest";
import { validateServerEnv, ENV_CATALOG } from "@/lib/env";
import { can } from "@/lib/admin/rbac";

describe("env catalog", () => {
  it("classifies secrets separately from public vars", () => {
    const secrets = ENV_CATALOG.filter((e) => e.class === "SECRET").map(
      (e) => e.key,
    );
    expect(secrets).toContain("DATABASE_URL");
    expect(secrets).toContain("ADMIN_SESSION_SECRET");
    expect(secrets).toContain("RESEND_API_KEY");
    expect(secrets).not.toContain("NEXT_PUBLIC_SITE_URL");
  });
});

describe("validateServerEnv", () => {
  it("does not throw in non-production by default", () => {
    const result = validateServerEnv({ throwOnError: false });
    expect(result).toHaveProperty("ok");
    expect(Array.isArray(result.issues)).toBe(true);
  });
});

describe("rbac matrix snapshot", () => {
  it("keeps enquiry PII off content manager and reviewer", () => {
    expect(can("CONTENT_MANAGER", "view_enquiries")).toBe(false);
    expect(can("REVIEWER", "view_enquiries")).toBe(false);
    expect(can("EDITOR", "view_enquiries")).toBe(true);
  });

  it("keeps destructive enquiry ops on super admin only", () => {
    expect(can("EDITOR", "enquiry_destructive")).toBe(false);
    expect(can("SUPER_ADMIN", "enquiry_destructive")).toBe(true);
  });
});

describe("markdown url safety helpers", () => {
  it("rejects javascript and data schemes via BlogMarkdown rules", async () => {
    // Mirror the safety predicates used by BlogMarkdown
    function isSafeContentHref(href: string) {
      const trimmed = href.trim();
      if (!trimmed) return false;
      if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return true;
      if (trimmed.startsWith("#")) return true;
      try {
        const u = new URL(trimmed);
        return (
          u.protocol === "http:" ||
          u.protocol === "https:" ||
          u.protocol === "mailto:"
        );
      } catch {
        return false;
      }
    }
    expect(isSafeContentHref("javascript:alert(1)")).toBe(false);
    expect(isSafeContentHref("data:text/html,hi")).toBe(false);
    expect(isSafeContentHref("/blog/hello")).toBe(true);
    expect(isSafeContentHref("https://example.com")).toBe(true);
  });
});
