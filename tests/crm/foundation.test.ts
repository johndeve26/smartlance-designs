import { describe, expect, it } from "vitest";
import {
  normalizeCrmEmail,
  normalizeCompanyDomain,
  normalizePhone,
  parsePersonName,
  contactDisplayName,
} from "@/lib/crm/normalize";
import {
  BLOCKED_EMAIL_STATUSES,
  DEAL_STAGE_DEFAULT_PROBABILITY,
  INACTIVE_LEAD_STATUSES,
} from "@/lib/crm/constants";
import { assertContactEmailSendable } from "@/lib/crm/email";
import { renderOutreachEmail } from "@/lib/crm/outreach/personalization";
import { escapeCrmCsvCell } from "@/lib/crm/contacts";
import { can } from "@/lib/admin/rbac";
import { createContactSchema } from "@/lib/crm/schema";

describe("CRM email normalization", () => {
  it("lowercases without altering local part structure", () => {
    expect(normalizeCrmEmail("  Jane@Example.COM ")).toBe("jane@example.com");
  });

  it("returns null for invalid email", () => {
    expect(normalizeCrmEmail("not-email")).toBeNull();
  });
});

describe("company domain normalization", () => {
  it("extracts domain from URL", () => {
    expect(normalizeCompanyDomain("https://www.acme.com/about")).toBe("acme.com");
  });
});

describe("phone normalization", () => {
  it("preserves leading plus", () => {
    expect(normalizePhone("+44 20 7946 0958")).toBe("+442079460958");
  });
});

describe("person name parsing", () => {
  it("treats single token as display name with firstName set", () => {
    const parsed = parsePersonName("Acme Corp");
    expect(parsed.displayName).toBe("Acme Corp");
    expect(parsed.firstName).toBe("Acme");
    expect(parsed.lastName).toBe("Corp");
  });

  it("splits first and last name", () => {
    const parsed = parsePersonName("Jane Doe");
    expect(parsed.firstName).toBe("Jane");
    expect(parsed.lastName).toBe("Doe");
  });
});

describe("contact display name", () => {
  it("falls back to email", () => {
    expect(contactDisplayName({ email: "j@example.com" })).toBe("j@example.com");
  });
});

describe("email template rendering", () => {
  it("replaces safe variables only", () => {
    const out = renderOutreachEmail({
      subject: "Hi {{firstName}}",
      body: "Hi {{firstName}} at {{companyName}}",
      contact: {
        firstName: "Jane",
        company: { name: "Acme" },
        leads: [],
      },
      senderName: "Sam",
    });
    expect(out.body).toBe("Hi Jane at Acme");
    expect(out.hasUnresolved).toBe(false);
  });

  it("uses fallbacks for missing variables", () => {
    const out = renderOutreachEmail({
      subject: "Hello",
      body: "Hi {{firstName}}",
      contact: { leads: [] },
      senderName: "Sam",
    });
    expect(out.body).toContain("there");
  });
});

describe("email send eligibility", () => {
  it("blocks DO_NOT_EMAIL", () => {
    expect(() =>
      assertContactEmailSendable({ email: "a@b.com", emailStatus: "DO_NOT_EMAIL" }),
    ).toThrow(/blocked/i);
  });

  it("allows SENDABLE", () => {
    expect(() =>
      assertContactEmailSendable({ email: "a@b.com", emailStatus: "SENDABLE" }),
    ).not.toThrow();
  });
});

describe("blocked email statuses", () => {
  it("includes marketing suppression states", () => {
    expect(BLOCKED_EMAIL_STATUSES).toContain("UNSUBSCRIBED");
    expect(BLOCKED_EMAIL_STATUSES).not.toContain("SENDABLE");
  });
});

describe("deal stage defaults", () => {
  it("uses operational probability defaults", () => {
    expect(DEAL_STAGE_DEFAULT_PROBABILITY.PROPOSAL).toBe(60);
    expect(DEAL_STAGE_DEFAULT_PROBABILITY.WON).toBe(100);
    expect(DEAL_STAGE_DEFAULT_PROBABILITY.LOST).toBe(0);
  });
});

describe("lead inactive statuses", () => {
  it("allows new lead when previous is closed", () => {
    expect(INACTIVE_LEAD_STATUSES).toContain("CLOSED");
    expect(INACTIVE_LEAD_STATUSES).toContain("UNQUALIFIED");
  });
});

describe("csv export safety", () => {
  it("escapes formula injection", () => {
    expect(escapeCrmCsvCell("=1+1")).toMatch(/^'/);
  });
});

describe("contact schema", () => {
  it("requires at least one identifier", () => {
    const parsed = createContactSchema.safeParse({});
    expect(parsed.success).toBe(false);
  });

  it("accepts email-only contact", () => {
    const parsed = createContactSchema.safeParse({ email: "jane@example.com" });
    expect(parsed.success).toBe(true);
  });
});

describe("CRM rbac", () => {
  it("restricts export to super admin", () => {
    expect(can("SUPER_ADMIN", "export_crm")).toBe(true);
    expect(can("EDITOR", "export_crm")).toBe(false);
    expect(can("EDITOR", "view_crm")).toBe(true);
    expect(can("EDITOR", "manage_crm")).toBe(true);
    expect(can("EDITOR", "send_crm_email")).toBe(true);
    expect(can("CONTENT_MANAGER", "view_crm")).toBe(false);
  });
});
