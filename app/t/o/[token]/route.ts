import { NextResponse } from "next/server";
import { hashEngagementToken } from "@/lib/crm/outreach/engagement/tokens";
import {
  parseEngagementRequest,
  recordOpenEvent,
} from "@/lib/crm/outreach/engagement/record";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

/** 1×1 transparent GIF — open detection pixel. No CRM data exposed. */
export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const raw = token?.trim();
  if (!raw) {
    return new NextResponse(TRANSPARENT_GIF, {
      status: 404,
      headers: pixelHeaders(),
    });
  }

  try {
    await recordOpenEvent({
      openTokenHash: hashEngagementToken(raw),
      ctx: parseEngagementRequest(request),
    });
  } catch (err) {
    console.error("[crm:engagement:open]", err instanceof Error ? err.message : err);
  }

  return new NextResponse(TRANSPARENT_GIF, {
    status: 200,
    headers: pixelHeaders(),
  });
}

export async function HEAD(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  return GET(request, context);
}

function pixelHeaders(): HeadersInit {
  return {
    "Content-Type": "image/gif",
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    "X-Robots-Tag": "noindex, nofollow",
  };
}
