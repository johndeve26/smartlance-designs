import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser, userCan } from "@/lib/admin/session";
import { listResourcesAdmin } from "@/lib/repositories/resourcesRepository";
import { ContentBulkTable } from "@/components/admin/ContentBulkTable";
import { createResourceDraftAction } from "@/lib/admin/bulk-content-actions";
import type { ResourceKind } from "@prisma/client";

export const dynamic = "force-dynamic";

const TYPE_MAP: Record<string, ResourceKind> = {
  guides: "guide",
  comparisons: "comparison",
  checklists: "checklist",
  glossary: "glossary",
  templates: "template",
  tools: "tool",
};

type PageProps = { params: Promise<{ type: string }> };

export default async function AdminResourceTypePage({ params }: PageProps) {
  const user = await requireAdminUser("edit_draft");
  const canPublish = userCan(user, "publish");
  const canEdit = userCan(user, "edit_draft");
  const { type } = await params;
  const kind = TYPE_MAP[type];
  if (!kind) notFound();

  const items = await listResourcesAdmin(kind);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/resources" className="text-sm text-neutral-500">
            ← Resources
          </Link>
          <h1 className="mt-2 text-2xl font-semibold capitalize">{type}</h1>
          {(kind === "template" || kind === "tool") && (
            <p className="mt-1 text-sm text-amber-800">
              Technical IDs and scoring/engine logic are protected. Edit display
              copy and metadata only.
            </p>
          )}
          {kind === "checklist" && (
            <p className="mt-1 text-sm text-amber-800">
              Checklist item IDs are immutable — they power browser progress
              (localStorage).
            </p>
          )}
        </div>
        {canEdit && kind !== "template" && kind !== "tool" && kind !== "checklist" ? (
          <form action={createResourceDraftAction}>
            <input type="hidden" name="type" value={type} />
            <button type="submit" className="admin-btn-primary">
              New {kind}
            </button>
          </form>
        ) : null}
      </div>

      <ContentBulkTable
        family="resource"
        canPublish={canPublish}
        emptyMessage={`No ${type} yet.`}
        columns={[
          { key: "title", header: "Title", isTitle: true },
          { key: "slug", header: "Slug", mono: true },
          { key: "status", header: "Status" },
          { key: "updated", header: "Updated" },
        ]}
        rows={items.map((item) => ({
          id: item.id,
          href: `/admin/resources/${type}/${item.id}`,
          title: item.title,
          status: item.status,
          fields: {
            slug: item.slug,
            updated: item.updatedAt.toISOString().slice(0, 10),
          },
        }))}
      />
    </div>
  );
}
