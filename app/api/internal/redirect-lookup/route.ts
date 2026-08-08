import { NextResponse } from "next/server";
import { findActiveRedirect } from "@/lib/repositories/redirectsRepository";

/**
 * Internal redirect lookup for Edge middleware.
 * Not a public CMS API — only accepts same-origin middleware requests.
 */
export async function GET(request: Request) {
  if (request.headers.get("x-internal-redirect") !== "1") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const path = url.searchParams.get("path");
  if (!path || !path.startsWith("/")) {
    return NextResponse.json({ destination: null });
  }

  const redirect = await findActiveRedirect(path);
  if (!redirect) {
    return NextResponse.json({ destination: null });
  }

  return NextResponse.json({
    destination: redirect.destination,
    permanent: redirect.type === "PERMANENT_301",
  });
}
