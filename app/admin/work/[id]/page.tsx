import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser, userCan } from "@/lib/admin/session";
import {
  effectiveWorkFields,
  getWorkByIdAdmin,
  hasWorkDraft,
} from "@/lib/repositories/workRepository";
import {
  changeWorkSlugAction,
  discardWorkDraftAction,
  previewWorkAction,
  publishWorkAction,
  saveWorkAction,
  unpublishWorkAction,
} from "@/lib/admin/phase3-actions";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { WorkCaseStudyFields } from "@/components/admin/WorkCaseStudyFields";
import { WorkAiPanel } from "@/components/admin/content-assistants/AiPanels";
import { WorkFieldHeader } from "@/components/admin/work/WorkFieldHeader";
import { JsonField } from "@/components/admin/JsonField";
import { MediaPicker } from "@/components/admin/media/MediaPicker";
import { MediaGalleryEditor } from "@/components/admin/media/MediaGalleryEditor";
import { SeoFields } from "@/components/admin/SeoFields";
import { isMediaStorageConfigured } from "@/lib/media/storage";
import { ImproveFieldButton } from "@/components/admin/content-assistants/ImproveFieldButton";
import {
  hasEnoughProjectFacts,
  parseApprovedFacts,
} from "@/lib/ai/content-assistants/proof";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    opportunityId?: string;
    saved?: string;
    published?: string;
    discarded?: string;
  }>;
};

