import { describe, expect, it } from "vitest";
import {
  normalizeReplySubject,
  snippetFromBody,
  waitingDurationLabel,
} from "@/lib/crm/inbox/subject";
import { deriveWorkflowFromTimestamps } from "@/lib/crm/inbox/workflow";
import {
  compareMeaningfulMessages,
  meaningfulMessageAt,
} from "@/lib/crm/inbox/message-order";

describe("reply subject normalization", () => {
  it("prepends single Re: without stacking", () => {
    expect(normalizeReplySubject("Website redesign")).toBe("Re: Website redesign");
    expect(normalizeReplySubject("Re: Website redesign")).toBe("Re: Website redesign");
    expect(normalizeReplySubject("Re: Re: Website redesign")).toBe("Re: Website redesign");
  });
});

describe("snippetFromBody", () => {
  it("truncates long bodies", () => {
    const long = "word ".repeat(200);
    expect(snippetFromBody(long).length).toBeLessThanOrEqual(280);
  });
});

describe("message ordering", () => {
  it("uses receivedAt/sentAt for precedence", () => {
    const inbound = {
      direction: "INBOUND" as const,
      receivedAt: new Date("2026-08-10T12:00:00Z"),
      sentAt: null,
      createdAt: new Date("2026-08-10T11:00:00Z"),
      id: "a",
    };
    const outbound = {
      direction: "OUTBOUND" as const,
      receivedAt: null,
      sentAt: new Date("2026-08-10T10:00:00Z"),
      createdAt: new Date("2026-08-10T13:00:00Z"),
      id: "b",
    };
    expect(meaningfulMessageAt(inbound).toISOString()).toBe("2026-08-10T12:00:00.000Z");
    expect(compareMeaningfulMessages(inbound, outbound)).toBeLessThan(0);
  });
});

describe("waitingDurationLabel", () => {
  it("formats hours and days", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    expect(waitingDurationLabel(twoHoursAgo)).toBe("Waiting 2h");
  });
});

describe("deriveWorkflowFromTimestamps", () => {
  const recent = new Date();

  it("returns NEEDS_REPLY when latest inbound is after outbound", () => {
    const outbound = new Date(recent.getTime() - 60_000);
    expect(
      deriveWorkflowFromTimestamps({
        lastInboundAt: recent,
        lastOutboundAt: outbound,
      }),
    ).toBe("NEEDS_REPLY");
  });

  it("returns WAITING_ON_CONTACT when latest outbound is after inbound", () => {
    const inbound = new Date(recent.getTime() - 60_000);
    expect(
      deriveWorkflowFromTimestamps({
        lastInboundAt: inbound,
        lastOutboundAt: recent,
      }),
    ).toBe("WAITING_ON_CONTACT");
  });

  it("returns CLOSED for stale activity", () => {
    const old = new Date();
    old.setUTCDate(old.getUTCDate() - 120);
    expect(
      deriveWorkflowFromTimestamps({
        lastInboundAt: old,
        lastOutboundAt: null,
      }),
    ).toBe("CLOSED");
  });
});
