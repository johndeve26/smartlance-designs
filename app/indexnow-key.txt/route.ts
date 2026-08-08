import { NextResponse } from "next/server";
import { getIndexNowKey } from "@/lib/seo/indexnow";

/** Serves IndexNow verification key at a stable path. */
export async function GET() {
  const key = getIndexNowKey();
  if (!key) {
    return new NextResponse("Not configured", { status: 404 });
  }
  return new NextResponse(key, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
