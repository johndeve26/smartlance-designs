import type { Metadata } from "next";
import { requireAdminUser, userCan } from "@/lib/admin/session";
import { listAllSolutionsAdmin } from "@/lib/repositories/solutionsRepository";
import { ContentBulkTable } from "@/components/admin/ContentBulkTable";
import { createSolutionDraftAction } from "@/lib/admin/bulk-content-actions";

export const metadata: Metadata = {
  title: "Solutions",
};

export default async function AdminSolutionsPage() {
  const user = await requireAdminUser();
  const canPublish = userCan(user, "publish");
  const canEdit = userCan(user, "edit_draft");
  const solutions = await listAllSolutionsAdmin();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="admin-page-title">Solutions</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {solutions.length} solution{solutions.length === 1 ? "" : "s"}
          </p>
        </div>
        {canEdit ? (
          <form action={createSolutionDraftAction}>
            <button type="submit" className="admin-btn-primary">
              New solution
            </button>
          </form>
        ) : null}
      </div>

      <ContentBulkTable
        family="solution"
        canPublish={canPublish}
        emptyMessage="No solutions in the database yet."
        columns={[
          { key: "title", header: "Name", isTitle: true },
          { key: "slug", header: "Slug", mono: true },
          { key: "category", header: "Category" },
          { key: "status", header: "Status" },
          { key: "order", header: "Order" },
        ]}
        rows={solutions.map((s) => ({
          id: s.id,
          href: `/admin/solutions/${s.id}`,
          title: s.name,
          status: s.status,
          fields: {
            slug: s.slug,
            category: s.category,
            order: String(s.displayOrder),
          },
        }))}
      />
    </div>
  );
}
