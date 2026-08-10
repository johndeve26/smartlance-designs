import { NextResponse } from "next/server";
import { can } from "@/lib/admin/rbac";
import { getSessionUser } from "@/lib/admin/session";
import { buildContentDisposition, resolveAgencyFileDownload } from "@/lib/agency/files";
import { getPortalUser } from "@/lib/portal/session";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [admin, portalUser] = await Promise.all([getSessionUser(), getPortalUser()]);

  const resolved = await resolveAgencyFileDownload({
    fileId: id,
    adminRole: admin?.role ?? null,
    portalUserId: portalUser?.id ?? null,
  });

  if (!resolved.ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (resolved.kind === "redirect") {
    return NextResponse.redirect(resolved.url, { status: 302 });
  }

  const disposition = buildContentDisposition(resolved.filename, resolved.mimeType);
  return new NextResponse(new Uint8Array(resolved.buffer), {
    headers: {
      "Content-Type": resolved.mimeType,
      "Content-Length": String(resolved.byteSize),
      "Content-Disposition": disposition,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
