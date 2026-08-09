import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser, userCan } from "@/lib/admin/session";
import { getTestimonialByIdAdmin } from "@/lib/repositories/testimonialsRepository";
import {
  publishTestimonialAction,
  saveTestimonialAction,
  unpublishTestimonialAction,
  verifyTestimonialAction,
} from "@/lib/admin/phase3-actions";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { TestimonialAiPanel } from "@/components/admin/content-assistants/AiPanels";
import { MediaPicker } from "@/components/admin/media/MediaPicker";
import { isMediaStorageConfigured } from "@/lib/media/storage";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminTestimonialEditorPage({ params }: PageProps) {
  const user = await requireAdminUser("edit_draft");
  const { id } = await params;
  const item = await getTestimonialByIdAdmin(id);
  if (!item) notFound();
  const canPublish = userCan(user, "publish");
  const canVerify = userCan(user, "verify_testimonial");
  const storageConfigured = isMediaStorageConfigured();
  const originalQuote = item.originalQuote || item.quote;
  const hasQuote = Boolean(originalQuote?.trim());

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin/testimonials" className="text-sm text-neutral-500">← Testimonials</Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{item.name}</h1>
          <StatusBadge status={item.status} />
          <span className="text-xs">{item.verified ? "Verified" : "Unverified"}</span>
        </div>
      </div>

      <div className="rounded border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-800">
        Preserve the client&apos;s words. Testimonial Assistant formats or
        excerpts verified feedback — it will not generate quotes.
      </div>

      <form action={saveTestimonialAction} className="space-y-4 rounded-lg border bg-white p-4">
        <input type="hidden" name="id" value={item.id} />
        <input type="hidden" name="legacyId" value={item.legacyId} />

        <label className="block text-sm">
          <span className="font-medium">Original verified quote</span>
          <span className="mt-0.5 block text-xs text-neutral-500">
            Immutable source wording. Prefer editing this only to correct
            transcription errors — not to strengthen praise.
          </span>
          <textarea
            name="originalQuote"
            defaultValue={originalQuote}
            rows={5}
            className="mt-1 w-full rounded border px-3 py-2"
            required
          />
        </label>

        <label className="block text-sm">
          Working quote (display)
          <textarea
            name="quote"
            defaultValue={item.quote}
            rows={4}
            className="mt-1 w-full rounded border px-3 py-2"
            required
          />
        </label>

        <label className="block text-sm">
          Display excerpt (optional)
          <span className="mt-0.5 block text-xs text-neutral-500">
            Shorter extract using only words from the original quote.
          </span>
          <textarea
            name="displayExcerpt"
            defaultValue={item.displayExcerpt ?? ""}
            rows={2}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>

        <label className="block text-sm">Name<input name="name" defaultValue={item.name} className="mt-1 w-full rounded border px-3 py-2" required /></label>
        <label className="block text-sm">Company<input name="company" defaultValue={item.company} className="mt-1 w-full rounded border px-3 py-2" required /></label>
        <label className="block text-sm">Role<input name="role" defaultValue={item.role ?? ""} className="mt-1 w-full rounded border px-3 py-2" /></label>
        <label className="block text-sm">Service label<input name="serviceLabel" defaultValue={item.serviceLabel ?? ""} className="mt-1 w-full rounded border px-3 py-2" /></label>
        <label className="block text-sm">Work project ID<input name="workProjectId" defaultValue={item.workProjectId ?? ""} className="mt-1 w-full rounded border px-3 py-2 font-mono text-xs" /></label>

        <fieldset className="space-y-3 rounded border border-neutral-200 bg-neutral-50 p-4">
          <legend className="px-1 text-sm font-semibold text-neutral-900">Avatar</legend>
          <MediaPicker
            name="avatarPath"
            label="Avatar image"
            defaultValue={item.avatarPath}
            storageConfigured={storageConfigured}
          />
        </fieldset>

        <label className="block text-sm">Themes JSON (editorial)<textarea name="themesJson" defaultValue={JSON.stringify(item.themesJson ?? [], null, 2)} rows={2} className="mt-1 w-full rounded border px-3 py-2 font-mono text-xs" /></label>
        <label className="block text-sm">Internal source<input name="internalSource" defaultValue={item.internalSource ?? ""} className="mt-1 w-full rounded border px-3 py-2" /></label>
        <label className="block text-sm">Internal verification note (never public)<textarea name="internalVerificationNote" defaultValue={item.internalVerificationNote ?? ""} rows={2} className="mt-1 w-full rounded border px-3 py-2" /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featured" defaultChecked={item.featured} /> Featured</label>
        <label className="block text-sm">
          Display order
          <input
            name="displayOrder"
            type="number"
            defaultValue={item.displayOrder}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
        <button type="submit" className="rounded bg-neutral-900 px-4 py-2 text-sm text-white">Save</button>
      </form>

      <TestimonialAiPanel
        testimonialId={item.id}
        user={user}
        status={item.status}
        hasQuote={hasQuote}
      />

      {canVerify ? (
        <form action={verifyTestimonialAction} className="flex gap-3 rounded border bg-white p-4">
          <input type="hidden" name="id" value={item.id} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="verified" defaultChecked={item.verified} /> Verified</label>
          <button type="submit" className="rounded border px-3 py-2 text-sm">Update verification</button>
        </form>
      ) : null}

      {canPublish ? (
        <div className="flex gap-3">
          <form action={publishTestimonialAction}><input type="hidden" name="id" value={item.id} /><button className="rounded bg-[#F47A48] px-4 py-2 text-sm text-white">Publish</button></form>
          <form action={unpublishTestimonialAction}><input type="hidden" name="id" value={item.id} /><button className="rounded border px-4 py-2 text-sm">Unpublish</button></form>
        </div>
      ) : null}
    </div>
  );
}
