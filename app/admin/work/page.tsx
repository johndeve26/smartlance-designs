import { requireAdminUser, userCan } from "@/lib/admin/session";
import { listAllWorkAdmin } from "@/lib/repositories/workRepository";
import { ContentBulkTable } from "@/components/admin/ContentBulkTable";
import { createWorkDraftAction } from "@/lib/admin/bulk-content-actions";

export const dynamic = "force-dynamic";

export default async function AdminWorkPage() {
  const user = await requireAdminUser("edit_draft");
  const canPublish = userCan(user, "publish");
  const canEdit = userCan(user, "edit_draft");
  const items = await listAllWorkAdmin();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Work</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Case studies. Results fields stay optional — only verified claims.
          </p>
        </div>
        {canEdit ? (
          <form action={createWorkDraftAction}>
            <button type="submit" className="admin-btn-primary">
              New project
            </button>
          </form>
        ) : null}
      </div>

      <ContentBulkTable
        family="work"
        canPublish={canPublish}
        emptyMessage="No work projects yet."
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
    </div>
  );
}
