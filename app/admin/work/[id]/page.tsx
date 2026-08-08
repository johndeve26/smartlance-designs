import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser, userCan } from "@/lib/admin/session";
import { getWorkByIdAdmin } from "@/lib/repositories/workRepository";
import {
  changeWorkSlugAction,
  publishWorkAction,
  saveWorkAction,
  unpublishWorkAction,
} from "@/lib/admin/phase3-actions";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { WorkAiPanel } from "@/components/admin/content-assistants/AiPanels";
import { ImproveFieldButton } from "@/components/admin/content-assistants/ImproveFieldButton";
import {
  hasEnoughProjectFacts,
  parseApprovedFacts,
} from "@/lib/ai/content-assistants/proof";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ opportunityId?: string }>;
};

export default async function AdminWorkEditorPage({
  params,
  searchParams,
}: PageProps) {
  const user = await requireAdminUser("edit_draft");
  const { id } = await params;
  const { opportunityId } = await searchParams;
  const item = await getWorkByIdAdmin(id);
  if (!item) notFound();
  const canPublish = userCan(user, "publish");
  const canSlug = userCan(user, "slug_redirect");
  const facts = parseApprovedFacts(item.approvedProjectFacts);
  const enoughFacts = hasEnoughProjectFacts(facts, item);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin/work" className="text-sm text-neutral-500">
          ← Work
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{item.name}</h1>
          <StatusBadge status={item.status} />
        </div>
      </div>

      <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Results/outcomes are optional. Only publish verified claims — never
        invent traffic, revenue, or ranking percentages.
      </div>

      <form action={saveWorkAction} className="space-y-4 rounded-lg border bg-white p-4">
        <input type="hidden" name="id" value={item.id} />
        <label className="block text-sm">Name<input name="name" defaultValue={item.name} className="mt-1 w-full rounded border px-3 py-2" required /></label>
        <label className="block text-sm">Slug<input name="slug" defaultValue={item.slug} className="mt-1 w-full rounded border px-3 py-2 font-mono text-sm" required /></label>
        <label className="block text-sm">Industry label<input name="industryLabel" defaultValue={item.industryLabel} className="mt-1 w-full rounded border px-3 py-2" required /></label>
        <label className="block text-sm">
          <span className="flex items-center justify-between gap-2">
            Short description
            <ImproveFieldButton entityType="WORK" entityId={item.id} field="shortDescription" />
          </span>
          <textarea name="shortDescription" defaultValue={item.shortDescription ?? ""} rows={2} className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block text-sm">
          <span className="flex items-center justify-between gap-2">
            Challenge
            <ImproveFieldButton entityType="WORK" entityId={item.id} field="challenge" />
          </span>
          <textarea name="challenge" defaultValue={item.challenge} rows={4} className="mt-1 w-full rounded border px-3 py-2" required />
        </label>
        <label className="block text-sm">
          <span className="flex items-center justify-between gap-2">
            Solution
            <ImproveFieldButton entityType="WORK" entityId={item.id} field="solution" />
          </span>
          <textarea name="solution" defaultValue={item.solution} rows={4} className="mt-1 w-full rounded border px-3 py-2" required />
        </label>
        <label className="block text-sm">
          <span className="flex items-center justify-between gap-2">
            Result summary (optional)
            <ImproveFieldButton
              entityType="WORK"
              entityId={item.id}
              field="resultSummary"
              label="Format verified results"
            />
          </span>
          <textarea name="resultSummary" defaultValue={item.resultSummary ?? ""} rows={2} className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block text-sm">Results JSON (optional)<textarea name="results" defaultValue={JSON.stringify(item.results ?? [], null, 2)} rows={4} className="mt-1 w-full rounded border px-3 py-2 font-mono text-xs" /></label>
        <label className="block text-sm">Services labels JSON<textarea name="servicesLabels" defaultValue={JSON.stringify(item.servicesLabels ?? [], null, 2)} rows={3} className="mt-1 w-full rounded border px-3 py-2 font-mono text-xs" /></label>
        <label className="block text-sm">Cover image path<input name="coverImagePath" defaultValue={item.coverImagePath ?? ""} className="mt-1 w-full rounded border px-3 py-2 font-mono text-xs" /></label>
        <label className="block text-sm">Hero image path<input name="heroImagePath" defaultValue={item.heroImagePath ?? ""} className="mt-1 w-full rounded border px-3 py-2 font-mono text-xs" /></label>
        <label className="block text-sm">
          <span className="flex items-center justify-between gap-2">
            SEO title
            <ImproveFieldButton entityType="WORK" entityId={item.id} field="seoTitle" />
          </span>
          <input name="seoTitle" defaultValue={item.seoTitle} className="mt-1 w-full rounded border px-3 py-2" required />
        </label>
        <label className="block text-sm">
          <span className="flex items-center justify-between gap-2">
            SEO description
            <ImproveFieldButton entityType="WORK" entityId={item.id} field="seoDescription" />
          </span>
          <textarea name="seoDescription" defaultValue={item.seoDescription} rows={2} className="mt-1 w-full rounded border px-3 py-2" required />
        </label>
        <label className="block text-sm">Related service hrefs JSON<textarea name="relatedServiceHrefs" defaultValue={JSON.stringify(item.relatedServiceHrefs ?? [], null, 2)} rows={3} className="mt-1 w-full rounded border px-3 py-2 font-mono text-xs" /></label>
        <label className="block text-sm">Industry IDs<input name="industryIds" defaultValue={item.industryLinks.map((l) => l.industryId).join(",")} className="mt-1 w-full rounded border px-3 py-2 font-mono text-xs" /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featured" defaultChecked={item.featured} /> Featured</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featuredHomepage" defaultChecked={item.featuredHomepage} /> Featured homepage</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featuredWorkArchive" defaultChecked={item.featuredWorkArchive} /> Featured work archive</label>

        <fieldset className="space-y-3 rounded border border-neutral-200 bg-neutral-50 p-3">
          <legend className="px-1 text-sm font-semibold text-neutral-900">
            Project source facts
          </legend>
          <p className="text-xs text-neutral-600">
            Internal — used only as approved generation context.{" "}
            <span className="font-medium">Not published.</span> Private notes
            are excluded unless you opt in below and keep facts structured here.
          </p>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="approvedForAI"
              defaultChecked={item.approvedForAI}
            />
            Approved for AI use
          </label>
          <label className="block text-sm">
            Approved project facts JSON
            <textarea
              name="approvedProjectFacts"
              defaultValue={JSON.stringify(
                item.approvedProjectFacts ?? {
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

        <button type="submit" className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white">Save draft</button>
      </form>

      <WorkAiPanel
        workId={item.id}
        user={user}
        status={item.status}
        enoughFacts={enoughFacts}
        approvedForAI={item.approvedForAI}
        opportunityId={opportunityId}
      />

      <div className="flex flex-wrap gap-3">
        <Link href={`/admin/preview/work/${item.id}`} className="rounded border px-4 py-2 text-sm" target="_blank">
          Preview
        </Link>
        {canPublish ? (
          <>
            <form action={publishWorkAction}><input type="hidden" name="id" value={item.id} /><button className="rounded bg-[#F47A48] px-4 py-2 text-sm text-white">Publish</button></form>
            <form action={unpublishWorkAction}><input type="hidden" name="id" value={item.id} /><button className="rounded border px-4 py-2 text-sm">Unpublish</button></form>
          </>
        ) : null}
      </div>

      {canSlug ? (
        <form action={changeWorkSlugAction} className="flex gap-2 rounded border bg-white p-4">
          <input type="hidden" name="id" value={item.id} />
          <input name="newSlug" defaultValue={item.slug} className="flex-1 rounded border px-3 py-2 font-mono text-sm" />
          <button type="submit" className="rounded border px-3 py-2 text-sm">Change slug + 301</button>
        </form>
      ) : null}
    </div>
  );
}