export default async function AdminWorkEditorPage({
  params,
  searchParams,
}: PageProps) {
  const user = await requireAdminUser("edit_draft");
  const { id } = await params;
  const query = await searchParams;
  const item = await getWorkByIdAdmin(id);
  if (!item) notFound();

  const industryIds = item.industryLinks.map((link) => link.industryId);
  const fields = effectiveWorkFields(item, industryIds);
  const draftPending = hasWorkDraft(item);
  const canPublish = userCan(user, "publish");
  const canPreview = userCan(user, "preview");
  const canSlug = userCan(user, "slug_redirect");
  const facts = parseApprovedFacts(item.approvedProjectFacts);
  const enoughFacts = hasEnoughProjectFacts(facts, item);
  const storageConfigured = isMediaStorageConfigured();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin/work" className="text-sm text-neutral-500">
          ← Work
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{fields.name}</h1>
          <StatusBadge status={item.status} />
        </div>
        <div className="mt-3 rounded border border-neutral-200 bg-white px-3 py-2 text-sm">
          {item.status === "PUBLISHED" ? (
            <span className="font-medium text-emerald-800">Published</span>
          ) : (
            <span className="font-medium text-neutral-800">Not published</span>
          )}
          {" · "}
          {draftPending ? (
            <span className="font-medium text-amber-800">Draft changes saved</span>
          ) : (
            <span className="font-medium text-neutral-600">No unpublished changes</span>
          )}
          <p className="mt-0.5 text-xs text-neutral-500">
            Public Work uses the published snapshot until you publish.
          </p>
        </div>
      </div>

      {query.saved ? (
        <p className="text-sm text-emerald-700">
          Draft saved. Public listing and case study are unchanged until you publish.
        </p>
      ) : null}
      {query.published ? (
        <p className="text-sm text-emerald-700">Work published.</p>
      ) : null}
      {query.discarded ? (
        <p className="text-sm text-emerald-700">Draft discarded. Editor reset to published content.</p>
      ) : null}

      <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Results/outcomes are optional. Only publish verified claims — never
        invent traffic, revenue, or ranking percentages.
      </div>

      <form action={saveWorkAction} className="space-y-4 rounded-lg border bg-white p-4">
        <input type="hidden" name="id" value={item.id} />

        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-neutral-900">Overview</legend>
          <label className="block text-sm">
            <WorkFieldHeader label="Name" workId={item.id} field="name" enableAi={false} />
            <input name="name" defaultValue={fields.name} className="mt-1 w-full rounded border px-3 py-2" required />
          </label>
          <label className="block text-sm">
            <WorkFieldHeader label="Slug" workId={item.id} field="slug" enableAi={false} />
            <input name="slug" defaultValue={fields.slug} className="mt-1 w-full rounded border px-3 py-2 font-mono text-sm" required />
          </label>
          <label className="block text-sm">
            <WorkFieldHeader label="Industry label" workId={item.id} field="industryLabel" />
            <input name="industryLabel" defaultValue={fields.industryLabel} className="mt-1 w-full rounded border px-3 py-2" required />
          </label>
          <label className="block text-sm">
            <WorkFieldHeader label="Display order" workId={item.id} field="displayOrder" enableAi={false} />
            <input
              name="displayOrder"
              type="number"
              defaultValue={fields.displayOrder}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <WorkFieldHeader label="Short description" workId={item.id} field="shortDescription" />
            <textarea name="shortDescription" defaultValue={fields.shortDescription ?? ""} rows={2} className="mt-1 w-full rounded border px-3 py-2" />
          </label>
          <label className="block text-sm">
            <WorkFieldHeader label="Challenge" workId={item.id} field="challenge" />
            <textarea name="challenge" defaultValue={fields.challenge} rows={4} className="mt-1 w-full rounded border px-3 py-2" required />
          </label>
          <label className="block text-sm">
            <WorkFieldHeader label="Solution" workId={item.id} field="solution" />
            <textarea name="solution" defaultValue={fields.solution} rows={4} className="mt-1 w-full rounded border px-3 py-2" required />
          </label>
          <label className="block text-sm">
            <WorkFieldHeader
              label="Result summary (optional)"
              workId={item.id}
              field="resultSummary"
              aiLabel="Format verified results"
            />
            <textarea name="resultSummary" defaultValue={fields.resultSummary ?? ""} rows={2} className="mt-1 w-full rounded border px-3 py-2" />
          </label>
          <JsonField
            name="results"
            label="Results JSON (optional)"
            defaultValue={fields.results ?? []}
            rows={4}
            improveField="results"
            improveEntityId={item.id}
          />
          <JsonField
            name="measurableResults"
            label="Measurable results JSON (optional)"
            defaultValue={fields.measurableResults ?? []}
            hint="String array — merged with Results in the Outcome section."
            rows={4}
            improveField="measurableResults"
            improveEntityId={item.id}
          />
          <JsonField
            name="servicesLabels"
            label="Services labels JSON"
            defaultValue={fields.servicesLabels ?? []}
            rows={3}
            improveField="servicesLabels"
            improveEntityId={item.id}
          />
        </fieldset>

        <fieldset className="space-y-4 rounded border border-neutral-200 bg-white p-4">
          <legend className="text-sm font-semibold text-neutral-900">Media & gallery</legend>
          <div>
            <WorkFieldHeader
              label="Cover image"
              workId={item.id}
              field="coverImagePath"
              enableAi={false}
            />
            <MediaPicker
              name="coverImagePath"
              label="Cover image"
              hideLabel
              defaultValue={fields.coverImagePath}
              storageConfigured={storageConfigured}
            />
          </div>
          <label className="block text-sm">
            <WorkFieldHeader label="Cover image alt" workId={item.id} field="coverImageAlt" />
            <input name="coverImageAlt" defaultValue={fields.coverImageAlt ?? ""} className="mt-1 w-full rounded border px-3 py-2" />
          </label>
          <div>
            <WorkFieldHeader
              label="Hero image"
              workId={item.id}
              field="heroImagePath"
              enableAi={false}
            />
            <MediaPicker
              name="heroImagePath"
              label="Hero image"
              hideLabel
              defaultValue={fields.heroImagePath}
              storageConfigured={storageConfigured}
            />
          </div>
          <label className="block text-sm">
            <WorkFieldHeader label="Hero image alt" workId={item.id} field="heroImageAlt" />
            <input name="heroImageAlt" defaultValue={fields.heroImageAlt ?? ""} className="mt-1 w-full rounded border px-3 py-2" />
          </label>
          <MediaGalleryEditor
            name="gallery"
            label="Project gallery"
            defaultValue={fields.gallery ?? []}
            storageConfigured={storageConfigured}
            hint="Used on website case studies. Product case study galleries are edited under Case study → Gallery."
            header={
              <ImproveFieldButton entityType="WORK" entityId={item.id} field="gallery" />
            }
          />
        </fieldset>

        <WorkCaseStudyFields
          workId={item.id}
          storageConfigured={storageConfigured}
          overview={fields.overview}
          caseStudyKind={fields.caseStudyKind}
          clientName={fields.clientName}
          platformLabel={fields.platformLabel}
          year={fields.year}
          websiteUrl={fields.websiteUrl}
          heroStatement={fields.heroStatement}
          heroEyebrow={fields.heroEyebrow}
          heroSupportingCopy={fields.heroSupportingCopy}
          externalLinkLabel={fields.externalLinkLabel}
          platformContext={fields.platformContext}
          outcomeHeading={fields.outcomeHeading}
          challenges={fields.challenges}
          approachSteps={fields.approachSteps}
          solutionPoints={fields.solutionPoints}
          highlights={fields.highlights}
          content={fields.caseStudyContent}
        />

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-neutral-900">SEO & relationships</legend>
          <SeoFields
            defaults={{
              seoTitle: fields.seoTitle,
              seoDescription: fields.seoDescription,
              ogTitle: fields.ogTitle,
              ogDescription: fields.ogDescription,
              ogImagePath: fields.ogImagePath,
              noIndex: fields.noIndex,
              canonicalOverride: fields.canonicalOverride,
            }}
          />
          <JsonField
            name="relatedServiceHrefs"
            label="Related service hrefs JSON"
            defaultValue={fields.relatedServiceHrefs ?? []}
            rows={3}
            improveField="relatedServiceHrefs"
            improveEntityId={item.id}
          />
          <JsonField
            name="relatedWorkSlugs"
            label="Related work slugs JSON"
            defaultValue={fields.relatedWorkSlugs ?? []}
            hint='String array of project slugs, e.g. ["padeya", "freelance-os"].'
            rows={3}
            improveField="relatedWorkSlugs"
            improveEntityId={item.id}
          />
          <label className="block text-sm">
            <WorkFieldHeader label="Industry IDs" workId={item.id} field="industryIds" enableAi={false} />
            <input name="industryIds" defaultValue={fields.industryIds.join(",")} className="mt-1 w-full rounded border px-3 py-2 font-mono text-xs" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="featured" defaultChecked={fields.featured} /> Featured
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="featuredHomepage" defaultChecked={fields.featuredHomepage} /> Featured homepage
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="featuredWorkArchive" defaultChecked={fields.featuredWorkArchive} /> Featured work archive
          </label>
        </fieldset>

        <fieldset className="space-y-3 rounded border border-neutral-200 bg-neutral-50 p-3">
          <legend className="px-1 text-sm font-semibold text-neutral-900">
            Project source facts
          </legend>
          <p className="text-xs text-neutral-600">
            Internal — used only as approved generation context.{" "}
            <span className="font-medium">Not published.</span>
          </p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="approvedForAI" defaultChecked={fields.approvedForAI} />
            Approved for AI use
          </label>
          <label className="block text-sm">
            Approved project facts JSON
            <textarea
              name="approvedProjectFacts"
              defaultValue={JSON.stringify(
                fields.approvedProjectFacts ?? item.approvedProjectFacts ?? {
                  objective: "",
                  problem: "",
                  workCompleted: "",
                  deliverables: [],
                  technology: [],
                  platform: "",
                  clientContext: "",
                  outcome: "",
                  verifiedMetrics: [],
                },
                null,
                2,
              )}
              rows={12}
              className="mt-1 w-full rounded border px-3 py-2 font-mono text-xs"
            />
          </label>
        </fieldset>

        <div className="flex flex-wrap gap-3 border-t border-neutral-100 pt-4">
          <button type="submit" className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
            Save draft
          </button>
          {canPreview ? (
            <button type="submit" formAction={previewWorkAction} className="rounded border px-4 py-2 text-sm">
              Preview
            </button>
          ) : null}
          {canPublish ? (
            <button type="submit" formAction={publishWorkAction} className="rounded bg-[#F47A48] px-4 py-2 text-sm text-white">
              Publish
            </button>
          ) : null}
          {draftPending ? (
            <button type="submit" formAction={discardWorkDraftAction} className="rounded border px-4 py-2 text-sm">
              Discard draft
            </button>
          ) : null}
          {canPublish ? (
            <button type="submit" formAction={unpublishWorkAction} className="rounded border px-4 py-2 text-sm">
              Unpublish
            </button>
          ) : null}
        </div>
      </form>

      <WorkAiPanel
        workId={item.id}
        user={user}
        status={item.status}
        enoughFacts={enoughFacts}
        approvedForAI={item.approvedForAI}
        opportunityId={query.opportunityId}
      />

      {canSlug ? (
        <form action={changeWorkSlugAction} className="flex gap-2 rounded border bg-white p-4">
          <input type="hidden" name="id" value={item.id} />
          <input name="newSlug" defaultValue={fields.slug} className="flex-1 rounded border px-3 py-2 font-mono text-sm" />
          <button type="submit" className="rounded border px-3 py-2 text-sm">
            Change slug + 301 (published only)
          </button>
        </form>
      ) : null}
    </div>
  );
}
