import type { Metadata } from "next";
import { requireAdminUser, userCan } from "@/lib/admin/session";
import {
  effectiveHomepageFields,
  getHomepageAdmin,
  hasHomepageDraft,
} from "@/lib/repositories/homepageRepository";
import {
  discardHomepageDraftAction,
  previewHomepageAction,
  publishHomepageAction,
  saveHomepageAction,
} from "@/lib/admin/content-actions";
import { JsonField } from "@/components/admin/JsonField";
import { SeoFields } from "@/components/admin/SeoFields";
import { HomepageAiPanel } from "@/components/admin/content-assistants/AiPanels";
import { PageHeader } from "@/components/ui/page-header";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";

export const metadata: Metadata = {
  title: "Homepage",
};

type PageProps = {
  searchParams: Promise<{
    saved?: string;
    published?: string;
    discarded?: string;
    opportunityId?: string;
  }>;
};

export default async function AdminHomepagePage({ searchParams }: PageProps) {
  const user = await requireAdminUser();
  const canEdit = userCan(user, "edit_draft");
  const canPublish = userCan(user, "publish");
  const canPreview = userCan(user, "preview");
  const params = await searchParams;
  const home = await getHomepageAdmin();
  const fields = home ? effectiveHomepageFields(home) : null;
  const hasDraft = hasHomepageDraft(home);
  const opportunityId = params.opportunityId?.trim() || undefined;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Homepage"
        description="Hero, CTAs, section JSON, and SEO — edits save as draft until you publish"
        action={
          <AdminPanel className="text-sm">
            {hasDraft ? (
              <span className="font-medium text-warning-text">Draft changes</span>
            ) : (
              <span className="font-medium text-success-text">
                No unpublished changes
              </span>
            )}
            <p className="mt-0.5 text-xs text-muted">
              Live site uses the published Homepage until you publish.
            </p>
          </AdminPanel>
        }
      />

      {!home ? (
        <AdminPanel className="text-sm text-muted">
          No homepage record yet. Saving a draft will create one.
        </AdminPanel>
      ) : null}

      {params.saved ? (
        <p className="text-sm text-emerald-700">
          Draft saved. Public Homepage is unchanged until you publish.
        </p>
      ) : null}
      {params.published ? (
        <p className="text-sm text-emerald-700">Homepage published.</p>
      ) : null}
      {params.discarded ? (
        <p className="text-sm text-neutral-700">
          Draft discarded. Editor shows published content again.
        </p>
      ) : null}

      {opportunityId ? (
        <AdminPanel className="border-warning bg-warning-soft/40 text-sm text-warning-text">
          Suggested by Topic Intelligence. Review context, then generate a
          proposal when ready — nothing runs automatically.
        </AdminPanel>
      ) : null}

      <HomepageAiPanel user={user} opportunityId={opportunityId} />

      <form action={saveHomepageAction} className="space-y-4">
        <fieldset className="admin-fieldset" disabled={!canEdit}>
          <legend className="admin-legend">Hero</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="admin-field sm:col-span-2">
              <span className="admin-label">Eyebrow</span>
              <input
                name="heroEyebrow"
                className="admin-input"
                defaultValue={fields?.heroEyebrow ?? ""}
              />
            </label>
            <label className="admin-field sm:col-span-2">
              <span className="admin-label">Headline</span>
              <input
                name="heroHeadline"
                className="admin-input"
                defaultValue={fields?.heroHeadline ?? ""}
              />
            </label>
            <label className="admin-field sm:col-span-2">
              <span className="admin-label">Headline accent</span>
              <input
                name="heroHeadlineAccent"
                className="admin-input"
                defaultValue={fields?.heroHeadlineAccent ?? ""}
              />
            </label>
            <label className="admin-field sm:col-span-2">
              <span className="admin-label">Supporting</span>
              <textarea
                name="heroSupporting"
                rows={3}
                className="admin-input"
                defaultValue={fields?.heroSupporting ?? ""}
              />
            </label>
          </div>
        </fieldset>

        <fieldset className="admin-fieldset" disabled={!canEdit}>
          <legend className="admin-legend">CTAs</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="admin-field">
              <span className="admin-label">Primary label</span>
              <input
                name="primaryCtaLabel"
                className="admin-input"
                defaultValue={fields?.primaryCtaLabel ?? ""}
              />
            </label>
            <label className="admin-field">
              <span className="admin-label">Primary href</span>
              <input
                name="primaryCtaHref"
                className="admin-input"
                defaultValue={fields?.primaryCtaHref ?? ""}
              />
            </label>
            <label className="admin-field">
              <span className="admin-label">Secondary label</span>
              <input
                name="secondaryCtaLabel"
                className="admin-input"
                defaultValue={fields?.secondaryCtaLabel ?? ""}
              />
            </label>
            <label className="admin-field">
              <span className="admin-label">Secondary href</span>
              <input
                name="secondaryCtaHref"
                className="admin-input"
                defaultValue={fields?.secondaryCtaHref ?? ""}
              />
            </label>
          </div>
        </fieldset>

        <fieldset className="admin-fieldset" disabled={!canEdit}>
          <legend className="admin-legend">Sections (JSON)</legend>
          <div className="space-y-4">
            <JsonField
              name="sections"
              label="Sections"
              defaultValue={fields?.sections ?? {}}
              disabled={!canEdit}
            />
            <JsonField
              name="sectionVisibility"
              label="Section visibility"
              defaultValue={fields?.sectionVisibility ?? {}}
              disabled={!canEdit}
              rows={6}
            />
            <JsonField
              name="curatedServiceItems"
              label="Curated service items"
              defaultValue={fields?.curatedServiceItems ?? []}
              disabled={!canEdit}
              rows={6}
            />
            <JsonField
              name="curatedTestimonialIds"
              label="Curated testimonial IDs"
              defaultValue={fields?.curatedTestimonialIds ?? []}
              disabled={!canEdit}
              rows={4}
            />
          </div>
        </fieldset>

        <div className={canEdit ? "" : "pointer-events-none opacity-70"}>
          <SeoFields
            includeMeta
            disabled={!canEdit}
            defaults={{
              metaTitle: fields?.metaTitle,
              metaDescription: fields?.metaDescription,
              seoTitle: fields?.seoTitle,
              seoDescription: fields?.seoDescription,
              ogTitle: fields?.ogTitle,
              ogDescription: fields?.ogDescription,
              ogImagePath: fields?.ogImagePath,
              noIndex: fields?.noIndex,
              canonicalOverride: fields?.canonicalOverride,
            }}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {canEdit ? (
            <button type="submit" className="admin-btn-primary">
              Save draft
            </button>
          ) : (
            <p className="text-sm text-neutral-500">Read-only for your role.</p>
          )}
          {canPreview ? (
            <button
              type="submit"
              formAction={previewHomepageAction}
              className="admin-btn"
            >
              Preview
            </button>
          ) : null}
          {canPublish && hasDraft ? (
            <button
              type="submit"
              formAction={publishHomepageAction}
              className="admin-btn"
            >
              Publish
            </button>
          ) : null}
          {canEdit && hasDraft ? (
            <button
              type="submit"
              formAction={discardHomepageDraftAction}
              className="admin-btn"
              formNoValidate
            >
              Discard draft
            </button>
          ) : null}
        </div>
        <p className="text-xs text-neutral-500">
          Unsaved form changes are not a CMS draft until you click Save draft.
          Publish promotes the saved draft to the live Homepage.
        </p>
      </form>
    </div>
  );
}
