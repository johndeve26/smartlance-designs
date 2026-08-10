import { requireAdminUser, userCan } from "@/lib/admin/session";
import { listInsightsAdmin } from "@/lib/repositories/insightsRepository";
import { ContentBulkTable } from "@/components/admin/ContentBulkTable";
import { createInsightDraftAction } from "@/lib/admin/bulk-content-actions";
import { AdminListPage } from "@/components/admin/patterns/AdminListPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";

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
    <AdminListPage
      title="Blog posts"
      description="Create, review and publish Smartlance articles at /blog/[slug]."
      action={
        canEdit ? (
          <form action={createInsightDraftAction}>
            <Button type="submit" size="sm">
              New post
            </Button>
          </form>
        ) : undefined
      }
      filters={
        <form className="flex flex-wrap items-end gap-3">
          <Input
            name="q"
            label="Search"
            defaultValue={params.q ?? ""}
            placeholder="Title or slug"
            className="min-w-[200px]"
          />
          <Select name="status" label="Status" defaultValue={params.status ?? ""}>
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
          <Button type="submit" size="sm">
            Filter
          </Button>
        </form>
      }
      isEmpty={items.length === 0}
      empty={{
        title: "No blog posts yet",
        description: "Create your first article.",
        action: canEdit ? (
          <form action={createInsightDraftAction}>
            <Button type="submit">Create first post</Button>
          </form>
        ) : undefined,
      }}
      pagination={
        totalPages > 1 ? (
          <Pagination
            page={page}
            pageSize={take}
            total={total}
            hrefForPage={(p) => {
              const q = new URLSearchParams();
              if (params.q) q.set("q", params.q);
              if (params.status) q.set("status", params.status);
              if (params.category) q.set("category", params.category);
              if (p > 1) q.set("page", String(p));
              const qs = q.toString();
              return qs ? `/admin/insights?${qs}` : "/admin/insights";
            }}
          />
        ) : undefined
      }
    >
      <ContentBulkTable
        family="insight"
        canPublish={canPublish}
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
    </AdminListPage>
  );
}
