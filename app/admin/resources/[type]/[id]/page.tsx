import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser, userCan } from "@/lib/admin/session";
import { getResourceByIdAdmin } from "@/lib/repositories/resourcesRepository";
import {
  changeResourceSlugAction,
  publishResourceAction,
  saveResourceAction,
  unpublishResourceAction,
} from "@/lib/admin/phase3-actions";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { ResourceKind } from "@prisma/client";
import { ResourceAiPanel } from "@/components/admin/content-assistants/AiPanels";
import { resourceKindToEntityType } from "@/lib/ai/content-assistants/resource-kinds";

export const dynamic = "force-dynamic";

const KIND_TO_SEGMENT: Record<ResourceKind, string> = {
  guide: "guides",
  comparison: "comparisons",
  checklist: "checklists",
  glossary: "glossary",
  template: "templates",
  tool: "tools",
};

type PageProps = {
  params: Promise<{ type: string; id: string }>;
  searchParams?: Promise<{ opportunityId?: string }>;
};

export default async function AdminResourceEditorPage({
  params,
  searchParams,
}: PageProps) {
  const user = await requireAdminUser("edit_draft");
  const { type, id } = await params;
  const sp = (await searchParams) || {};
  const item = await getResourceByIdAdmin(id);
  if (!item || KIND_TO_SEGMENT[item.type] !== type) notFound();
  const canPublish = userCan(user, "publish");
  const canSlug = userCan(user, "slug_redirect");
  const protectedEngine = item.type === "template" || item.type === "tool";
  const assistantType = resourceKindToEntityType(item.type);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link href={`/admin/resources/${type}`} className="text-sm text-neutral-500">
          ← {type}
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{item.title}</h1>
          <StatusBadge status={item.status} />
        </div>
      </div>

      {protectedEngine ? (
        <div className="rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Technical IDs and scoring/condition engines are protected. Prefer editing
          display labels inside payload carefully; do not rename field/question IDs.
        </div>
      ) : null}
      {item.type === "checklist" ? (
        <div className="rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Checklist item IDs must stay stable for localStorage progress.
        </div>
      ) : null}
      {item.type === "comparison" ? (
        <div className="rounded border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700">
          No winner / stars / rating fields. Preserve no-winner comparison philosophy.
        </div>
      ) : null}

      <form action={saveResourceAction} className="space-y-4 rounded-lg border bg-white p-4">
        <input type="hidden" name="id" value={item.id} />
        <label className="block text-sm">Title<input name="title" defaultValue={item.title} className="mt-1 w-full rounded border px-3 py-2" required /></label>
        <label className="block text-sm">Slug<input name="slug" defaultValue={item.slug} className="mt-1 w-full rounded border px-3 py-2 font-mono text-sm" required /></label>
        <label className="block text-sm">Description<textarea name="description" defaultValue={item.description} rows={3} className="mt-1 w-full rounded border px-3 py-2" required /></label>
        <label className="block text-sm">Deck<textarea name="deck" defaultValue={item.deck ?? ""} rows={2} className="mt-1 w-full rounded border px-3 py-2" /></label>
        {item.type === "glossary" ? (
          <>
            <label className="block text-sm">Short definition<textarea name="shortDefinition" defaultValue={item.shortDefinition ?? ""} rows={2} className="mt-1 w-full rounded border px-3 py-2" /></label>
            <label className="block text-sm">Aliases JSON<textarea name="aliases" defaultValue={JSON.stringify(item.aliases ?? [], null, 2)} rows={3} className="mt-1 w-full rounded border px-3 py-2 font-mono text-xs" /></label>
          </>
        ) : (
          <>
            <input type="hidden" name="shortDefinition" value="" />
            <input type="hidden" name="aliases" value="" />
          </>
        )}
        <label className="block text-sm">
          Structured payload JSON
          <textarea
            name="payload"
            defaultValue={JSON.stringify(item.payload, null, 2)}
            rows={28}
            className="mt-1 w-full rounded border px-3 py-2 font-mono text-xs"
            required
          />
        </label>
        <label className="block text-sm">SEO title<input name="seoTitle" defaultValue={item.seoTitle ?? ""} className="mt-1 w-full rounded border px-3 py-2" /></label>
        <label className="block text-sm">SEO description<textarea name="seoDescription" defaultValue={item.seoDescription ?? ""} rows={2} className="mt-1 w-full rounded border px-3 py-2" /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featured" defaultChecked={item.featured} /> Featured</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featuredOnResources" defaultChecked={item.featuredOnResources} /> Featured on Resources hub</label>
        <button type="submit" className="rounded bg-neutral-900 px-4 py-2 text-sm text-white">Save draft</button>
      </form>

      <ResourceAiPanel
        entityType={assistantType}
        resourceId={item.id}
        user={user}
        status={item.status}
        opportunityId={sp.opportunityId}
      />

      <div className="flex flex-wrap gap-3">
        <Link href={`/admin/preview/resource/${item.id}`} target="_blank" className="rounded border px-4 py-2 text-sm">Preview</Link>
        {canPublish ? (
          <>
            <form action={publishResourceAction}><input type="hidden" name="id" value={item.id} /><button className="rounded bg-[#F47A48] px-4 py-2 text-sm text-white">Publish</button></form>
            <form action={unpublishResourceAction}><input type="hidden" name="id" value={item.id} /><button className="rounded border px-4 py-2 text-sm">Unpublish</button></form>
          </>
        ) : null}
      </div>

      {canSlug ? (
        <form action={changeResourceSlugAction} className="flex gap-2 rounded border bg-white p-4">
          <input type="hidden" name="id" value={item.id} />
          <input name="newSlug" defaultValue={item.slug} className="flex-1 rounded border px-3 py-2 font-mono text-sm" />
          <button type="submit" className="rounded border px-3 py-2 text-sm">Change slug + 301</button>
        </form>
      ) : null}
    </div>
  );
}
