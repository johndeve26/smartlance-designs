import { requireAdminUser, userCan } from "@/lib/admin/session";
import { listAllTestimonialsAdmin } from "@/lib/repositories/testimonialsRepository";
import { ContentBulkTable } from "@/components/admin/ContentBulkTable";
import { createTestimonialDraftAction } from "@/lib/admin/bulk-content-actions";
import { AdminListPage } from "@/components/admin/patterns/AdminListPage";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminTestimonialsPage() {
  const user = await requireAdminUser("edit_draft");
  const canPublish = userCan(user, "publish");
  const canEdit = userCan(user, "edit_draft");
  const items = await listAllTestimonialsAdmin();

  return (
    <AdminListPage
      title="Testimonials"
      description="Only verified + published testimonials render publicly. Internal notes never appear on the site."
      action={
        canEdit ? (
          <form action={createTestimonialDraftAction}>
            <Button type="submit" size="sm">
              New testimonial
            </Button>
          </form>
        ) : undefined
      }
      isEmpty={items.length === 0}
      empty={{
        title: "No testimonials yet",
        action: canEdit ? (
          <form action={createTestimonialDraftAction}>
            <Button type="submit">Create first testimonial</Button>
          </form>
        ) : undefined,
      }}
    >
      <ContentBulkTable
        family="testimonial"
        canPublish={canPublish}
        emptyMessage="No testimonials yet."
        columns={[
          { key: "title", header: "Name", isTitle: true },
          { key: "company", header: "Company" },
          { key: "work", header: "Work" },
          { key: "verified", header: "Verified" },
          { key: "status", header: "Status" },
        ]}
        rows={items.map((item) => ({
          id: item.id,
          href: `/admin/testimonials/${item.id}`,
          title: item.name,
          status: item.status,
          fields: {
            company: item.company,
            work: item.workProject?.name ?? "—",
            verified: item.verified ? "Yes" : "No",
          },
        }))}
      />
    </AdminListPage>
  );
}
