import { requireAdminUser, userCan } from "@/lib/admin/session";
import { listAllIndustriesAdmin } from "@/lib/repositories/industriesRepository";
import { ContentBulkTable } from "@/components/admin/ContentBulkTable";
import { createIndustryDraftAction } from "@/lib/admin/bulk-content-actions";
import { AdminListPage } from "@/components/admin/patterns/AdminListPage";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminIndustriesPage() {
  const user = await requireAdminUser("edit_draft");
  const canPublish = userCan(user, "publish");
  const canEdit = userCan(user, "edit_draft");
  const items = await listAllIndustriesAdmin();

  return (
    <AdminListPage
      title="Industries"
      description="Industry hub catalogue. Verified experience requires related Work."
      action={
        canEdit ? (
          <form action={createIndustryDraftAction}>
            <Button type="submit" size="sm">
              New industry
            </Button>
          </form>
        ) : undefined
      }
      isEmpty={items.length === 0}
      empty={{
        title: "No industries yet",
        action: canEdit ? (
          <form action={createIndustryDraftAction}>
            <Button type="submit">Create first industry</Button>
          </form>
        ) : undefined,
      }}
    >
      <ContentBulkTable
        family="industry"
        canPublish={canPublish}
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
    </AdminListPage>
  );
}
