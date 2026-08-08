import { requireAdminUser, userCan } from "@/lib/admin/session";
import { listAllIndustriesAdmin } from "@/lib/repositories/industriesRepository";
import { ContentBulkTable } from "@/components/admin/ContentBulkTable";
import { createIndustryDraftAction } from "@/lib/admin/bulk-content-actions";

export const dynamic = "force-dynamic";

export default async function AdminIndustriesPage() {
  const user = await requireAdminUser("edit_draft");
  const canPublish = userCan(user, "publish");
  const canEdit = userCan(user, "edit_draft");
  const items = await listAllIndustriesAdmin();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Industries</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Hub-only catalogue. Verified experience requires related Work.
          </p>
        </div>
        {canEdit ? (
          <form action={createIndustryDraftAction}>
            <button type="submit" className="admin-btn-primary">
              New industry
            </button>
          </form>
        ) : null}
      </div>

      <ContentBulkTable
        family="industry"
        canPublish={canPublish}
        emptyMessage="No industries yet."
        columns={[
          { key: "title", header: "Name", isTitle: true },
          { key: "group", header: "Group" },
          { key: "verified", header: "Verified" },
          { key: "status", header: "Status" },
          { key: "work", header: "Work" },
        ]}
        rows={items.map((item) => ({
          id: item.id,
          href: `/admin/industries/${item.id}`,
          title: item.name,
          status: item.status,
          fields: {
            group: item.group,
            verified: item.hasVerifiedProjectExperience ? "Yes" : "No",
            work: String(item.workLinks.length),
          },
        }))}
      />
    </div>
  );
}
