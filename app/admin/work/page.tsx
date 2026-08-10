import { requireAdminUser, userCan } from "@/lib/admin/session";
import { listAllWorkAdmin } from "@/lib/repositories/workRepository";
import { ContentBulkTable } from "@/components/admin/ContentBulkTable";
import { createWorkDraftAction } from "@/lib/admin/bulk-content-actions";
import { AdminListPage } from "@/components/admin/patterns/AdminListPage";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminWorkPage() {
  const user = await requireAdminUser("edit_draft");
  const canPublish = userCan(user, "publish");
  const canEdit = userCan(user, "edit_draft");
  const items = await listAllWorkAdmin();

  return (
    <AdminListPage
      title="Work"
      description="Portfolio case studies. Results fields stay optional — only verified claims."
      action={
        canEdit ? (
          <form action={createWorkDraftAction}>
            <Button type="submit" size="sm">
              New project
            </Button>
          </form>
        ) : undefined
      }
      isEmpty={items.length === 0}
      empty={{
        title: "No work projects yet",
        action: canEdit ? (
          <form action={createWorkDraftAction}>
            <Button type="submit">Create first project</Button>
          </form>
        ) : undefined,
      }}
    >
      <ContentBulkTable
        family="work"
        canPublish={canPublish}
        columns={[
          { key: "title", header: "Project", isTitle: true },
          { key: "industry", header: "Industry" },
          { key: "featured", header: "Featured" },
          { key: "status", header: "Status" },
          { key: "updated", header: "Updated" },
        ]}
        rows={items.map((item) => ({
          id: item.id,
          href: `/admin/work/${item.id}`,
          title: item.name,
          status: item.status,
          fields: {
            industry: item.industryLabel,
            featured: item.featured ? "Yes" : "—",
            updated: item.updatedAt.toISOString().slice(0, 10),
          },
        }))}
      />
    </AdminListPage>
  );
}
