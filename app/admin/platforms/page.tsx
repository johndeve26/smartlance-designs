import type { Metadata } from "next";
import { requireAdminUser, userCan } from "@/lib/admin/session";
import { listAllPlatformsAdmin } from "@/lib/repositories/platformsRepository";
import { ContentBulkTable } from "@/components/admin/ContentBulkTable";
import { createPlatformDraftAction } from "@/lib/admin/bulk-content-actions";

export const metadata: Metadata = {
  title: "Platforms",
};

export default async function AdminPlatformsPage() {
  const user = await requireAdminUser();
  const canPublish = userCan(user, "publish");
  const canEdit = userCan(user, "edit_draft");
  const platforms = await listAllPlatformsAdmin();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="admin-page-title">Platforms</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {platforms.length} platform{platforms.length === 1 ? "" : "s"}
          </p>
        </div>
        {canEdit ? (
          <form action={createPlatformDraftAction}>
            <button type="submit" className="admin-btn-primary">
              New platform
            </button>
          </form>
        ) : null}
      </div>

      <ContentBulkTable
        family="platform"
        canPublish={canPublish}
        emptyMessage="No platforms in the database yet."
        columns={[
          { key: "title", header: "Name", isTitle: true },
          { key: "slug", header: "Slug", mono: true },
          { key: "group", header: "Group" },
          { key: "status", header: "Status" },
          { key: "order", header: "Order" },
        ]}
        rows={platforms.map((p) => ({
          id: p.id,
          href: `/admin/platforms/${p.id}`,
          title: p.name,
          status: p.status,
          fields: {
            slug: p.slug,
            group: p.group,
            order: String(p.displayOrder),
          },
        }))}
      />
    </div>
  );
}
