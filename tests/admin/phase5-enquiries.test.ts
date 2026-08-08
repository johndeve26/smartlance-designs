import { describe, expect, it } from "vitest";
import {
  contactFormSchema,
  websiteReviewSchema,
  normalizeWebsiteUrl,
} from "@/lib/validations";
import { escapeCsvCell, hashIpForRateLimit } from "@/lib/enquiries/service";
import { can } from "@/lib/admin/rbac";

describe("contact form validation", () => {
  it("accepts a valid contact payload", () => {
    const parsed = contactFormSchema.safeParse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      company: "Analytical Engines",
      website: "example.com",
      service: "Website Redesign",
      projectDetails: "We need a clearer homepage and stronger lead capture.",
      budget: "",
      timeline: "",
      referralSource: "",
      _gotcha: "",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.website).toBe("https://example.com");
    }
  });

  it("rejects javascript website URLs", () => {
    const parsed = contactFormSchema.safeParse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      service: "SEO",
      projectDetails: "Enough detail for the project description field.",
      website: "javascript:alert(1)",
      _gotcha: "",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects oversized project details", () => {
    const parsed = contactFormSchema.safeParse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      service: "SEO",
      projectDetails: "x".repeat(8001),
      _gotcha: "",
    });
    expect(parsed.success).toBe(false);
  });

  it("allows honeypot values through so the API can fake success", () => {
    const parsed = contactFormSchema.safeParse({
      name: "Bot",
      email: "bot@example.com",
      service: "SEO",
      projectDetails: "Enough detail for the project description field.",
      _gotcha: "filled-by-bot",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data._gotcha).toBe("filled-by-bot");
  });

  it("treats script-like message text as plain strings", () => {
    const xss = '<script>alert("x")</script> Need a redesign please.';
    const parsed = contactFormSchema.safeParse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      service: "Website Redesign",
      projectDetails: xss,
      _gotcha: "",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.projectDetails).toBe(xss);
  });
});

describe("website review validation", () => {
  it("accepts a valid review payload", () => {
    const parsed = websiteReviewSchema.safeParse({
      name: "Ada",
      email: "ada@example.com",
      website: "https://example.com",
      mainConcern: "More Leads",
      _gotcha: "",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects data: website schemes", () => {
    const parsed = websiteReviewSchema.safeParse({
      name: "Ada",
      email: "ada@example.com",
      website: "data:text/html,hi",
      mainConcern: "Not Sure",
      _gotcha: "",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects file: website schemes", () => {
    const parsed = websiteReviewSchema.safeParse({
      name: "Ada",
      email: "ada@example.com",
      website: "file:///etc/passwd",
      mainConcern: "Not Sure",
      _gotcha: "",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("normalizeWebsiteUrl", () => {
  it("prefixes bare domains", () => {
    expect(normalizeWebsiteUrl("smartlancedesigns.com")).toBe(
      "https://smartlancedesigns.com",
    );
  });
});

describe("csv formula protection", () => {
  it("prefixes dangerous leading characters", () => {
    expect(escapeCsvCell('=HYPERLINK("http://x")')).toContain("'=");
    expect(escapeCsvCell("+cmd")).toMatch(/^'/);
    expect(escapeCsvCell("-1+1")).toMatch(/^'/);
    expect(escapeCsvCell("@sum")).toMatch(/^'/);
  });

  it("quotes commas and newlines", () => {
    expect(escapeCsvCell("a,b")).toBe('"a,b"');
    expect(escapeCsvCell("a\nb")).toBe('"a\nb"');
  });
});

describe("enquiry rbac", () => {
  it("restricts PII roles correctly", () => {
    expect(can("SUPER_ADMIN", "view_enquiries")).toBe(true);
    expect(can("EDITOR", "view_enquiries")).toBe(true);
    expect(can("CONTENT_MANAGER", "view_enquiries")).toBe(false);
    expect(can("REVIEWER", "view_enquiries")).toBe(false);
    expect(can("EDITOR", "export_enquiries")).toBe(false);
    expect(can("SUPER_ADMIN", "export_enquiries")).toBe(true);
    expect(can("SUPER_ADMIN", "enquiry_destructive")).toBe(true);
    expect(can("EDITOR", "enquiry_destructive")).toBe(false);
  });
});

describe("rate-limit hash", () => {
  it("hashes IPs without storing raw values on enquiry records", () => {
    const a = hashIpForRateLimit("203.0.113.10");
    const b = hashIpForRateLimit("203.0.113.10");
    expect(a).toBe(b);
    expect(a).not.toContain("203.0.113");
    expect(a.length).toBeGreaterThan(8);
  });
});
