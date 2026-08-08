import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createPreviewToken } from "@/lib/admin/crypto";
import { requireAdminUser, userCan } from "@/lib/admin/session";
import { getPlatformByIdAdmin } from "@/lib/repositories/platformsRepository";
import {
  changePlatformSlugAction,
  publishPlatformAction,
  savePlatformDraftAction,
  unpublishPlatformAction,
} from "@/lib/admin/content-actions";
import { PublishBar } from "@/components/admin/PublishBar";
import { JsonField } from "@/components/admin/JsonField";
import { SeoFields } from "@/components/admin/SeoFields";
import { PlatformAiPanel } from "@/components/admin/content-assistants/AiPanels";
import { ImproveFieldButton } from "@/components/admin/content-assistants/ImproveFieldButton";

export const metadata: Metadata = {
  title: "Edit platform",
};

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    saved?: string;
    published?: string;
    unpublished?: string;
    slug?: string;
    opportunityId?: string;
    aiAction?: string;
  }>;
};

export default async function AdminPlatformEditPage({
  params,
  searchParams,
}: PageProps) {
  const user = await requireAdminUser();
  const { id } = await params;
  const sp = await searchParams;
  const platform = await getPlatformByIdAdmin(id);
  if (!platform) notFound();

  const canEdit = userCan(user, "edit_draft");
  const canPublish = userCan(user, "publish");
  const canSlug = userCan(user, "slug_redirect");
  const canPreview = userCan(user, "preview");

  const previewHref = canPreview
    ? `/admin/preview/platform/${platform.id}?preview=${encodeURIComponent(
        createPreviewToken("Platform", platform.id),
      )}`
    : undefined;

  let message: string | null = null;
  if (sp.saved) message = "Draft saved.";
  if (sp.published) message = "Published.";
  if (sp.unpublished) message = "Unpublished.";
  if (sp.slug) message = "Slug updated.";

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <h1 className="admin-page-title">{platform.name}</h1>
        <p className="mt-1 font-mono text-xs text-neutral-500">
          {platform.slug} · {platform.id}
        </p>
      </div>

      <form className="space-y-4">
        <input type="hidden" name="id" value={platform.id} />

        <PublishBar
          status={platform.status}
          canEdit={canEdit}
          canPublish={canPublish}
          canSlug={canSlug}
          previewHref={previewHref}
          saveAction={savePlatformDraftAction}
          publishAction={publishPlatformAction}
          unpublishAction={unpublishPlatformAction}
          slugAction={changePlatformSlugAction}
          currentSlug={platform.slug}
          message={message}
        />

        <fieldset disabled={!canEdit} className="space-y-4 border-0 p-0">
          <fieldset className="admin-fieldset">
            <legend className="admin-legend">Identity</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="admin-field">
                <span className="admin-label">Name</span>
                <input
                  name="name"
                  className="admin-input"
                  defaultValue={platform.name}
                />
              </label>
              <label className="admin-field">
                <span className="admin-label">Title</span>
                <input
                  name="title"
                  className="admin-input"
                  defaultValue={platform.title}
                />
              </label>
              <label className="admin-field">
                <span className="admin-label">Slug</span>
                <input
                  name="slug"
                  className="admin-input"
                  defaultValue={platform.slug}
                  readOnly
                />
              </label>
              <label className="admin-field">
                <span className="admin-label">Href</span>
                <input
                  name="href"
                  className="admin-input"
                  defaultValue={platform.href}
                />
              </label>
              <label className="admin-field">
                <span className="admin-label">Icon</span>
                <input
                  name="icon"
                  className="admin-input"
                  defaultValue={platform.icon}
                />
              </label>
              <label className="admin-field">
                <span className="admin-label">Group</span>
                <input
                  name="group"
                  className="admin-input"
                  defaultValue={platform.group}
                />
              </label>
              <label className="admin-field">
                <span className="admin-label">Prominence</span>
                <input
                  name="prominence"
                  className="admin-input"
                  defaultValue={platform.prominence ?? ""}
                />
              </label>
              <label className="admin-field">
                <span className="admin-label">Display order</span>
                <input
                  type="number"
                  name="displayOrder"
                  className="admin-input"
                  defaultValue={platform.displayOrder}
                />
              </label>
              <label className="admin-field sm:col-span-2">
                <span className="admin-label">Platform match</span>
                <textarea
                  name="platformMatch"
                  rows={2}
                  className="admin-input"
                  defaultValue={platform.platformMatch}
                />
              </label>
              <label className="admin-field sm:col-span-2">
                <span className="admin-label flex flex-wrap items-center justify-between gap-2">
                  Summary
                  <ImproveFieldButton
                    entityType="PLATFORM"
                    entityId={platform.id}
                    field="summary"
                  />
                </span>
                <textarea
                  name="summary"
                  rows={2}
                  className="admin-input"
                  defaultValue={platform.summary}
                />
              </label>
              <label className="admin-field sm:col-span-2">
                <span className="admin-label flex flex-wrap items-center justify-between gap-2">
                  Description
                  <ImproveFieldButton
                    entityType="PLATFORM"
                    entityId={platform.id}
                    field="description"
                  />
                </span>
                <textarea
                  name="description"
                  rows={4}
                  className="admin-input"
                  defaultValue={platform.description}
                />
              </label>
              <label className="admin-field sm:col-span-2">
                <span className="admin-label">Tagline</span>
                <input
                  name="tagline"
                  className="admin-input"
                  defaultValue={platform.tagline ?? ""}
                />
              </label>
              <div className="flex flex-wrap gap-4 text-sm sm:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="featured"
                    value="true"
                    defaultChecked={platform.featured}
                  />
                  Featured
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="navigationFeatured"
                    value="true"
                    defaultChecked={platform.navigationFeatured}
                  />
                  Nav featured
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="verifiedExperience"
                    value="true"
                    defaultChecked={platform.verifiedExperience}
                  />
                  Verified experience
                </label>
              </div>
            </div>
          </fieldset>

          <fieldset className="admin-fieldset">
            <legend className="admin-legend">Structured JSON</legend>
            <div className="space-y-4">
              <JsonField
                name="audiences"
                label="Audiences"
                defaultValue={platform.audiences}
                disabled={!canEdit}
                rows={4}
              />
              <JsonField
                name="capabilities"
                label="Capabilities"
                defaultValue={platform.capabilities}
                disabled={!canEdit}
              />
              <JsonField
                name="whenItFits"
                label="When it fits"
                defaultValue={platform.whenItFits}
                disabled={!canEdit}
                rows={4}
              />
              <JsonField
                name="challenges"
                label="Challenges"
                defaultValue={platform.challenges}
                disabled={!canEdit}
                rows={4}
              />
              <JsonField
                name="seoSection"
                label="SEO section"
                defaultValue={platform.seoSection}
                disabled={!canEdit}
                rows={6}
              />
              <JsonField
                name="faqs"
                label="FAQs"
                defaultValue={platform.faqs}
                disabled={!canEdit}
                rows={4}
              />
              <JsonField
                name="relatedServiceHrefs"
                label="Related service hrefs"
                defaultValue={platform.relatedServiceHrefs}
                disabled={!canEdit}
                rows={3}
              />
              <JsonField
                name="relatedSeoHrefs"
                label="Related SEO hrefs"
                defaultValue={platform.relatedSeoHrefs}
                disabled={!canEdit}
                rows={3}
              />
            </div>
          </fieldset>

          <fieldset className="admin-fieldset">
            <legend className="admin-legend">Notes & CTAs</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="admin-field sm:col-span-2">
                <span className="admin-label">Legacy URL</span>
                <input
                  name="legacyUrl"
                  className="admin-input"
                  defaultValue={platform.legacyUrl ?? ""}
                />
              </label>
              <label className="admin-field sm:col-span-2">
                <span className="admin-label">Conversion note</span>
                <textarea
                  name="conversionNote"
                  rows={2}
                  className="admin-input"
                  defaultValue={platform.conversionNote ?? ""}
                />
              </label>
              <label className="admin-field sm:col-span-2">
                <span className="admin-label">Migration note</span>
                <textarea
                  name="migrationNote"
                  rows={2}
                  className="admin-input"
                  defaultValue={platform.migrationNote ?? ""}
                />
              </label>
              <label className="admin-field sm:col-span-2">
                <span className="admin-label">CTA title</span>
                <input
                  name="ctaTitle"
                  className="admin-input"
                  defaultValue={platform.ctaTitle ?? ""}
                />
              </label>
              <label className="admin-field sm:col-span-2">
                <span className="admin-label">CTA description</span>
                <textarea
                  name="ctaDescription"
                  rows={2}
                  className="admin-input"
                  defaultValue={platform.ctaDescription ?? ""}
                />
              </label>
            </div>
          </fieldset>

          <SeoFields
            disabled={!canEdit}
            defaults={{
              seoTitle: platform.seoTitle,
              seoDescription: platform.seoDescription,
              ogTitle: platform.ogTitle,
              ogDescription: platform.ogDescription,
              ogImagePath: platform.ogImagePath,
              noIndex: platform.noIndex,
              canonicalOverride: platform.canonicalOverride,
            }}
          />
        </fieldset>
      </form>

      <div className="mt-6">
        <PlatformAiPanel
          platformId={platform.id}
          user={user}
          status={platform.status}
          lastReviewedAt={platform.lastReviewedAt}
          opportunityId={sp.opportunityId}
          initialAction={sp.aiAction}
        />
      </div>
    </div>
  );
}
