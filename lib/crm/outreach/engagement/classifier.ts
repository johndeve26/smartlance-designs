import type { CrmEngagementClassification } from "@prisma/client";

export const ENGAGEMENT_DEDUPE_WINDOW_MS = 60_000;

const SCANNER_UA_PATTERNS = [
  /proofpoint/i,
  /mimecast/i,
  /barracuda/i,
  /fireeye/i,
  /urlscan/i,
  /safelinks/i,
  /linkprotect/i,
  /atp\.outlook/i,
  /googleimageproxy/i,
  /yahoo.*slurp/i,
  /curl\//i,
  /wget\//i,
  /python-requests/i,
  /go-http-client/i,
  /headless/i,
];

const PREFETCH_HEADERS = ["x-moz", "x-purpose", "purpose"];

export type EngagementRequestContext = {
  method: string;
  userAgent: string | null;
  ip: string | null;
  prefetchHeader?: string | null;
};

export function classifyEngagementRequest(
  ctx: EngagementRequestContext,
  eventType: "OPEN_DETECTED" | "LINK_CLICKED",
): CrmEngagementClassification {
  const ua = ctx.userAgent ?? "";
  const method = ctx.method.toUpperCase();

  if (method === "HEAD") {
    return "POSSIBLE_AUTOMATED";
  }

  if (ctx.prefetchHeader && /prefetch|preview/i.test(ctx.prefetchHeader)) {
    return "POSSIBLE_AUTOMATED";
  }

  for (const pattern of SCANNER_UA_PATTERNS) {
    if (pattern.test(ua)) {
      return "POSSIBLE_AUTOMATED";
    }
  }

  if (eventType === "OPEN_DETECTED") {
    return "UNKNOWN";
  }

  if (!ua.trim()) {
    return "UNKNOWN";
  }

  return "UNKNOWN";
}

export function buildEngagementFingerprint(input: {
  crmEmailId: string;
  type: string;
  trackedLinkId?: string | null;
  userAgentHash?: string | null;
  ipHash?: string | null;
}): string {
  return [
    input.crmEmailId,
    input.type,
    input.trackedLinkId ?? "",
    input.userAgentHash ?? "",
    input.ipHash ?? "",
  ].join("|");
}
