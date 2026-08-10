import { describe, expect, it } from "vitest";
import {
  classifyEngagementRequest,
  ENGAGEMENT_DEDUPE_WINDOW_MS,
} from "@/lib/crm/outreach/engagement/classifier";
import {
  createEngagementToken,
  hashEngagementToken,
} from "@/lib/crm/outreach/engagement/tokens";
import {
  extractAnchors,
  isTrackableHttpUrl,
  plainTextToHtml,
  replaceAnchorHref,
} from "@/lib/crm/outreach/engagement/html";

describe("engagement tokens", () => {
  it("stores hash not raw token", () => {
    const token = createEngagementToken();
    const hash = hashEngagementToken(token);
    expect(hash).not.toBe(token);
    expect(hash.length).toBe(64);
  });
});

describe("engagement classifier", () => {
  it("marks HEAD as possible automated", () => {
    expect(
      classifyEngagementRequest(
        { method: "HEAD", userAgent: "Mozilla/5.0", ip: null },
        "LINK_CLICKED",
      ),
    ).toBe("POSSIBLE_AUTOMATED");
  });

  it("marks scanner UA as possible automated", () => {
    expect(
      classifyEngagementRequest(
        { method: "GET", userAgent: "Proofpoint URL Defense", ip: null },
        "LINK_CLICKED",
      ),
    ).toBe("POSSIBLE_AUTOMATED");
  });

  it("does not overclaim likely human for unknown client", () => {
    expect(
      classifyEngagementRequest(
        { method: "GET", userAgent: "Mozilla/5.0", ip: null },
        "LINK_CLICKED",
      ),
    ).toBe("UNKNOWN");
  });

  it("open detection stays conservative", () => {
    expect(
      classifyEngagementRequest(
        { method: "GET", userAgent: "Mozilla/5.0", ip: null },
        "OPEN_DETECTED",
      ),
    ).toBe("UNKNOWN");
  });
});

describe("engagement HTML", () => {
  it("rewrites trackable links only", () => {
    const html = plainTextToHtml("See https://example.com/services and mailto:a@b.com");
    expect(isTrackableHttpUrl("https://example.com/services")).toBe(true);
    expect(isTrackableHttpUrl("mailto:a@b.com")).toBe(false);
    expect(isTrackableHttpUrl("/outreach/unsubscribe?token=abc")).toBe(false);

    const anchors = extractAnchors(html);
    expect(anchors.length).toBe(1);
    const rewritten = replaceAnchorHref(html, anchors[0]!.href, "https://site/t/c/token");
    expect(rewritten).toContain("/t/c/token");
  });

  it("excludes unsubscribe paths", () => {
    expect(
      isTrackableHttpUrl("https://smartlance.com/outreach/unsubscribe?token=abc"),
    ).toBe(false);
  });
});

describe("engagement dedupe window", () => {
  it("uses 60 second window", () => {
    expect(ENGAGEMENT_DEDUPE_WINDOW_MS).toBe(60_000);
  });
});
