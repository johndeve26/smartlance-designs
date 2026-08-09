import { NextResponse } from "next/server";
import { acceptPortalToken } from "@/lib/portal/auth";
import { setPortalSessionCookie } from "@/lib/portal/session";

export const dynamic = "force-dynamic";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const result = await acceptPortalToken(token);

  if (!result.ok) {
    return NextResponse.redirect(new URL("/portal/login?error=invalid", siteUrl()));
  }

  await setPortalSessionCookie(result.token, result.expiresAt);
  return NextResponse.redirect(new URL("/portal", siteUrl()));
}
