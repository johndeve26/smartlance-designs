import type { CaseStudyContentV1 } from "@/lib/work/case-study-content";
import { JsonField } from "@/components/admin/JsonField";
import { WorkFieldHeader } from "@/components/admin/work/WorkFieldHeader";
import { MediaGalleryEditor } from "@/components/admin/media/MediaGalleryEditor";
import { ImproveFieldButton } from "@/components/admin/content-assistants/ImproveFieldButton";

type WorkCaseStudyFieldsProps = {
  workId: string;
  storageConfigured?: boolean;
  overview?: string | null;
  caseStudyKind: "website" | "product";
  clientName?: string | null;
  platformLabel?: string | null;
  year?: number | null;
  websiteUrl?: string | null;
  heroStatement?: string | null;
  heroEyebrow?: string | null;
  heroSupportingCopy?: string | null;
  externalLinkLabel?: string | null;
  platformContext?: string | null;
  outcomeHeading?: string | null;
  challenges?: unknown;
  approachSteps?: unknown;
  solutionPoints?: unknown;
  highlights?: unknown;
  content: CaseStudyContentV1 | null;
};

function fieldLabel(
  workId: string,
  label: string,
  field: string,
) {
  return <WorkFieldHeader label={label} workId={workId} field={field} />;
}

export function WorkCaseStudyFields({
  workId,
  storageConfigured = true,
  overview,
  caseStudyKind,
  clientName,
  platformLabel,
  year,
  websiteUrl,
  heroStatement,
  heroEyebrow,
  heroSupportingCopy,
  externalLinkLabel,
  platformContext,
  outcomeHeading,
  challenges,
  approachSteps,
  solutionPoints,
  highlights,
  content,
}: WorkCaseStudyFieldsProps) {
  const isProduct = caseStudyKind === "product";

  return (
    <fieldset className="space-y-4 rounded border border-neutral-200 bg-neutral-50 p-4">
      <legend className="px-1 text-sm font-semibold text-neutral-900">
        Case study
      </legend>
      <p className="text-xs text-neutral-600">
        Structured case study content saves as draft until you publish. Public
        pages keep the last published snapshot while you edit.
      </p>

      <label className="block text-sm">
        <WorkFieldHeader
          label="Case study kind"
          workId={workId}
          field="caseStudyKind"
          enableAi={false}
        />
        <select
          name="caseStudyKind"
          defaultValue={caseStudyKind}
          className="mt-1 w-full rounded border px-3 py-2"
        >
          <option value="website">Website case study</option>
          <option value="product">Product / SaaS case study</option>
        </select>
      </label>

      <div className="space-y-4 rounded border border-neutral-200 bg-white p-4">
        <div>
          <p className="text-sm font-medium text-neutral-900">The project</p>
          <p className="mt-1 text-xs text-neutral-600">
            Matches the public case study intro — eyebrow label &quot;The project&quot;,
            heading on the left, overview paragraphs on the right.
          </p>
        </div>

        <label className="block text-sm">
          {fieldLabel(workId, "Intro heading", "introHeading")}
          <input
            name="introHeading"
            defaultValue={content?.introHeading ?? ""}
            placeholder="Building more than an event ticketing website."
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>

        <label className="block text-sm">
          {fieldLabel(workId, "Overview", "overview")}
          <textarea
            name="overview"
            defaultValue={overview ?? ""}
            rows={6}
            placeholder="Intro paragraphs shown beside the heading on the case study page."
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
      </div>

      <div className="space-y-4 border-t border-neutral-200 pt-4">
        <p className="text-sm font-medium text-neutral-900">Gallery</p>
        <p className="text-xs text-neutral-600">
          {isProduct
            ? "Product case studies render gallery items from this structured list (src, alt, optional caption and layout)."
            : "Website case studies can also use the project gallery field in Overview. This structured gallery is used when the overview gallery is empty."}
        </p>
        <MediaGalleryEditor
          name="csGallery"
          label="Gallery items"
          defaultValue={content?.gallery}
          storageConfigured={storageConfigured}
          hint="Each item supports upload, browse, alt text, caption, and layout."
          header={
            <ImproveFieldButton entityType="WORK" entityId={workId} field="csGallery" />
          }
        />
      </div>

      <div className="space-y-4 rounded border border-neutral-200 bg-white p-4">
        <div>
          <p className="text-sm font-medium text-neutral-900">Hero & project details</p>
          <p className="mt-1 text-xs text-neutral-600">
            Shown in the case study hero metadata and visit-website button.
          </p>
        </div>

        <label className="block text-sm">
          <WorkFieldHeader
            label="Client name"
            workId={workId}
            field="clientName"
            enableAi={false}
          />
          <input
            name="clientName"
            defaultValue={clientName ?? ""}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>

        <label className="block text-sm">
          {fieldLabel(workId, "Platform label", "platformLabel")}
          <input
            name="platformLabel"
            defaultValue={platformLabel ?? ""}
            placeholder="Next.js + FastAPI"
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>

        <label className="block text-sm">
          <WorkFieldHeader label="Year" workId={workId} field="year" enableAi={false} />
          <input
            name="year"
            type="number"
            defaultValue={year ?? ""}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>

        <label className="block text-sm">
          <WorkFieldHeader
            label="Website URL"
            workId={workId}
            field="websiteUrl"
            enableAi={false}
          />
          <input
            name="websiteUrl"
            type="url"
            defaultValue={websiteUrl ?? ""}
            placeholder="https://example.com/"
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
      </div>

      <label className="block text-sm">
        {fieldLabel(workId, "Hero statement", "heroStatement")}
        <textarea
          name="heroStatement"
          defaultValue={heroStatement ?? ""}
          rows={3}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </label>

      <label className="block text-sm">
        {fieldLabel(workId, "Hero eyebrow", "heroEyebrow")}
        <input
          name="heroEyebrow"
          defaultValue={heroEyebrow ?? ""}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </label>

      <label className="block text-sm">
        {fieldLabel(workId, "Hero supporting copy", "heroSupportingCopy")}
        <textarea
          name="heroSupportingCopy"
          defaultValue={heroSupportingCopy ?? ""}
          rows={2}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </label>

      <label className="block text-sm">
        {fieldLabel(workId, "External link label", "externalLinkLabel")}
        <input
          name="externalLinkLabel"
          defaultValue={externalLinkLabel ?? ""}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </label>

      <label className="block text-sm">
        {fieldLabel(workId, "Solution intro", "solutionIntro")}
        <textarea
          name="solutionIntro"
          defaultValue={content?.solutionIntro ?? ""}
          rows={3}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </label>

      <JsonField
        name="challenges"
        label="Challenge points"
        defaultValue={challenges ?? []}
        hint="Array of { title, description } objects."
        rows={6}
        improveField="challenges"
        improveEntityId={workId}
      />

      <JsonField
        name="approachSteps"
        label="Approach steps"
        defaultValue={approachSteps ?? []}
        rows={6}
        improveField="approachSteps"
        improveEntityId={workId}
      />

      <JsonField
        name="solutionPoints"
        label="Solution points"
        defaultValue={solutionPoints ?? []}
        rows={6}
        improveField="solutionPoints"
        improveEntityId={workId}
      />

      <JsonField
        name="highlights"
        label="Highlights"
        defaultValue={highlights ?? []}
        hint="String array."
        rows={4}
        improveField="highlights"
        improveEntityId={workId}
      />

      <label className="block text-sm">
        {fieldLabel(workId, "Platform context", "platformContext")}
        <textarea
          name="platformContext"
          defaultValue={platformContext ?? ""}
          rows={2}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </label>

      <label className="block text-sm">
        {fieldLabel(workId, "Outcome heading", "outcomeHeading")}
        <input
          name="outcomeHeading"
          defaultValue={outcomeHeading ?? ""}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </label>

      <JsonField
        name="csSectionHeadings"
        label="Section headings"
        defaultValue={content?.sectionHeadings}
        hint="Optional overrides for section titles."
        rows={4}
        improveField="csSectionHeadings"
        improveEntityId={workId}
      />

      <JsonField
        name="csServiceLinks"
        label="Service links"
        defaultValue={content?.serviceLinks}
        hint="Include stable id, label, description, and optional href."
        rows={6}
        improveField="csServiceLinks"
        improveEntityId={workId}
      />

      {isProduct ? (
        <div className="space-y-4 border-t border-neutral-200 pt-4">
          <p className="text-sm font-medium text-neutral-900">
            Product case study sections
          </p>

          <label className="block text-sm">
            {fieldLabel(workId, "Engineering intro", "engineeringIntro")}
            <textarea
              name="engineeringIntro"
              defaultValue={content?.engineeringIntro ?? ""}
              rows={3}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </label>

          <JsonField
            name="csEngineeringStacks"
            label="Engineering stacks"
            defaultValue={content?.engineeringStacks}
            hint="Array of { id, category, items[] }."
            rows={8}
            improveField="csEngineeringStacks"
            improveEntityId={workId}
          />

          <JsonField
            name="csProductPrinciples"
            label="Product principles"
            defaultValue={content?.productPrinciples}
            hint="Array of { id, title, description }."
            rows={8}
            improveField="csProductPrinciples"
            improveEntityId={workId}
          />

          <JsonField
            name="csProductFeatures"
            label="Product features"
            defaultValue={content?.productFeatures}
            hint="Array of { id, title, heading, body, image? }."
            rows={10}
            improveField="csProductFeatures"
            improveEntityId={workId}
          />

          <JsonField
            name="csSaasInfrastructure"
            label="SaaS infrastructure"
            defaultValue={content?.saasInfrastructure}
            rows={8}
            improveField="csSaasInfrastructure"
            improveEntityId={workId}
          />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="showArchitectureDiagram"
              defaultChecked={content?.showArchitectureDiagram ?? false}
            />
            Show architecture diagram
          </label>

        </div>
      ) : null}

      <div className="space-y-4 border-t border-neutral-200 pt-4">
        <div>
          <p className="text-sm font-medium text-neutral-900">Bottom CTA</p>
          <p className="mt-1 text-xs text-neutral-600">
            Optional override for the closing call-to-action on the case study page.
            Leave empty to use the default copy for website or product case studies.
          </p>
        </div>
        <JsonField
          name="csCaseStudyCta"
          label="Case study CTA"
          defaultValue={content?.caseStudyCta}
          hint='Object with title, description, primaryLabel, primaryHref, secondaryLabel, secondaryHref.'
          rows={6}
          improveField="csCaseStudyCta"
          improveEntityId={workId}
        />
      </div>
    </fieldset>
  );
}
