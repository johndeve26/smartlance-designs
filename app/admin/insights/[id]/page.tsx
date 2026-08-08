import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser, userCan } from "@/lib/admin/session";
import { getInsightByIdAdmin } from "@/lib/repositories/insightsRepository";
import {
  changeInsightSlugAction,
  publishInsightAction,
  saveInsightAction,
  unpublishInsightAction,
} from "@/lib/admin/phase3-actions";
import { StatusBadge } from "@/components/admin/StatusBadge";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminInsightEditorPage({ params }: PageProps) {
  const user = await requireAdminUser("edit_draft");
  const { id } = await params;
  const item = await getInsightByIdAdmin(id);
  if (!item) notFound();
  const canPublish = userCan(user, "publish");
  const canSlug = userCan(user, "slug_redirect");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link href="/admin/insights" className="text-sm text-neutral-500">← Insights</Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{item.title}</h1>
          <StatusBadge status={item.status} />
        </div>
        <p className="mt-1 text-xs text-neutral-500">
          Original publish date is preserved for SEO. Do not invent authors.
        </p>
      </div>

      <form action={saveInsightAction} className="space-y-4 rounded-lg border bg-white p-4">
        <input type="hidden" name="id" value={item.id} />
        <label className="block text-sm">Title<input name="title" defaultValue={item.title} className="mt-1 w-full rounded border px-3 py-2" required /></label>
        <label className="block text-sm">Slug<input name="slug" defaultValue={item.slug} className="mt-1 w-full rounded border px-3 py-2 font-mono text-sm" required /></label>
        <label className="block text-sm">Description<textarea name="description" defaultValue={item.description} rows={2} className="mt-1 w-full rounded border px-3 py-2" required /></label>
        <label className="block text-sm">Category<input name="categoryLabel" defaultValue={item.categoryLabel} className="mt-1 w-full rounded border px-3 py-2" required /></label>
        <label className="block text-sm">Author<input name="author" defaultValue={item.author ?? ""} className="mt-1 w-full rounded border px-3 py-2" /></label>
        <label className="block text-sm">Original published at<input type="datetime-local" name="originalPublishedAt" defaultValue={item.originalPublishedAt.toISOString().slice(0, 16)} className="mt-1 w-full rounded border px-3 py-2" required /></label>
        <label className="block text-sm">Hero image path<input name="heroImagePath" defaultValue={item.heroImagePath ?? ""} className="mt-1 w-full rounded border px-3 py-2 font-mono text-xs" /></label>
        <label className="block text-sm">Hero alt<input name="heroImageAlt" defaultValue={item.heroImageAlt ?? ""} className="mt-1 w-full rounded border px-3 py-2" /></label>
        <label className="block text-sm">Body (Markdown)<textarea name="bodyMarkdown" defaultValue={item.bodyMarkdown} rows={24} className="mt-1 w-full rounded border px-3 py-2 font-mono text-xs" required /></label>
        <label className="block text-sm">SEO title<input name="seoTitle" defaultValue={item.seoTitle ?? ""} className="mt-1 w-full rounded border px-3 py-2" /></label>
        <label className="block text-sm">SEO description<textarea name="seoDescription" defaultValue={item.seoDescription ?? ""} rows={2} className="mt-1 w-full rounded border px-3 py-2" /></label>
        <label className="block text-sm">Related service hrefs JSON<textarea name="relatedServiceHrefs" defaultValue={JSON.stringify(item.relatedServiceHrefs ?? [], null, 2)} rows={3} className="mt-1 w-full rounded border px-3 py-2 font-mono text-xs" /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featured" defaultChecked={item.featured} /> Featured</label>
        <button type="submit" className="rounded bg-neutral-900 px-4 py-2 text-sm text-white">Save draft</button>
      </form>

      <div className="flex flex-wrap gap-3">
        <Link href={`/admin/preview/insight/${item.id}`} target="_blank" className="rounded border px-4 py-2 text-sm">Preview</Link>
        {canPublish ? (
          <>
            <form action={publishInsightAction}><input type="hidden" name="id" value={item.id} /><button className="rounded bg-[#F47A48] px-4 py-2 text-sm text-white">Publish</button></form>
            <form action={unpublishInsightAction}><input type="hidden" name="id" value={item.id} /><button className="rounded border px-4 py-2 text-sm">Unpublish</button></form>
          </>
        ) : null}
      </div>

      {canSlug ? (
        <form action={changeInsightSlugAction} className="flex gap-2 rounded border bg-white p-4">
          <input type="hidden" name="id" value={item.id} />
          <input name="newSlug" defaultValue={item.slug} className="flex-1 rounded border px-3 py-2 font-mono text-sm" />
          <button type="submit" className="rounded border px-3 py-2 text-sm">Change slug + retarget redirects</button>
        </form>
      ) : null}
    </div>
  );
}
