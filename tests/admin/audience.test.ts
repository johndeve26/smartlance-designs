import { describe, expect, it, vi } from "vitest";
import {
  normalizeSourceUrl,
  normalizeSubscriberEmail,
  subscribeFormSchema,
} from "@/lib/audience/schema";
import {
  createSubscriberToken,
  hashSubscriberToken,
} from "@/lib/audience/tokens";
import { escapeSubscriberCsvCell } from "@/lib/audience/service";
import { can } from "@/lib/admin/rbac";
import { tryOptionalAudienceSubscribe } from "@/lib/audience/service";

describe("subscriber email normalization", () => {
  it("normalizes for case-insensitive lookup", () => {
    expect(normalizeSubscriberEmail("  Jane@Example.COM ")).toBe(
      "jane@example.com",
    );
  });
});

describe("source URL safety", () => {
  it("accepts same-site paths", () => {
    expect(normalizeSourceUrl("/blog/my-post")).toBe("/blog/my-post");
    expect(normalizeSourceUrl("guides/slug")).toBe("/guides/slug");
  });

  it("rejects dangerous schemes", () => {
    expect(normalizeSourceUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeSourceUrl("data:text/html,hi")).toBeNull();
    expect(normalizeSourceUrl("file:///etc/passwd")).toBeNull();
  });

  it("normalizes absolute same-origin paths to pathname", () => {
    expect(
      normalizeSourceUrl("https://smartlancedesigns.com/blog/post"),
    ).toBe("/blog/post");
  });
});

describe("subscribe form schema", () => {
  it("accepts optional name", () => {
    const parsed = subscribeFormSchema.safeParse({
      email: "jane@example.com",
      source: "FOOTER",
      sourceUrl: "/",
      _gotcha: "",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const parsed = subscribeFormSchema.safeParse({
      email: "not-an-email",
      source: "FOOTER",
      _gotcha: "",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("subscriber tokens", () => {
  it("stores only hashes for lookup", () => {
    const token = createSubscriberToken();
    const hash = hashSubscriberToken(token);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).not.toBe(token);
  });
});

describe("csv export safety", () => {
  it("escapes formula injection", () => {
    expect(escapeSubscriberCsvCell("=1+1")).toMatch(/^'/);
  });
});

describe("audience rbac", () => {
  it("restricts export to super admin", () => {
    expect(can("SUPER_ADMIN", "export_audience")).toBe(true);
    expect(can("EDITOR", "export_audience")).toBe(false);
    expect(can("EDITOR", "view_audience")).toBe(true);
    expect(can("CONTENT_MANAGER", "view_audience")).toBe(false);
  });
});

describe("optional enquiry opt-in", () => {
  it("does nothing when optedIn is false", async () => {
    const spy = vi.spyOn(
      await import("@/lib/audience/service"),
      "subscribeToAudience",
    );
    await tryOptionalAudienceSubscribe({
      name: "John",
      email: "john@example.com",
      source: "CONTACT",
      optedIn: false,
    });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("contact validation opt-in field", () => {
  it("defaults subscribeToUpdates to false", async () => {
    const { contactFormSchema } = await import("@/lib/validations");
    const parsed = contactFormSchema.safeParse({
      name: "John Example",
      email: "john@example.com",
      service: "SEO",
      projectDetails: "Enough detail for validation to pass here.",
      _gotcha: "",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.subscribeToUpdates).toBe(false);
    }
  });
});
