import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createPreviewToken } from "@/lib/admin/crypto";
import { requireAdminUser, userCan } from "@/lib/admin/session";
import { getSolutionByIdAdmin } from "@/lib/repositories/solutionsRepository";
import {
  changeSolutionSlugAction,
  publishSolutionAction,
  saveSolutionDraftAction,
  unpublishSolutionAction,
} from "@/lib/admin/content-actions";
import { PublishBar } from "@/components/admin/PublishBar";
import { JsonField } from "@/components/admin/JsonField";
import { SeoFields } from "@/components/admin/SeoFields";
import { SolutionAiPanel } from "@/components/admin/content-assistants/AiPanels";
import { ImproveFieldButton } from "@/components/admin/content-assistants/ImproveFieldButton";
import { AdminDetailHeader } from "@/components/admin/patterns/AdminDetailHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";

export const metadata: Metadata = {
  title: "Edit solution",
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

export default async function AdminSolutionEditPage({
  params,
  searchParams,
}: PageProps) {
  const user = await requireAdminUser();
  const { id } = await params;
  const sp = await searchParams;
  const solution = await getSolutionByIdAdmin(id);
  if (!solution) notFound();

  const canEdit = userCan(user, "edit_draft");
  const canPublish = userCan(user, "publish");
  const canSlug = userCan(user, "slug_redirect");
  const canPreview = userCan(user, "preview");

  const previewHref = canPreview
    ? `/admin/preview/solution/${solution.id}?preview=${encodeURIComponent(
        createPreviewToken("Solution", solution.id),
      )}`
    : undefined;

  let message: string | null = null;
  if (sp.saved) message = "Draft saved.";
  if (sp.published) message = "Published.";
  if (sp.unpublished) message = "Unpublished.";
  if (sp.slug) message = "Slug updated.";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <AdminDetailHeader
        title={solution.name}
        subtitle={`${solution.slug} · ${solution.id}`}
        secondaryActions={<StatusBadge status={solution.status} />}
      />

      <form className="space-y-4">
        <input type="hidden" name="id" value={solution.id} />
        <input type="hidden" name="slug" value={solution.slug} />

        <PublishBar
          status={solution.status}
          canEdit={canEdit}
          canPublish={canPublish}
          canSlug={canSlug}
          previewHref={previewHref}
          saveAction={saveSolutionDraftAction}
          publishAction={publishSolutionAction}
          unpublishAction={unpublishSolutionAction}
          slugAction={changeSolutionSlugAction}
          currentSlug={solution.slug}
          message={message}
        />

        <fieldset disabled={!canEdit} className="space-y-4 border-0 p-0">
          <fieldset className="admin-fieldset">
            <legend className="admin-legend">Catalogue</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="admin-field">
                <span className="admin-label">Name</span>
                <input
                  name="name"
                  className="admin-input"
                  defaultValue={solution.name}
                />
              </label>
              <label className="admin-field">
                <span className="admin-label">Title</span>
                <input
                  name="title"
                  className="admin-input"
                  defaultValue={solution.title}
                />
              </label>
              <label className="admin-field sm:col-span-2">
                <span className="admin-label flex flex-wrap items-center justify-between gap-2">
                  Short description
                  <ImproveFieldButton
                    entityType="SOLUTION"
                    entityId={solution.id}
                    field="shortDescription"
                  />
                </span>
                <textarea
                  name="shortDescription"
                  rows={3}
                  className="admin-input"
                  defaultValue={solution.shortDescription}
                />
              </label>
              <label className="admin-field">
                <span className="admin-label">Category</span>
                <input
                  name="category"
                  className="admin-input"
                  defaultValue={solution.category}
                />
              </label>
              <label className="admin-field">
                <span className="admin-label">Icon</span>
                <input
                  name="icon"
                  className="admin-input"
                  defaultValue={solution.icon}
                />
              </label>
              <label className="admin-field">
                <span className="admin-label">Display order</span>
                <input
                  type="number"
                  name="displayOrder"
                  className="admin-input"
                  defaultValue={solution.displayOrder}
                />
              </label>
              <label className="flex items-center gap-2 self-end pb-2 text-sm">
                <input
                  type="checkbox"
                  name="featured"
                  value="true"
                  defaultChecked={solution.featured}
                />
                Featured
              </label>
              <label className="admin-field">
                <span className="admin-label">Eyebrow</span>
                <input
                  name="eyebrow"
                  className="admin-input"
                  defaultValue={solution.eyebrow ?? ""}
                />
              </label>
              <label className="admin-field sm:col-span-2">
                <span className="admin-label flex flex-wrap items-center justify-between gap-2">
                  Hero statement
                  <ImproveFieldButton
                    entityType="SOLUTION"
                    entityId={solution.id}
                    field="heroStatement"
                  />
                </span>
                <textarea
                  name="heroStatement"
                  rows={2}
                  className="admin-input"
                  defaultValue={solution.heroStatement ?? ""}
                />
              </label>
              <label className="admin-field sm:col-span-2">
                <span className="admin-label">Hero supporting</span>
                <textarea
                  name="heroSupporting"
                  rows={2}
                  className="admin-input"
                  defaultValue={solution.heroSupporting ?? ""}
                />
              </label>
            </div>
          </fieldset>

          <fieldset className="admin-fieldset">
            <legend className="admin-legend">Relations & content JSON</legend>
            <div className="space-y-4">
              <label className="admin-field">
                <span className="admin-label">Page kind</span>
                <input
                  name="pageKind"
                  className="admin-input"
                  defaultValue={solution.pageKind ?? ""}
                  placeholder="leads | ranking | performance | ..."
                />
              </label>
              <JsonField
                name="pageContent"
                label="Page content"
                defaultValue={solution.pageContent}
                disabled={!canEdit}
                rows={12}
              />
              <JsonField
                name="problemSymptoms"
                label="Problem symptoms"
                defaultValue={solution.problemSymptoms}
                disabled={!canEdit}
                rows={4}
              />
              <JsonField
                name="possibleCauses"
                label="Possible causes"
                defaultValue={solution.possibleCauses}
                disabled={!canEdit}
                rows={4}
              />
              <JsonField
                name="whatWeReview"
                label="What we review"
                defaultValue={solution.whatWeReview}
                disabled={!canEdit}
                rows={4}
              />
              <JsonField
                name="process"
                label="Process"
                defaultValue={solution.process}
                disabled={!canEdit}
                rows={4}
              />
              <JsonField
                name="measurementPoints"
                label="Measurement points"
                defaultValue={solution.measurementPoints}
                disabled={!canEdit}
                rows={4}
              />
              <JsonField
                name="faqs"
                label="FAQs"
                defaultValue={solution.faqs}
                disabled={!canEdit}
                rows={4}
              />
              <JsonField
                name="relatedServiceHrefs"
                label="Related service hrefs"
                defaultValue={solution.relatedServiceHrefs}
                disabled={!canEdit}
                rows={3}
              />
              <JsonField
                name="relatedPlatformSlugs"
                label="Related platform slugs"
                defaultValue={solution.relatedPlatformSlugs}
                disabled={!canEdit}
                rows={3}
              />
              <JsonField
                name="relatedIndustrySlugs"
                label="Related industry slugs"
                defaultValue={solution.relatedIndustrySlugs}
                disabled={!canEdit}
                rows={3}
              />
              <JsonField
                name="relatedProjectSlugs"
                label="Related project slugs"
                defaultValue={solution.relatedProjectSlugs}
                disabled={!canEdit}
                rows={3}
              />
              <JsonField
                name="relatedArticleSlugs"
                label="Related article slugs"
                defaultValue={solution.relatedArticleSlugs}
                disabled={!canEdit}
                rows={3}
              />
              <JsonField
                name="relatedServiceReasons"
                label="Related service reasons"
                defaultValue={solution.relatedServiceReasons}
                disabled={!canEdit}
                rows={4}
              />
              <JsonField
                name="relatedSolutions"
                label="Related solutions"
                defaultValue={solution.relatedSolutions}
                disabled={!canEdit}
                rows={3}
              />
            </div>
          </fieldset>

          <fieldset className="admin-fieldset">
            <legend className="admin-legend">CTAs</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="admin-field sm:col-span-2">
                <span className="admin-label">CTA title</span>
                <input
                  name="ctaTitle"
                  className="admin-input"
                  defaultValue={solution.ctaTitle ?? ""}
                />
              </label>
              <label className="admin-field sm:col-span-2">
                <span className="admin-label">CTA description</span>
                <textarea
                  name="ctaDescription"
                  rows={2}
                  className="admin-input"
                  defaultValue={solution.ctaDescription ?? ""}
                />
              </label>
              <label className="admin-field">
                <span className="admin-label">Primary CTA label</span>
                <input
                  name="primaryCtaLabel"
                  className="admin-input"
                  defaultValue={solution.primaryCtaLabel ?? ""}
                />
              </label>
              <label className="admin-field">
                <span className="admin-label">Primary CTA href</span>
                <input
                  name="primaryCtaHref"
                  className="admin-input"
                  defaultValue={solution.primaryCtaHref ?? ""}
                />
              </label>
              <label className="admin-field">
                <span className="admin-label">Secondary CTA label</span>
                <input
                  name="secondaryCtaLabel"
                  className="admin-input"
                  defaultValue={solution.secondaryCtaLabel ?? ""}
                />
              </label>
              <label className="admin-field">
                <span className="admin-label">Secondary CTA href</span>
                <input
                  name="secondaryCtaHref"
                  className="admin-input"
                  defaultValue={solution.secondaryCtaHref ?? ""}
                />
              </label>
            </div>
          </fieldset>

          <SeoFields
            disabled={!canEdit}
            defaults={{
              seoTitle: solution.seoTitle,
              seoDescription: solution.seoDescription,
              ogTitle: solution.ogTitle,
              ogDescription: solution.ogDescription,
              ogImagePath: solution.ogImagePath,
              noIndex: solution.noIndex,
              canonicalOverride: solution.canonicalOverride,
            }}
          />
        </fieldset>
      </form>

      <div className="mt-6">
        <SolutionAiPanel
          solutionId={solution.id}
          user={user}
          status={solution.status}
          opportunityId={sp.opportunityId}
          initialAction={sp.aiAction}
        />
      </div>
    </div>
  );
}
