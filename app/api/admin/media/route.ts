import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { listMediaAssets } from "@/lib/repositories/mediaRepository";
import { MediaAssetStatus, MediaSourceType } from "@prisma/client";

/** Unvalidated enums reach Prisma as invalid values and surface as 500s. */
const querySchema = z.object({
  q: z.string().trim().min(1).max(200).optional(),
  status: z.enum(MediaAssetStatus).default(MediaAssetStatus.ACTIVE),
  source: z.enum(MediaSourceType).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(24),
});

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user || !can(user.role, "manage_media")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    q: url.searchParams.get("q") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    source: url.searchParams.get("source") ?? undefined,
    page: url.searchParams.get("page") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }
  const { q, status, source, page, pageSize } = parsed.data;
  const result = await listMediaAssets({
    q,
    status,
    sourceType: source,
    page,
    pageSize,
  });
  return NextResponse.json({
    items: result.items.map((i) => ({
      id: i.id,
      publicUrl: i.publicUrl,
      title: i.title,
      filename: i.filename,
      altText: i.altText,
      mimeType: i.mimeType,
      width: i.width,
      height: i.height,
    })),
    total: result.total,
    page: result.page,
  });
}
