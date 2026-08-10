import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser, userCan } from "@/lib/admin/session";
import {
  getAIProject,
  getProjectBlockerSummary,
  getProjectCostSummary,
} from "@/lib/ai/editorial-service";
import { staleLabel } from "@/lib/ai/stale";
import { getAIProviderStatus } from "@/lib/ai/providers";
import {
  addSourceAction,
  approveForCmsAction,
  archiveProjectAction,
  createInsightFromAiAction,
  duplicateProjectAction,
  runBriefAction,
  runCannibalizationAction,
  runDraftAction,
  runFactCheckAction,
  runInternalLinksAction,
  runOutlineAction,
  runQualityAction,
  runResearchAction,
  runSeoAiSearchAction,
  saveDraftAction,
  saveOutlineAction,
  toggleSourceAction,
  updateProjectMetaAction,
} from "@/lib/admin/ai-writer-actions";
import { PageHeader } from "@/components/ui/page-header";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function AIProjectPage({ params }: PageProps) {
  const user = await requireAdminUser("use_ai_writer");
  const { id } = await params;
  const project = await getAIProject(id);
  if (!project) notFound();
  const provider = await getAIProviderStatus();
  const canApprove = userCan(user, "approve_ai_cms");
  const { blockers, headline, blockerCount, warningCount } = getProjectBlockerSummary(project);
  const usage = await getProjectCostSummary(project.id);

  const findings = (list: unknown) => {
    const arr = (list as { findings?: Array<{ severity: string; message: string; category?: string }> })?.findings;
    return Array.isArray(arr) ? arr : [];
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        title={project.title}
        description={
          <>
            <Link href="/admin/ai-writer" className="text-accent-text hover:underline">
              ← AI Writer
            </Link>
            <span className="mt-2 block">
              {project.mode} · <span className="font-mono text-xs">{project.status}</span>
              {project.approvedAt ? (
                <> · Approved {project.approvedAt.toISOString().slice(0, 16)}</>
              ) : null}
              {project.linkedInsight ? (
                <>
                  {" "}
                  · Linked:{" "}
                  <Link
                    href={`/admin/insights/${project.linkedInsight.id}`}
                    className="underline"
                  >
                    {project.linkedInsight.title}
                  </Link>
                </>
              ) : null}
            </span>
          </>
        }
        action={
          <div className="flex flex-wrap gap-2">
            <form action={duplicateProjectAction}>
              <input type="hidden" name="id" value={project.id} />
              <button className="rounded-md border border-border px-3 py-2 text-sm">Duplicate</button>
            </form>
            <form action={archiveProjectAction}>
              <input type="hidden" name="id" value={project.id} />
              <button className="rounded-md border border-border px-3 py-2 text-sm">Archive</button>
            </form>
          </div>
        }
      />

      <div
        className={`rounded-lg border px-4 py-3 text-sm ${
          blockerCount > 0
            ? "border-red-300 bg-red-50 text-red-900"
            : "border-emerald-300 bg-emerald-50 text-emerald-900"
        }`}
      >
        <strong>{headline}</strong>
        {warningCount > 0 ? ` · ${warningCount} warning(s)` : null}
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {blockers.slice(0, 12).map((b) => (
            <li key={b.id}>
              <span className="font-mono text-xs">{b.severity}</span> [{b.category}] {b.message}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border bg-white px-4 py-3 text-xs text-neutral-600">
        Usage: {usage.runs} runs · tokens in/out {usage.input}/{usage.output}
        {usage.pricingConfigured && usage.approxCostUsd != null
          ? ` · approx $${usage.approxCostUsd.toFixed(4)}`
          : " · approx cost Not Available (configure modelPricingJson)"}
      </div>

      {!provider.configured ? (
        <div className="rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm">
          AI Provider: Not Configured — generation actions will fail until a key is set in{" "}
          <Link href="/admin/ai-writer/settings" className="underline">
            Settings
          </Link>
          . CMS remains available.
        </div>
      ) : null}

      {project.commodityWarning ? (
        <div className="rounded border border-amber-400 bg-amber-50 px-4 py-3 text-sm">
          Commodity content warning — a successful outcome may be recommending not to create this
          article.
        </div>
      ) : null}

      <section className="space-y-3 rounded-lg border bg-white p-4">
        <h2 className="text-lg font-medium">1. Topic & goal</h2>
        <form action={updateProjectMetaAction} className="space-y-3">
          <input type="hidden" name="id" value={project.id} />
          <label className="block text-sm">
            Title
            <input name="title" defaultValue={project.title} className="mt-1 w-full rounded border px-3 py-2" />
          </label>
          <label className="block text-sm">
            Working topic
            <textarea name="workingTopic" defaultValue={project.workingTopic} rows={2} className="mt-1 w-full rounded border px-3 py-2" />
          </label>
          <label className="block text-sm">
            Unique value statement
            <textarea name="uniqueValue" defaultValue={project.uniqueValue || ""} rows={2} className="mt-1 w-full rounded border px-3 py-2" placeholder="Why should this article exist?" />
          </label>
          <label className="block text-sm">
            Citation mode
            <select name="citationMode" defaultValue={project.citationMode} className="mt-1 w-full rounded border px-3 py-2">
              <option value="RESEARCH_ONLY">Research only</option>
              <option value="VISIBLE_CITATIONS">Visible citations</option>
            </select>
          </label>
          <label className="block text-sm">
            Audience
            <input name="targetAudience" defaultValue={project.targetAudience || ""} className="mt-1 w-full rounded border px-3 py-2" />
          </label>
          <label className="block text-sm">
            Business goal
            <input name="businessGoal" defaultValue={project.businessGoal || ""} className="mt-1 w-full rounded border px-3 py-2" />
          </label>
          <label className="block text-sm">
            Primary query
            <input name="primaryQuery" defaultValue={project.primaryQuery || ""} className="mt-1 w-full rounded border px-3 py-2" />
          </label>
          <label className="block text-sm">
            Notes
            <textarea name="notes" defaultValue={project.notes || ""} rows={2} className="mt-1 w-full rounded border px-3 py-2" />
          </label>
          <button type="submit" className="rounded bg-neutral-900 px-3 py-2 text-sm text-white">
            Save
          </button>
        </form>
      </section>

      <section className="space-y-3 rounded-lg border bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-medium">2. Existing content check</h2>
          <form action={runCannibalizationAction}>
            <input type="hidden" name="id" value={project.id} />
            <button className="rounded border px-3 py-2 text-sm">Run overlap check</button>
          </form>
        </div>
        <pre className="max-h-64 overflow-auto rounded bg-neutral-50 p-3 text-xs">
          {JSON.stringify(project.cannibalization || { note: "Not run yet" }, null, 2)}
        </pre>
      </section>

      <section className="space-y-3 rounded-lg border bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-medium">3. Research & sources</h2>
          <form action={runResearchAction}>
            <input type="hidden" name="id" value={project.id} />
            <button className="rounded border px-3 py-2 text-sm">Run research</button>
          </form>
        </div>
        <pre className="max-h-48 overflow-auto rounded bg-neutral-50 p-3 text-xs">
          {JSON.stringify(project.researchJson || { note: "No research notes yet" }, null, 2)}
        </pre>
        <ul className="space-y-2">
          {project.sources.map((s) => (
            <li key={s.id} className="flex flex-wrap items-start justify-between gap-2 rounded border px-3 py-2 text-sm">
              <div className="min-w-0 flex-1">
                <a href={s.url} target="_blank" rel="noreferrer" className="font-medium text-[#F47A48] break-all">
                  {s.title || s.url}
                </a>
                <div className="text-xs text-neutral-500">
                  {s.sourceType} · {s.selected ? "selected" : "deselected"}
                </div>
                {s.snippet ? <p className="mt-1 text-xs text-neutral-600">{s.snippet}</p> : null}
              </div>
              <form action={toggleSourceAction}>
                <input type="hidden" name="sourceId" value={s.id} />
                <input type="hidden" name="selected" value={s.selected ? "0" : "1"} />
                <button className="rounded border px-2 py-1 text-xs">
                  {s.selected ? "Deselect" : "Select"}
                </button>
              </form>
            </li>
          ))}
        </ul>
        <form action={addSourceAction} className="flex flex-wrap gap-2 border-t pt-3">
          <input type="hidden" name="id" value={project.id} />
          <input name="url" required placeholder="https://…" className="min-w-[240px] flex-1 rounded border px-3 py-2 text-sm" />
          <input name="title" placeholder="Title" className="rounded border px-3 py-2 text-sm" />
          <button className="rounded border px-3 py-2 text-sm">Add source</button>
        </form>
      </section>

      <section className="space-y-3 rounded-lg border bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-medium">4. Content brief</h2>
          <form action={runBriefAction}>
            <input type="hidden" name="id" value={project.id} />
            <button className="rounded border px-3 py-2 text-sm">Generate brief</button>
          </form>
        </div>
        <pre className="max-h-72 overflow-auto rounded bg-neutral-50 p-3 text-xs">
          {JSON.stringify(project.briefJson || { note: "No brief yet" }, null, 2)}
        </pre>
      </section>

      <section className="space-y-3 rounded-lg border bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-medium">5. Outline</h2>
          <form action={runOutlineAction}>
            <input type="hidden" name="id" value={project.id} />
            <button className="rounded border px-3 py-2 text-sm">Generate outline</button>
          </form>
        </div>
        <form action={saveOutlineAction} className="space-y-2">
          <input type="hidden" name="id" value={project.id} />
          <textarea
            name="outlineJson"
            rows={14}
            defaultValue={JSON.stringify(project.outlineJson || { title: project.title, sections: [] }, null, 2)}
            className="w-full rounded border px-3 py-2 font-mono text-xs"
          />
          <button className="rounded border px-3 py-2 text-sm">Save outline JSON</button>
        </form>
      </section>

      <section className="space-y-3 rounded-lg border bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-medium">6. Draft</h2>
          <form action={runDraftAction}>
            <input type="hidden" name="id" value={project.id} />
            <button className="rounded bg-[#F47A48] px-3 py-2 text-sm text-white">
              Generate full draft
            </button>
          </form>
        </div>
        <form action={saveDraftAction} className="space-y-2">
          <input type="hidden" name="id" value={project.id} />
          <textarea
            name="draftMarkdown"
            rows={28}
            defaultValue={project.draftMarkdown || ""}
            className="w-full rounded border px-3 py-2 font-mono text-xs"
            placeholder="Markdown draft appears here — editable before CMS handoff."
          />
          <button className="rounded border px-3 py-2 text-sm">Save draft</button>
        </form>
      </section>

      <section className="space-y-3 rounded-lg border bg-white p-4">
        <div className="flex flex-wrap gap-2">
          <form action={runFactCheckAction}>
            <input type="hidden" name="id" value={project.id} />
            <button className="rounded border px-3 py-2 text-sm">
              7. Fact check{staleLabel(project.analysisStale, "factCheck") ? " · Needs rerun" : ""}
            </button>
          </form>
          <form action={runSeoAiSearchAction}>
            <input type="hidden" name="id" value={project.id} />
            <button className="rounded border px-3 py-2 text-sm">
              8. SEO + AI Search
              {staleLabel(project.analysisStale, "seo") || staleLabel(project.analysisStale, "aiSearch")
                ? " · Needs rerun"
                : ""}
            </button>
          </form>
          <form action={runInternalLinksAction}>
            <input type="hidden" name="id" value={project.id} />
            <button className="rounded border px-3 py-2 text-sm">
              9. Internal links
              {staleLabel(project.analysisStale, "internalLinks") ? " · Needs rerun" : ""}
            </button>
          </form>
          <form action={runQualityAction}>
            <input type="hidden" name="id" value={project.id} />
            <button className="rounded border px-3 py-2 text-sm">
              10. Editorial review
              {staleLabel(project.analysisStale, "quality") ? " · Needs rerun" : ""}
            </button>
          </form>
        </div>

        <h3 className="text-sm font-medium">Claim ledger</h3>
        {project.claims.length === 0 ? (
          <p className="text-sm text-neutral-500">No claims extracted yet.</p>
        ) : (
          <ul className="space-y-2">
            {project.claims.map((c) => (
              <li key={c.id} className="rounded border px-3 py-2 text-sm">
                <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs">{c.support}</span>
                <p className="mt-1">{c.claimText}</p>
                {c.sources?.length ? (
                  <ul className="mt-1 text-xs text-neutral-600">
                    {c.sources.map((link) => (
                      <li key={`${c.id}-${link.sourceId}`}>
                        {link.evidenceStrength}: {link.evidenceSummary || link.source?.url || link.sourceId}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        <ReviewBlock
          title={`SEO review${staleLabel(project.analysisStale, "seo") ? " (Needs rerun)" : ""}`}
          items={findings(project.seoJson)}
        />
        <ReviewBlock
          title={`AI Search review${staleLabel(project.analysisStale, "aiSearch") ? " (Needs rerun)" : ""}`}
          items={findings(project.aiSearchJson)}
          extra={project.aiSearchJson}
        />
        <ReviewBlock
          title={`Quality review${staleLabel(project.analysisStale, "quality") ? " (Needs rerun)" : ""}`}
          items={findings(project.qualityReviewJson)}
        />
        <pre className="max-h-48 overflow-auto rounded bg-neutral-50 p-3 text-xs">
          Internal links: {JSON.stringify(project.internalLinksJson || {}, null, 2)}
        </pre>
      </section>

      <section className="space-y-3 rounded-lg border bg-white p-4">
        <h2 className="text-lg font-medium">11. Human review → Insight draft</h2>
        <p className="mt-1 text-sm text-neutral-600">
          AI never auto-publishes. Checkboxes do not bypass server validation.
        </p>
        {canApprove ? (
          <form action={approveForCmsAction} className="space-y-3">
            <input type="hidden" name="id" value={project.id} />
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" name="checklistConfirmed" required className="mt-1" />
              <span>
                I confirm: factual blockers cleared · sources reviewed · internal links reviewed ·
                metadata reviewed · unique value confirmed · human editorial review completed.
              </span>
            </label>
            <input
              name="overrideReason"
              placeholder="Override reason (non-security blockers only)"
              className="w-full rounded border px-3 py-2 text-sm"
            />
            <button className="rounded bg-neutral-900 px-3 py-2 text-sm text-white">
              Approve for CMS
            </button>
          </form>
        ) : null}
        <form action={createInsightFromAiAction}>
          <input type="hidden" name="id" value={project.id} />
          <button
            className="rounded bg-[#F47A48] px-4 py-2 text-sm text-white disabled:opacity-50"
            disabled={project.status !== "APPROVED_FOR_CMS"}
          >
            Create Insight draft
          </button>
        </form>
      </section>

      <section className="rounded-lg border bg-white p-4">
        <h2 className="text-lg font-medium">Run history</h2>
        <ul className="mt-2 space-y-1 text-xs">
          {project.runs.map((r) => (
            <li key={r.id} className="flex flex-wrap gap-2 border-b py-1 last:border-0">
              <span className="font-mono">{r.operation}</span>
              <span>{r.status}</span>
              <span className="text-neutral-500">{r.model}</span>
              {r.errorSummary ? <span className="text-red-600">{r.errorSummary}</span> : null}
              {r.tokenUsageInput != null ? (
                <span className="text-neutral-500">
                  tokens in/out: {r.tokenUsageInput}/{r.tokenUsageOutput ?? "—"}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ReviewBlock({
  title,
  items,
  extra,
}: {
  title: string;
  items: Array<{ severity: string; message: string; category?: string }>;
  extra?: unknown;
}) {
  return (
    <div>
      <h3 className="text-sm font-medium">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-neutral-500">No findings yet.</p>
      ) : (
        <ul className="mt-1 space-y-1">
          {items.map((f, i) => (
            <li key={i} className="text-sm">
              <span className="font-mono text-xs">{f.severity}</span>{" "}
              {f.category ? `[${f.category}] ` : ""}
              {f.message}
            </li>
          ))}
        </ul>
      )}
      {extra ? (
        <pre className="mt-2 max-h-40 overflow-auto rounded bg-neutral-50 p-2 text-xs">
          {JSON.stringify(extra, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
