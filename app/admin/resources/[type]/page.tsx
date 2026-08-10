import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser, userCan } from "@/lib/admin/session";
import { listResourcesAdmin } from "@/lib/repositories/resourcesRepository";
import { ContentBulkTable } from "@/components/admin/ContentBulkTable";
import { createResourceDraftAction } from "@/lib/admin/bulk-content-actions";
import { AdminListPage } from "@/components/admin/patterns/AdminListPage";
import { Button } from "@/components/ui/button";
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

  const typeNote =
    kind === "template" || kind === "tool"
      ? "Technical IDs and scoring/engine logic are protected. Edit display copy and metadata only."
      : kind === "checklist"
        ? "Checklist item IDs are immutable — they power browser progress (localStorage)."
        : undefined;

  return (
    <AdminListPage
      title={type.charAt(0).toUpperCase() + type.slice(1)}
      description={
        <>
          <Link href="/admin/resources" className="text-accent-text hover:underline">
            ← Resources
          </Link>
          {typeNote ? (
            <span className="mt-2 block text-warning-text">{typeNote}</span>
          ) : null}
        </>
      }
      action={
        canEdit && kind !== "template" && kind !== "tool" && kind !== "checklist" ? (
          <form action={createResourceDraftAction}>
            <input type="hidden" name="type" value={type} />
            <Button type="submit" size="sm">
              New {kind}
            </Button>
          </form>
        ) : undefined
      }
      isEmpty={items.length === 0}
      empty={{
        title: `No ${type} yet`,
        action:
          canEdit && kind !== "template" && kind !== "tool" && kind !== "checklist" ? (
            <form action={createResourceDraftAction}>
              <input type="hidden" name="type" value={type} />
              <Button type="submit">Create first {kind}</Button>
            </form>
          ) : undefined,
      }}
    >
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
    </AdminListPage>
  );
}
