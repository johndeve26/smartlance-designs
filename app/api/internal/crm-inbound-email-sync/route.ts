import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { runInboundEmailSync } from "@/lib/email/inbound/sync";

function authorized(request: Request): boolean {
  const secret = process.env.CRM_INBOUND_SYNC_SECRET?.trim();
  if (!secret) return false;

  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return false;

  const token = auth.slice(7);
  if (token.length !== secret.length) return false;

  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(secret));
  } catch {
    return false;
  }
}

/** Internal CRM inbound email sync — invoke via cron with Authorization: Bearer $CRM_INBOUND_SYNC_SECRET */
export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await runInboundEmailSync();
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("[crm:inbound-sync:api]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
