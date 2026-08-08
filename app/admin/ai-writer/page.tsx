import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import {
  getAIWriterDashboard,
  listAIProjects,
} from "@/lib/ai/editorial-service";
import { AIWriterSubnav } from "@/components/admin/ai-writer/AIWriterSubnav";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ status?: string; mode?: string; q?: string; linked?: string }>;
};

export default async function AIWriterIndexPage({ searchParams }: PageProps) {
  await requireAdminUser("use_ai_writer");
  const sp = await searchParams;
  const [dash, projects] = await Promise.all([
    getAIWriterDashboard(),
    listAIProjects({
      status: sp.status as never,
      mode: sp.mode as never,
      q: sp.q,
      linked: sp.linked as "linked" | "unlinked" | undefined,
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">AI Editorial Studio</h1>
          <p className="mt-1 max-w-2xl text-sm text-neutral-600">
            Research, plan, write and optimize useful Smartlance content with AI — while
            keeping publishing under editorial control.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/ai-writer/new"
            className="rounded bg-[#F47A48] px-4 py-2 text-sm text-white"
          >
            New project
          </Link>
          <Link
            href="/admin/ai-writer/discover"
            className="rounded border px-4 py-2 text-sm"
          >
            Topic Discovery
          </Link>
        </div>
      </div>

      <AIWriterSubnav current="/admin/ai-writer" />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Drafting" value={dash.drafting} />
        <Stat label="Needs review" value={dash.needsReview} />
        <Stat label="Approved for CMS" value={dash.approved} />
        <Stat label="Failed runs (7d)" value={dash.failedRuns} />
        <div className="rounded-lg border bg-white p-3 text-sm">
          <div className="text-xs text-neutral-500">Providers</div>
          <div className="mt-1">AI: {dash.provider.label}</div>
          <div>Research: {dash.research.label}</div>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-3 text-sm">
        <div className="text-xs text-neutral-500">Usage (tokens — not public analytics)</div>
        <div className="mt-1">
          Today: {dash.usageToday.runs} runs · {dash.usageToday.input + dash.usageToday.output} tokens
          · {dash.usageToday.failed} failed
        </div>
        <div>
          Month: {dash.usageMonth.runs} runs · {dash.usageMonth.input + dash.usageMonth.output} tokens
        </div>
        {dash.tokenWarning ? (
          <div className="mt-2 text-amber-800">{dash.tokenWarning}</div>
        ) : null}
        {dash.staleJobsRecovered > 0 ? (
          <div className="mt-1 text-amber-800">
            Recovered {dash.staleJobsRecovered} stale RUNNING job(s).
          </div>
        ) : null}
      </div>

      {!dash.provider.configured ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          AI provider is not configured. Existing Insights and Admin continue to work. Add an API key
          under{" "}
          <Link href="/admin/ai-writer/settings" className="underline">
            AI Writer → Settings
          </Link>{" "}
          (or set an env fallback key) to enable generation.
        </div>
      ) : null}

      <form className="flex flex-wrap gap-2 rounded-lg border bg-white p-3">
        <input
          name="q"
          defaultValue={sp.q || ""}
          placeholder="Search title, topic, Insight…"
          className="min-w-[200px] flex-1 rounded border px-3 py-2 text-sm"
        />
        <select name="status" defaultValue={sp.status || ""} className="rounded border px-3 py-2 text-sm">
          <option value="">All statuses</option>
          {[
            "IDEA",
            "RESEARCHING",
            "BRIEF_READY",
            "OUTLINE_READY",
            "DRAFTING",
            "DRAFT_READY",
            "NEEDS_REVIEW",
            "APPROVED_FOR_CMS",
            "ARCHIVED",
          ].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select name="mode" defaultValue={sp.mode || ""} className="rounded border px-3 py-2 text-sm">
          <option value="">All modes</option>
          {[
            "NEW_ARTICLE",
            "UPDATE_EXISTING",
            "BRIEF_ONLY",
            "OUTLINE_ONLY",
            "IMPROVE_DRAFT",
          ].map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select name="linked" defaultValue={sp.linked || ""} className="rounded border px-3 py-2 text-sm">
          <option value="">Linked any</option>
          <option value="linked">Linked Insight</option>
          <option value="unlinked">Unlinked</option>
        </select>
        <button type="submit" className="rounded border px-3 py-2 text-sm">
          Filter
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-neutral-50 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-3 py-2">Working title</th>
              <th className="px-3 py-2">Mode</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Topic</th>
              <th className="px-3 py-2">Created by</th>
              <th className="px-3 py-2">Updated</th>
              <th className="px-3 py-2">Linked Insight</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-neutral-500">
                  No editorial projects yet. Create one to start research → brief → draft.
                </td>
              </tr>
            ) : (
              projects.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="px-3 py-2">
                    <Link href={`/admin/ai-writer/${p.id}`} className="font-medium text-[#F47A48]">
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-xs">{p.mode}</td>
                  <td className="px-3 py-2">
                    <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs">{p.status}</span>
                  </td>
                  <td className="max-w-[220px] truncate px-3 py-2 text-neutral-600">
                    {p.workingTopic}
                  </td>
                  <td className="px-3 py-2 text-xs">{p.createdBy?.name || "—"}</td>
                  <td className="px-3 py-2 text-xs">
                    {p.updatedAt.toISOString().slice(0, 16).replace("T", " ")}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {p.linkedInsight ? (
                      <Link href={`/admin/insights/${p.linkedInsight.id}`} className="underline">
                        {p.linkedInsight.title}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
