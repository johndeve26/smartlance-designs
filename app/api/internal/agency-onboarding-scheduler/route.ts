import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { runOnboardingReminderScheduler } from "@/lib/onboarding/reminders";

function authorized(request: Request): boolean {
  const secret = process.env.AGENCY_ONBOARDING_SCHEDULER_SECRET?.trim();
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

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const result = await runOnboardingReminderScheduler();
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("[onboarding:scheduler]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Scheduler failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
