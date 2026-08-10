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
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

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
      <PageHeader
        title={item.name}
        breadcrumbs={
          <Link href="/admin/testimonials" className="text-accent-text hover:underline">
            ← Testimonials
          </Link>
        }
        action={
          <>
            <StatusBadge status={item.status} />
            <span className="text-xs text-muted">
              {item.verified ? "Verified" : "Unverified"}
            </span>
          </>
        }
      />

      <AdminPanel className="border-border bg-surface-muted/30 text-sm">
        Preserve the client&apos;s words. Testimonial Assistant formats or
        excerpts verified feedback — it will not generate quotes.
      </AdminPanel>

      <AdminPanel>
        <form action={saveTestimonialAction} className="space-y-4">
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="legacyId" value={item.legacyId} />

          <label className="block text-sm">
            <span className="font-medium">Original verified quote</span>
            <span className="mt-0.5 block text-xs text-muted">
              Immutable source wording. Prefer editing this only to correct
              transcription errors — not to strengthen praise.
            </span>
            <textarea
              name="originalQuote"
              defaultValue={originalQuote}
              rows={5}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2"
              required
            />
          </label>

          <label className="block text-sm">
            Working quote (display)
            <textarea
              name="quote"
              defaultValue={item.quote}
              rows={4}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2"
              required
            />
          </label>

          <label className="block text-sm">
            Display excerpt (optional)
            <span className="mt-0.5 block text-xs text-muted">
              Shorter extract using only words from the original quote.
            </span>
            <textarea
              name="displayExcerpt"
              defaultValue={item.displayExcerpt ?? ""}
              rows={2}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2"
            />
          </label>

          <label className="block text-sm">Name<input name="name" defaultValue={item.name} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2" required /></label>
          <label className="block text-sm">Company<input name="company" defaultValue={item.company} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2" required /></label>
          <label className="block text-sm">Role<input name="role" defaultValue={item.role ?? ""} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2" /></label>
          <label className="block text-sm">Service label<input name="serviceLabel" defaultValue={item.serviceLabel ?? ""} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2" /></label>
          <label className="block text-sm">Work project ID<input name="workProjectId" defaultValue={item.workProjectId ?? ""} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-xs" /></label>

          <fieldset className="space-y-3 rounded-md border border-border bg-surface-muted/30 p-4">
            <legend className="px-1 text-sm font-semibold">Avatar</legend>
            <MediaPicker
              name="avatarPath"
              label="Avatar image"
              defaultValue={item.avatarPath}
              storageConfigured={storageConfigured}
            />
          </fieldset>

          <label className="block text-sm">Themes JSON (editorial)<textarea name="themesJson" defaultValue={JSON.stringify(item.themesJson ?? [], null, 2)} rows={2} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-xs" /></label>
          <label className="block text-sm">Internal source<input name="internalSource" defaultValue={item.internalSource ?? ""} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2" /></label>
          <label className="block text-sm">Internal verification note (never public)<textarea name="internalVerificationNote" defaultValue={item.internalVerificationNote ?? ""} rows={2} className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2" /></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featured" defaultChecked={item.featured} /> Featured</label>
          <label className="block text-sm">
            Display order
            <input
              name="displayOrder"
              type="number"
              defaultValue={item.displayOrder}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2"
            />
          </label>
          <Button type="submit">Save</Button>
        </form>
      </AdminPanel>

      <TestimonialAiPanel
        testimonialId={item.id}
        user={user}
        status={item.status}
        hasQuote={hasQuote}
      />

      {canVerify ? (
        <AdminPanel>
          <form action={verifyTestimonialAction} className="flex flex-wrap items-center gap-3">
            <input type="hidden" name="id" value={item.id} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="verified" defaultChecked={item.verified} /> Verified</label>
            <Button type="submit" variant="secondary" size="sm">Update verification</Button>
          </form>
        </AdminPanel>
      ) : null}

      {canPublish ? (
        <div className="flex gap-3">
          <form action={publishTestimonialAction}><input type="hidden" name="id" value={item.id} /><Button type="submit">Publish</Button></form>
          <form action={unpublishTestimonialAction}><input type="hidden" name="id" value={item.id} /><Button type="submit" variant="secondary">Unpublish</Button></form>
        </div>
      ) : null}
    </div>
  );
}
