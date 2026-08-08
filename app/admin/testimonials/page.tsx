import { requireAdminUser, userCan } from "@/lib/admin/session";
import { listAllTestimonialsAdmin } from "@/lib/repositories/testimonialsRepository";
import { ContentBulkTable } from "@/components/admin/ContentBulkTable";
import { createTestimonialDraftAction } from "@/lib/admin/bulk-content-actions";

export const dynamic = "force-dynamic";

export default async function AdminTestimonialsPage() {
  const user = await requireAdminUser("edit_draft");
  const canPublish = userCan(user, "publish");
  const canEdit = userCan(user, "edit_draft");
  const items = await listAllTestimonialsAdmin();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Testimonials</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Only verified + published testimonials render publicly. Internal
            notes never appear on the site.
          </p>
        </div>
        {canEdit ? (
          <form action={createTestimonialDraftAction}>
            <button type="submit" className="admin-btn-primary">
              New testimonial
            </button>
          </form>
        ) : null}
      </div>

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
    </div>
  );
}
