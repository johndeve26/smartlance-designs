import type { Service } from "@prisma/client";
import { JsonField } from "@/components/admin/JsonField";
import { SeoFields } from "@/components/admin/SeoFields";
import { ImproveFieldButton } from "@/components/admin/content-assistants/ImproveFieldButton";

export function ServiceFormFields({
  service,
  disabled,
  slugReadOnly = false,
  enableFieldAi = false,
}: {
  service: Service | null;
  disabled: boolean;
  slugReadOnly?: boolean;
  /** Show restrained Improve with AI on high-value prose fields */
  enableFieldAi?: boolean;
}) {
  const aiId = enableFieldAi && service?.id ? service.id : null;
  return (
    <fieldset disabled={disabled} className="space-y-4 border-0 p-0">
      <fieldset className="admin-fieldset">
        <legend className="admin-legend">Identity</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="admin-field">
            <span className="admin-label">Title</span>
            <input
              name="title"
              required
              className="admin-input"
              defaultValue={service?.title ?? ""}
            />
          </label>
          <label className="admin-field">
            <span className="admin-label">Short title</span>
            <input
              name="shortTitle"
              className="admin-input"
              defaultValue={service?.shortTitle ?? ""}
            />
          </label>
          <label className="admin-field">
            <span className="admin-label">Slug</span>
            <input
              name="slug"
              required
              className="admin-input"
              defaultValue={service?.slug ?? ""}
              readOnly={slugReadOnly}
            />
          </label>
          <label className="admin-field">
            <span className="admin-label">Href</span>
            <input
              name="href"
              className="admin-input"
              defaultValue={service?.href ?? ""}
              placeholder="/services/..."
            />
          </label>
          <label className="admin-field">
            <span className="admin-label">Icon</span>
            <input
              name="icon"
              className="admin-input"
              defaultValue={service?.icon ?? "layers"}
            />
          </label>
          <label className="admin-field">
            <span className="admin-label">Display order</span>
            <input
              type="number"
              name="displayOrder"
              className="admin-input"
              defaultValue={service?.displayOrder ?? 0}
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend className="admin-legend">Taxonomy</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="admin-field">
            <span className="admin-label">Category</span>
            <input
              name="category"
              className="admin-input"
              defaultValue={service?.category ?? ""}
            />
          </label>
          <label className="admin-field">
            <span className="admin-label">Group</span>
            <input
              name="group"
              className="admin-input"
              defaultValue={service?.group ?? ""}
            />
          </label>
          <label className="admin-field">
            <span className="admin-label">Visual variant</span>
            <input
              name="visualVariant"
              className="admin-input"
              defaultValue={service?.visualVariant ?? ""}
            />
          </label>
          <div className="flex flex-wrap gap-4 self-end pb-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="featured"
                value="true"
                defaultChecked={service?.featured}
              />
              Featured
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="navigationFeatured"
                value="true"
                defaultChecked={service?.navigationFeatured}
              />
              Nav featured
            </label>
          </div>
        </div>
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend className="admin-legend">Narrative</legend>
        <div className="grid gap-4">
          <label className="admin-field">
            <span className="admin-label flex flex-wrap items-center justify-between gap-2">
              Summary
              {aiId && (
                <ImproveFieldButton
                  entityType="SERVICE"
                  entityId={aiId}
                  field="summary"
                />
              )}
            </span>
            <textarea
              name="summary"
              required
              rows={2}
              className="admin-input"
              defaultValue={service?.summary ?? ""}
            />
          </label>
          <label className="admin-field">
            <span className="admin-label flex flex-wrap items-center justify-between gap-2">
              Description
              {aiId && (
                <ImproveFieldButton
                  entityType="SERVICE"
                  entityId={aiId}
                  field="description"
                />
              )}
            </span>
            <textarea
              name="description"
              required
              rows={4}
              className="admin-input"
              defaultValue={service?.description ?? ""}
            />
          </label>
          <label className="admin-field">
            <span className="admin-label flex flex-wrap items-center justify-between gap-2">
              Tagline
              {aiId && (
                <ImproveFieldButton
                  entityType="SERVICE"
                  entityId={aiId}
                  field="tagline"
                />
              )}
            </span>
            <input
              name="tagline"
              className="admin-input"
              defaultValue={service?.tagline ?? ""}
            />
          </label>
          <label className="admin-field">
            <span className="admin-label">Narrative title</span>
            <input
              name="narrativeTitle"
              className="admin-input"
              defaultValue={service?.narrativeTitle ?? ""}
            />
          </label>
          <label className="admin-field">
            <span className="admin-label flex flex-wrap items-center justify-between gap-2">
              Narrative
              {aiId && (
                <ImproveFieldButton
                  entityType="SERVICE"
                  entityId={aiId}
                  field="narrative"
                />
              )}
            </span>
            <textarea
              name="narrative"
              rows={4}
              className="admin-input"
              defaultValue={service?.narrative ?? ""}
            />
          </label>
          <label className="admin-field">
            <span className="admin-label">SEO connection</span>
            <textarea
              name="seoConnection"
              rows={3}
              className="admin-input"
              defaultValue={service?.seoConnection ?? ""}
            />
          </label>
          <label className="admin-field">
            <span className="admin-label">Audience</span>
            <input
              name="audience"
              className="admin-input"
              defaultValue={service?.audience ?? ""}
            />
          </label>
          <label className="admin-field">
            <span className="admin-label">Platforms note</span>
            <textarea
              name="platformsNote"
              rows={2}
              className="admin-input"
              defaultValue={service?.platformsNote ?? ""}
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend className="admin-legend">Structured JSON</legend>
        <div className="space-y-4">
          <JsonField
            name="capabilities"
            label="Capabilities"
            defaultValue={service?.capabilities}
            disabled={disabled}
          />
          <JsonField
            name="faqs"
            label="FAQs"
            defaultValue={service?.faqs}
            disabled={disabled}
          />
          <JsonField
            name="process"
            label="Process"
            defaultValue={service?.process}
            disabled={disabled}
          />
          <JsonField
            name="idealFor"
            label="Ideal for"
            defaultValue={service?.idealFor}
            disabled={disabled}
            rows={4}
          />
          <JsonField
            name="problems"
            label="Problems"
            defaultValue={service?.problems}
            disabled={disabled}
            rows={4}
          />
          <JsonField
            name="deliverables"
            label="Deliverables"
            defaultValue={service?.deliverables}
            disabled={disabled}
            rows={4}
          />
          <JsonField
            name="evaluationItems"
            label="Evaluation items"
            defaultValue={service?.evaluationItems}
            disabled={disabled}
            rows={4}
          />
          <JsonField
            name="relatedProjectSlugs"
            label="Related project slugs"
            defaultValue={service?.relatedProjectSlugs}
            disabled={disabled}
            rows={3}
          />
          <JsonField
            name="relatedServiceSlugs"
            label="Related service slugs"
            defaultValue={service?.relatedServiceSlugs}
            disabled={disabled}
            rows={3}
          />
          <JsonField
            name="relatedSeoSlugs"
            label="Related SEO slugs"
            defaultValue={service?.relatedSeoSlugs}
            disabled={disabled}
            rows={3}
          />
          <JsonField
            name="relatedPlatformSlugs"
            label="Related platform slugs"
            defaultValue={service?.relatedPlatformSlugs}
            disabled={disabled}
            rows={3}
          />
          <JsonField
            name="relatedSolutionSlugs"
            label="Related solution slugs"
            defaultValue={service?.relatedSolutionSlugs}
            disabled={disabled}
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
              defaultValue={service?.ctaTitle ?? ""}
            />
          </label>
          <label className="admin-field sm:col-span-2">
            <span className="admin-label">CTA description</span>
            <textarea
              name="ctaDescription"
              rows={2}
              className="admin-input"
              defaultValue={service?.ctaDescription ?? ""}
            />
          </label>
          <label className="admin-field">
            <span className="admin-label">Primary CTA label</span>
            <input
              name="primaryCtaLabel"
              className="admin-input"
              defaultValue={service?.primaryCtaLabel ?? ""}
            />
          </label>
          <label className="admin-field">
            <span className="admin-label">Primary CTA href</span>
            <input
              name="primaryCtaHref"
              className="admin-input"
              defaultValue={service?.primaryCtaHref ?? ""}
            />
          </label>
          <label className="admin-field">
            <span className="admin-label">Secondary CTA label</span>
            <input
              name="secondaryCtaLabel"
              className="admin-input"
              defaultValue={service?.secondaryCtaLabel ?? ""}
            />
          </label>
          <label className="admin-field">
            <span className="admin-label">Secondary CTA href</span>
            <input
              name="secondaryCtaHref"
              className="admin-input"
              defaultValue={service?.secondaryCtaHref ?? ""}
            />
          </label>
        </div>
      </fieldset>

      <SeoFields
        disabled={disabled}
        defaults={{
          seoTitle: service?.seoTitle,
          seoDescription: service?.seoDescription,
          ogTitle: service?.ogTitle,
          ogDescription: service?.ogDescription,
          ogImagePath: service?.ogImagePath,
          noIndex: service?.noIndex,
          canonicalOverride: service?.canonicalOverride,
        }}
      />
    </fieldset>
  );
}
