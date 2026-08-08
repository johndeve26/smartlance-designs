import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

/**
 * Local-development media delivery for the filesystem storage adapter.
 * Production should use object-storage public URLs instead.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ key: string[] }> },
) {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.MEDIA_ALLOW_LOCAL_IN_PRODUCTION !== "1"
  ) {
    return NextResponse.json(
      { error: "Local media serving is disabled in production." },
      { status: 404 },
    );
  }

  const { key } = await context.params;
  const joined = key.map(decodeURIComponent).join("/");
  if (joined.includes("..") || path.isAbsolute(joined)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const root = path.join(process.cwd(), "storage", "media");
  const full = path.join(root, joined);
  if (!full.startsWith(root)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    const buf = await readFile(full);
    const ext = path.extname(full).toLowerCase();
    const type =
      ext === ".png"
        ? "image/png"
        : ext === ".webp"
          ? "image/webp"
          : ext === ".gif"
            ? "image/gif"
            : ext === ".avif"
              ? "image/avif"
              : "image/jpeg";
    return new NextResponse(buf, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Disposition": "inline",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
