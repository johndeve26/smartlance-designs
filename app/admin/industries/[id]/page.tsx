import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser, userCan } from "@/lib/admin/session";
import { getIndustryByIdAdmin } from "@/lib/repositories/industriesRepository";
import { listAllWorkAdmin } from "@/lib/repositories/workRepository";
import {
  publishIndustryAction,
  saveIndustryAction,
  unpublishIndustryAction,
} from "@/lib/admin/phase3-actions";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { SeoFields } from "@/components/admin/SeoFields";
import { IndustryAiPanel } from "@/components/admin/content-assistants/AiPanels";
import { ImproveFieldButton } from "@/components/admin/content-assistants/ImproveFieldButton";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ opportunityId?: string; aiAction?: string }>;
};

function IndustryEditorForm({
  item,
  work,
}: {
  item: NonNullable<Awaited<ReturnType<typeof getIndustryByIdAdmin>>>;
  work: Awaited<ReturnType<typeof listAllWorkAdmin>>;
}) {
  return (
    <form action={saveIndustryAction} className="space-y-4 rounded-lg border bg-white p-4">
      <input type="hidden" name="id" value={item.id} />
      <label className="block text-sm">
        Name
        <input name="name" defaultValue={item.name} className="mt-1 w-full rounded border px-3 py-2" required />
      </label>
      <label className="block text-sm">
        Slug
        <input name="slug" defaultValue={item.slug} className="mt-1 w-full rounded border px-3 py-2 font-mono text-sm" required />
      </label>
      <label className="block text-sm">
        <span className="flex flex-wrap items-center justify-between gap-2">
          Description
          <ImproveFieldButton
            entityType="INDUSTRY"
            entityId={item.id}
            field="description"
          />
        </span>
        <textarea name="description" defaultValue={item.description} rows={4} className="mt-1 w-full rounded border px-3 py-2" required />
      </label>
      <label className="block text-sm">
        Group
        <select name="group" defaultValue={item.group} className="mt-1 w-full rounded border px-3 py-2">
          <option value="proven">proven</option>
          <option value="supported">supported</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="hasVerifiedProjectExperience" defaultChecked={item.hasVerifiedProjectExperience} />
        Has verified project experience
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="featured" defaultChecked={item.featured} />
        Featured
      </label>
      <label className="block text-sm">
        Related Work IDs (comma-separated)
        <input
          name="workIds"
          defaultValue={item.workLinks.map((l) => l.work.id).join(",")}
          className="mt-1 w-full rounded border px-3 py-2 font-mono text-xs"
        />
      </label>
      <label className="block text-sm">
        Related solution slugs (JSON array)
        <input
          name="relatedSolutionSlugs"
          defaultValue={JSON.stringify(item.relatedSolutionSlugs ?? [])}
          className="mt-1 w-full rounded border px-3 py-2 font-mono text-xs"
        />
      </label>
      <label className="block text-sm">
        Icon
        <input
          name="icon"
          defaultValue={item.icon}
          placeholder="building"
          className="mt-1 w-full rounded border px-3 py-2 font-mono text-sm"
        />
        <span className="mt-1 block text-xs text-neutral-500">
          Lucide icon name used on the public industry page.
        </span>
      </label>
      <label className="block text-sm">
        Display order
        <input
          name="displayOrder"
          type="number"
          defaultValue={item.displayOrder}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Related service links (JSON array)
        <textarea
          name="relatedServiceLinks"
          defaultValue={JSON.stringify(item.relatedServiceLinks ?? [], null, 2)}
          rows={4}
          className="mt-1 w-full rounded border px-3 py-2 font-mono text-xs"
        />
        <span className="mt-1 block text-xs text-neutral-500">
          Objects with label, href, and optional description.
        </span>
      </label>
      <p className="text-xs text-neutral-500">
        Available work:{" "}
        {work.map((w) => `${w.name} (${w.id.slice(0, 8)})`).join(" · ")}
      </p>

      <SeoFields
        disabled={false}
        defaults={{
          seoTitle: item.seoTitle,
          seoDescription: item.seoDescription,
          ogTitle: item.ogTitle,
          ogDescription: item.ogDescription,
          ogImagePath: item.ogImagePath,
          noIndex: item.noIndex,
          canonicalOverride: item.canonicalOverride,
        }}
      />

      <button type="submit" className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
        Save draft
      </button>
    </form>
  );
}

export default async function AdminIndustryEditorPage({
  params,
  searchParams,
}: PageProps) {
  const user = await requireAdminUser("edit_draft");
  const { id } = await params;
  const sp = await searchParams;
  const item = await getIndustryByIdAdmin(id);
  if (!item) notFound();
  const work = await listAllWorkAdmin();
  const canPublish = userCan(user, "publish");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin/industries" className="text-sm text-neutral-500">
          ← Industries
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{item.name}</h1>
          <StatusBadge status={item.status} />
        </div>
        <p className="mt-2 text-sm text-neutral-600">
          Use Industry AI first to generate proposals, then edit CMS fields
          below when you are ready to save draft changes.
        </p>
      </div>

      {item.hasVerifiedProjectExperience && item.workLinks.length === 0 ? (
        <div className="rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Warning: verified project experience is set but no Work relations are
          linked.
        </div>
      ) : null}

      {!item.hasVerifiedProjectExperience ? (
        <div className="rounded border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
          Supported industry — Industry AI will not invent Smartlance project
          experience.
        </div>
      ) : null}

      <IndustryAiPanel
        industryId={item.id}
        user={user}
        status={item.status}
        opportunityId={sp.opportunityId}
        initialAction={sp.aiAction || "improve"}
        scrollOnMount={Boolean(sp.aiAction || sp.opportunityId)}
        verifiedExperience={
          item.hasVerifiedProjectExperience && item.group === "proven"
        }
      />

      <div>
        <h2 className="text-sm font-semibold text-neutral-900">CMS fields</h2>
        <p className="mt-1 text-xs text-neutral-500">
          Manual edits for name, slug, description, relations, and SEO.
        </p>
        <div className="mt-3">
          <IndustryEditorForm
            key={`${item.id}-${item.updatedAt.toISOString()}`}
            item={item}
            work={work}
          />
        </div>
      </div>

      {canPublish ? (
        <div className="flex flex-wrap gap-3">
          <form action={publishIndustryAction}>
            <input type="hidden" name="id" value={item.id} />
            <button type="submit" className="rounded bg-[#F47A48] px-4 py-2 text-sm font-medium text-white">
              Publish
            </button>
          </form>
          <form action={unpublishIndustryAction}>
            <input type="hidden" name="id" value={item.id} />
            <button type="submit" className="rounded border px-4 py-2 text-sm">
              Unpublish
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
