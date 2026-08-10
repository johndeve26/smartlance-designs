import { describe, expect, it, vi } from "vitest";
import {
  normalizeMessageId,
  normalizeSubject,
  parseReferencesChain,
} from "@/lib/email/inbound/threading";
import { sanitizeInboundHtml } from "@/lib/email/inbound/parser";
import { matchInboundMessage } from "@/lib/crm/inbound/matching";

describe("inbound threading", () => {
  it("normalizes Message-ID", () => {
    expect(normalizeMessageId("<abc@example.com>")).toBe("abc@example.com");
  });

  it("strips Re: prefixes conservatively", () => {
    expect(normalizeSubject("Re: Fwd: Hello")).toBe("hello");
  });

  it("parses References chain", () => {
    const ids = parseReferencesChain({
      inReplyTo: "<a@x.com>",
      references: "<b@x.com> <c@x.com>",
    });
    expect(ids).toContain("a@x.com");
    expect(ids).toContain("b@x.com");
  });
});

describe("inbound HTML safety", () => {
  it("strips script tags", () => {
    const out = sanitizeInboundHtml('<p>Hi</p><script>alert(1)</script>');
    expect(out).not.toContain("script");
    expect(out).toContain("Hi");
  });

  it("blocks remote images", () => {
    const out = sanitizeInboundHtml('<img src="https://evil.com/t.png">');
    expect(out).not.toContain("evil.com");
  });
});

describe("inbound matching", () => {
  it("matches exact thread via In-Reply-To", async () => {
    const db = {
      crmEmail: {
        findFirst: async () => ({
          id: "out-1",
          contactId: "c-1",
          leadId: "l-1",
          dealId: null,
          threadId: null,
        }),
      },
      crmContact: {
        findFirst: async () => null,
        findUnique: async () => ({ ownerId: null }),
      },
      crmEmailThread: {
        create: async () => ({ id: "thread-1" }),
      },
    };

    const match = await matchInboundMessage(db as never, {
      fromAddress: "jane@example.com",
      fromName: "Jane",
      toAddresses: ["inbox@test.local"],
      ccAddresses: [],
      subject: "Re: Hello",
      bodyText: "Thanks",
      bodyHtmlSanitized: null,
      internetMessageId: "in-1@example.com",
      inReplyToMessageId: "out-msg@crm.test",
      referencesHeader: null,
      receivedAt: new Date(),
      isAutomated: false,
      attachmentMeta: [],
      bodyTruncated: false,
    }, ["inbox@test.local"]);

    expect(match.confidence).toBe("EXACT_THREAD");
    expect(match.exactThread).toBe(true);
    expect(match.contactId).toBe("c-1");
  });
});

describe("inbound sync API auth", () => {
  it("rejects unauthorized POST", async () => {
    const prev = process.env.CRM_INBOUND_SYNC_SECRET;
    process.env.CRM_INBOUND_SYNC_SECRET = "test-inbound-sync-secret";
    vi.resetModules();
    const { POST } = await import("@/app/api/internal/crm-inbound-email-sync/route");
    const res = await POST(
      new Request("http://localhost/api/internal/crm-inbound-email-sync", {
        method: "POST",
      }),
    );
    expect(res.status).toBe(403);
    process.env.CRM_INBOUND_SYNC_SECRET = prev;
  });

  it("accepts authorized POST", async () => {
    const prev = process.env.CRM_INBOUND_SYNC_SECRET;
    process.env.CRM_INBOUND_SYNC_SECRET = "test-inbound-sync-secret";
    vi.resetModules();
    vi.doMock("@/lib/email/inbound/sync", () => ({
      runInboundEmailSync: vi.fn().mockResolvedValue({ imported: 0, aborted: false }),
    }));
    const { POST } = await import("@/app/api/internal/crm-inbound-email-sync/route");
    const res = await POST(
      new Request("http://localhost/api/internal/crm-inbound-email-sync", {
        method: "POST",
        headers: { Authorization: "Bearer test-inbound-sync-secret" },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    process.env.CRM_INBOUND_SYNC_SECRET = prev;
    vi.doUnmock("@/lib/email/inbound/sync");
  });
});
