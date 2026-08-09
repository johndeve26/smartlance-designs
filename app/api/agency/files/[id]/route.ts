import { NextResponse } from "next/server";
import { can } from "@/lib/admin/rbac";
import { getSessionUser } from "@/lib/admin/session";
import { readAgencyFile } from "@/lib/agency/files";
import { hasProjectAccess } from "@/lib/portal/access";
import { getPortalUser } from "@/lib/portal/session";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [admin, portalUser] = await Promise.all([getSessionUser(), getPortalUser()]);

  let allowed = false;
  if (admin && can(admin.role, "view_projects")) {
    allowed = true;
  } else if (portalUser) {
    const fileMeta = await import("@/lib/agency/files").then((m) => m.getAgencyFileMetadata(id));
    if (fileMeta) {
      allowed = await hasProjectAccess({
        projectId: fileMeta.projectId,
        portalUserId: portalUser.id,
        contactId: portalUser.contactId,
      });
    }
  }

  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { file, buffer } = await readAgencyFile(id);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Length": String(file.byteSize),
        "Content-Disposition": `inline; filename="${file.filename.replace(/"/g, "")}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
