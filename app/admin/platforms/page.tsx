import type { Metadata } from "next";
import { requireAdminUser, userCan } from "@/lib/admin/session";
import { listAllPlatformsAdmin } from "@/lib/repositories/platformsRepository";
import { ContentBulkTable } from "@/components/admin/ContentBulkTable";
import { createPlatformDraftAction } from "@/lib/admin/bulk-content-actions";
import { AdminListPage } from "@/components/admin/patterns/AdminListPage";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Platforms",
};

export default async function AdminPlatformsPage() {
  const user = await requireAdminUser();
  const canPublish = userCan(user, "publish");
  const canEdit = userCan(user, "edit_draft");
  const platforms = await listAllPlatformsAdmin();

  return (
    <AdminListPage
      title="Platforms"
      description={`${platforms.length} platform${platforms.length === 1 ? "" : "s"}`}
      action={
        canEdit ? (
          <form action={createPlatformDraftAction}>
            <Button type="submit" size="sm">
              New platform
            </Button>
          </form>
        ) : undefined
      }
      isEmpty={platforms.length === 0}
      empty={{
        title: "No platforms yet",
        description: "Create your first platform page.",
        action: canEdit ? (
          <form action={createPlatformDraftAction}>
            <Button type="submit">Create first platform</Button>
          </form>
        ) : undefined,
      }}
    >
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
    </AdminListPage>
  );
}
