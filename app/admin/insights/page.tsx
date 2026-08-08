import Link from "next/link";
import { requireAdminUser, userCan } from "@/lib/admin/session";
import { listInsightsAdmin } from "@/lib/repositories/insightsRepository";
import { ContentBulkTable } from "@/components/admin/ContentBulkTable";
import { createInsightDraftAction } from "@/lib/admin/bulk-content-actions";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ q?: string; status?: string; category?: string; page?: string }>;
};

export default async function AdminInsightsPage({ searchParams }: PageProps) {
  const user = await requireAdminUser("edit_draft");
  const canPublish = userCan(user, "publish");
  const canEdit = userCan(user, "edit_draft");
  const params = await searchParams;
  const page = Math.max(1, Number(params.page || "1") || 1);
  const take = 30;
  const { items, total } = await listInsightsAdmin({
    q: params.q,
    status: params.status as "DRAFT" | "PUBLISHED" | "ARCHIVED" | undefined,
    category: params.category,
    take,
    skip: (page - 1) * take,
  });
  const totalPages = Math.max(1, Math.ceil(total / take));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Insights</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Blog posts at /blog/[slug]. Original publish dates are preserved.
          </p>
        </div>
        {canEdit ? (
          <form action={createInsightDraftAction}>
            <button type="submit" className="admin-btn-primary">
              New insight
            </button>
          </form>
        ) : null}
      </div>

      <form className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Search title or slug"
          className="rounded border border-neutral-300 px-3 py-2 text-sm"
        />
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="rounded border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <button
          type="submit"
          className="rounded bg-neutral-900 px-3 py-2 text-sm font-medium text-white"
        >
          Filter
        </button>
      </form>

      <ContentBulkTable
        family="insight"
        canPublish={canPublish}
        emptyMessage="No insights yet. Create one or run the Phase 3 import."
        columns={[
          { key: "title", header: "Title", isTitle: true },
          { key: "topic", header: "Topic" },
          { key: "status", header: "Status" },
          { key: "published", header: "Published" },
          { key: "updated", header: "Updated" },
        ]}
        rows={items.map((item) => ({
          id: item.id,
          href: `/admin/insights/${item.id}`,
          title: item.title,
          status: item.status,
          fields: {
            topic: item.categoryLabel,
            published: item.originalPublishedAt.toISOString().slice(0, 10),
            updated: item.updatedAt.toISOString().slice(0, 10),
          },
        }))}
      />

      <div className="flex items-center gap-3 text-sm text-neutral-600">
        <span>
          {total} insights · page {page} / {totalPages}
        </span>
        {page > 1 ? (
          <Link href={`/admin/insights?page=${page - 1}`}>Previous</Link>
        ) : null}
        {page < totalPages ? (
          <Link href={`/admin/insights?page=${page + 1}`}>Next</Link>
        ) : null}
      </div>
    </div>
  );
}
