import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { runContentQualityAudit } from "@/lib/ops/content-quality-audit";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Content Quality Audit",
};

export default async function ContentAuditPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    verdict?: string;
    priority?: string;
    q?: string;
  }>;
}) {
  await requireAdminUser("edit_draft");
  const sp = await searchParams;
  const report = await runContentQualityAudit();

  let pages = report.pages;
  if (sp.type) pages = pages.filter((p) => p.entityType === sp.type);
  if (sp.verdict) pages = pages.filter((p) => p.verdict === sp.verdict);
  if (sp.priority) pages = pages.filter((p) => p.priority === sp.priority);
  if (sp.q?.trim()) {
    const q = sp.q.trim().toLowerCase();
    pages = pages.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.route.toLowerCase().includes(q) ||
        p.entityType.toLowerCase().includes(q),
    );
  }

  const types = [...new Set(report.pages.map((p) => p.entityType))].sort();
  const verdicts = [...new Set(report.pages.map((p) => p.verdict))].sort();

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Content Quality Audit
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Review published Smartlance content for clarity, freshness,
          duplication, proof, SEO, and opportunities to improve existing pages.
          Read-only — nothing is rewritten or published from this screen.
        </p>
        <p className="mt-2 text-xs text-neutral-500">
          Audit version {report.version} · {report.auditedAt.slice(0, 19)}Z ·
          published only
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Pages reviewed" value={report.summary.pagesReviewed} />
        <Stat label="Open findings" value={report.summary.openFindings} />
        <Stat label="Needs research" value={report.summary.needsResearch} />
        <Stat label="Proof review" value={report.summary.proofReview} />
        <Stat label="High priority" value={report.summary.highPriority} />
        <Stat label="Strong pages" value={report.summary.strongPages} />
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-900">
          Site-level findings
        </h2>
        <ul className="mt-3 space-y-3">
          {report.siteFindings.map((f) => (
            <li key={f.id} className="text-sm">
              <span className="rounded border px-1.5 py-0.5 text-xs">
                {f.severity}
              </span>{" "}
              <span className="font-medium">{f.category.replace(/_/g, " ")}</span>
              <p className="mt-1 text-neutral-700">{f.message}</p>
              <p className="mt-0.5 text-xs text-neutral-500">
                Next: {f.recommendedAction}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <h2 className="text-sm font-semibold text-amber-950">
          First improvement wave ({report.firstImprovementWave.length})
        </h2>
        <p className="mt-1 text-xs text-amber-900">
          Advisory backlog only. Open the editor, then start the assistant
          manually — generation does not run from this list.
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
          {report.firstImprovementWave.map((w) => (
            <li key={`${w.entityType}-${w.route}-${w.order}`}>
              <Link href={w.editorHref} className="font-medium underline">
                {w.title}
              </Link>{" "}
              <span className="text-neutral-500">
                ({w.entityType} · {w.priority} · {w.verdict.replace(/_/g, " ")})
              </span>
              <p className="text-xs text-neutral-600">{w.why}</p>
            </li>
          ))}
        </ol>
      </section>

      <form method="get" className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={sp.q || ""}
          placeholder="Search pages"
          className="rounded border px-3 py-2 text-sm"
        />
        <select
          name="type"
          defaultValue={sp.type || ""}
          className="rounded border px-3 py-2 text-sm"
        >
          <option value="">All types</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          name="verdict"
          defaultValue={sp.verdict || ""}
          className="rounded border px-3 py-2 text-sm"
        >
          <option value="">All verdicts</option>
          {verdicts.map((v) => (
            <option key={v} value={v}>
              {v.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <select
          name="priority"
          defaultValue={sp.priority || ""}
          className="rounded border px-3 py-2 text-sm"
        >
          <option value="">All priorities</option>
          <option value="HIGH">HIGH</option>
          <option value="NORMAL">NORMAL</option>
          <option value="LOW">LOW</option>
        </select>
        <button
          type="submit"
          className="rounded bg-neutral-900 px-3 py-2 text-sm text-white"
        >
          Filter
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-neutral-50 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-3 py-2">Page</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Verdict</th>
              <th className="px-3 py-2">Priority</th>
              <th className="px-3 py-2">Findings</th>
              <th className="px-3 py-2">Next</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => (
              <tr key={`${p.entityType}-${p.entityId}`} className="border-b">
                <td className="px-3 py-2">
                  <Link href={p.editorHref} className="font-medium underline">
                    {p.title}
                  </Link>
                  <div className="text-xs text-neutral-500">{p.route}</div>
                </td>
                <td className="px-3 py-2">{p.entityType}</td>
                <td className="px-3 py-2 text-xs">
                  {p.verdict.replace(/_/g, " ")}
                </td>
                <td className="px-3 py-2">{p.priority}</td>
                <td className="px-3 py-2">
                  {p.findings.length ? (
                    <ul className="space-y-1 text-xs text-neutral-700">
                      {p.findings.slice(0, 2).map((f) => (
                        <li key={f.id}>
                          [{f.severity}] {f.message}
                        </li>
                      ))}
                      {p.findings.length > 2 ? (
                        <li>+{p.findings.length - 2} more</li>
                      ) : null}
                    </ul>
                  ) : (
                    <span className="text-xs text-emerald-700">
                      No change recommended
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-xs">
                  <Link
                    href={p.findings[0]?.editorHref || p.editorHref}
                    className="underline"
                  >
                    {p.recommendedNextAction || "Open"}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-neutral-500">
        Showing {pages.length} of {report.summary.pagesReviewed} reviewed pages.
        Baseline docs:{" "}
        <code>docs/SMARTLANCE_CONTENT_AUDIT_BASELINE.md</code>
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-neutral-200 bg-white px-3 py-2">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="text-xl font-semibold text-neutral-900">{value}</div>
    </div>
  );
}
