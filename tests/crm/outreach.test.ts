import { describe, expect, it, vi } from "vitest";
import { segmentFilterSchema } from "@/lib/crm/segments/filter-schema";
import { segmentFilterToWhereLegacy } from "@/lib/crm/segments/query-builder";
import { renderOutreachEmail } from "@/lib/crm/outreach/personalization";
import { isEmailSuppressed } from "@/lib/crm/outreach/suppression";
import { SEQUENCE_MIN_DELAY_MINUTES } from "@/lib/crm/sequences/constants";

describe("segment filter schema", () => {
  it("accepts temperature filter v1", () => {
    const parsed = segmentFilterSchema.safeParse({
      version: 1,
      temperature: ["WARM", "HOT"],
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects unknown version", () => {
    const parsed = segmentFilterSchema.safeParse({
      version: 2,
      temperature: ["WARM"],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects raw sql-like keys", () => {
    const parsed = segmentFilterSchema.safeParse({
      version: 1,
      $where: "1=1",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("segment query builder", () => {
  it("builds temperature OR via lead relation", () => {
    const where = segmentFilterToWhereLegacy({
      version: 1,
      temperature: ["WARM", "HOT"],
    });
    expect(where.leads).toBeDefined();
  });
});

describe("personalization safety", () => {
  it("never leaves unresolved variables in output", () => {
    const result = renderOutreachEmail({
      subject: "Hi {{firstName}}",
      body: "Hello {{displayName}} from {{senderName}}",
      contact: {
        displayName: "Jane Doe",
        leads: [{ servicesInterested: ["Web Design"] }],
      },
      senderName: "Admin",
    });
    expect(result.subject).not.toMatch(/\{\{/);
    expect(result.body).not.toMatch(/\{\{/);
    expect(result.hasUnresolved).toBe(false);
  });
});

describe("suppression", () => {
  it("treats UNSUBSCRIBED as suppressed", () => {
    expect(isEmailSuppressed("UNSUBSCRIBED")).toBe(true);
    expect(isEmailSuppressed("SENDABLE")).toBe(false);
  });
});

describe("sequence timing", () => {
  it("enforces minimum delay constant", () => {
    expect(SEQUENCE_MIN_DELAY_MINUTES).toBeGreaterThanOrEqual(60);
  });
});

describe("email sent does not imply connection", () => {
  it("personalization does not mutate lead status fields", () => {
    const contact = {
      firstName: "Jane",
      leads: [{ servicesInterested: ["SEO"], status: "NEW" as const, temperature: "COLD" as const }],
    };
    renderOutreachEmail({
      subject: "Hi",
      body: "Hello",
      contact,
      senderName: "Sam",
    });
    expect(contact.leads[0]?.status).toBe("NEW");
    expect(contact.leads[0]?.temperature).toBe("COLD");
  });
});

describe("scheduler API auth", () => {
  it("rejects unauthorized POST", async () => {
    const prev = process.env.CRM_SCHEDULER_SECRET;
    process.env.CRM_SCHEDULER_SECRET = "test-scheduler-secret-value";
    vi.resetModules();
    const { POST } = await import("@/app/api/internal/crm-sequence-scheduler/route");
    const res = await POST(new Request("http://localhost/api/internal/crm-sequence-scheduler", { method: "POST" }));
    expect(res.status).toBe(403);
    process.env.CRM_SCHEDULER_SECRET = prev;
  });

  it("accepts authorized POST", async () => {
    const prev = process.env.CRM_SCHEDULER_SECRET;
    process.env.CRM_SCHEDULER_SECRET = "test-scheduler-secret-value";
    vi.resetModules();
    vi.doMock("@/lib/crm/sequences/scheduler", () => ({
      runSequenceScheduler: vi.fn().mockResolvedValue({ processed: 0, sent: 0, skipped: 0, failed: 0, completed: 0, dailyLimitReached: false, smtpUnavailable: false }),
    }));
    const { POST } = await import("@/app/api/internal/crm-sequence-scheduler/route");
    const res = await POST(
      new Request("http://localhost/api/internal/crm-sequence-scheduler", {
        method: "POST",
        headers: { Authorization: "Bearer test-scheduler-secret-value" },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    process.env.CRM_SCHEDULER_SECRET = prev;
    vi.doUnmock("@/lib/crm/sequences/scheduler");
  });
});
