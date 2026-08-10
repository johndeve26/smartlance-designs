import { NextResponse } from "next/server";
import { hashEngagementToken } from "@/lib/crm/outreach/engagement/tokens";
import {
  parseEngagementRequest,
  recordClickEvent,
} from "@/lib/crm/outreach/engagement/record";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Tracked link redirect — destination resolved server-side only. */
export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const raw = token?.trim();
  if (!raw) {
    return safeNotFound();
  }

  let destination: string | null = null;
  try {
    const result = await recordClickEvent({
      linkTokenHash: hashEngagementToken(raw),
      ctx: parseEngagementRequest(request),
    });
    destination = result.destinationUrl;
  } catch (err) {
    console.error("[crm:engagement:click]", err instanceof Error ? err.message : err);
  }

  if (!destination) {
    return safeNotFound();
  }

  return NextResponse.redirect(destination, {
    status: 302,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export async function HEAD(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const raw = token?.trim();
  if (!raw) return safeNotFound();

  try {
    await recordClickEvent({
      linkTokenHash: hashEngagementToken(raw),
      ctx: {
        ...parseEngagementRequest(request),
        method: "HEAD",
      },
    });
  } catch {
    // ignore
  }
  return new NextResponse(null, { status: 204, headers: { "X-Robots-Tag": "noindex" } });
}

function safeNotFound() {
  return new NextResponse("Not found", {
    status: 404,
    headers: { "X-Robots-Tag": "noindex, nofollow" },
  });
}
