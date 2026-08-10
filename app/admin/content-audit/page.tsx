import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { runContentQualityAudit } from "@/lib/ops/content-quality-audit";
import { PageHeader } from "@/components/ui/page-header";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";
import { AdminStatGrid } from "@/components/admin/patterns/AdminDashboardPanels";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FilterBar } from "@/components/ui/filter-bar";

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
      <PageHeader
        title="Content Quality Audit"
        description={
          <>
            Review published Smartlance content for clarity, freshness,
            duplication, proof, SEO, and opportunities to improve existing pages.
            Read-only — nothing is rewritten or published from this screen.
            <span className="mt-2 block text-xs text-muted">
              Audit version {report.version} · {report.auditedAt.slice(0, 19)}Z ·
              published only
            </span>
          </>
        }
      />

      <AdminStatGrid
        stats={[
          { label: "Pages reviewed", value: report.summary.pagesReviewed },
          { label: "Open findings", value: report.summary.openFindings },
          { label: "Needs research", value: report.summary.needsResearch },
          { label: "Proof review", value: report.summary.proofReview },
          { label: "High priority", value: report.summary.highPriority },
          { label: "Strong pages", value: report.summary.strongPages },
        ]}
      />

      <AdminPanel>
        <h2 className="text-section-heading">Site-level findings</h2>
        <ul className="mt-3 space-y-3">
          {report.siteFindings.map((f) => (
            <li key={f.id} className="text-sm">
              <span className="rounded border border-border px-1.5 py-0.5 text-xs">
                {f.severity}
              </span>{" "}
              <span className="font-medium">{f.category.replace(/_/g, " ")}</span>
              <p className="mt-1 text-muted">{f.message}</p>
              <p className="mt-0.5 text-xs text-muted">
                Next: {f.recommendedAction}
              </p>
            </li>
          ))}
        </ul>
      </AdminPanel>

      <AdminPanel className="border-warning bg-warning-soft/40">
        <h2 className="text-section-heading text-warning-text">
          First improvement wave ({report.firstImprovementWave.length})
        </h2>
        <p className="mt-1 text-xs text-warning-text">
          Advisory backlog only. Open the editor, then start the assistant
          manually — generation does not run from this list.
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
          {report.firstImprovementWave.map((w) => (
            <li key={`${w.entityType}-${w.route}-${w.order}`}>
              <Link href={w.editorHref} className="font-medium underline">
                {w.title}
              </Link>{" "}
              <span className="text-muted">
                ({w.entityType} · {w.priority} · {w.verdict.replace(/_/g, " ")})
              </span>
              <p className="text-xs text-muted">{w.why}</p>
            </li>
          ))}
        </ol>
      </AdminPanel>

      <FilterBar>
        <form method="get" className="flex flex-wrap items-end gap-3">
          <Input
            name="q"
            label="Search"
            defaultValue={sp.q || ""}
            placeholder="Search pages"
            className="min-w-[200px]"
          />
          <Select name="type" label="Type" defaultValue={sp.type || ""}>
            <option value="">All types</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Select name="verdict" label="Verdict" defaultValue={sp.verdict || ""}>
            <option value="">All verdicts</option>
            {verdicts.map((v) => (
              <option key={v} value={v}>
                {v.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
          <Select name="priority" label="Priority" defaultValue={sp.priority || ""}>
            <option value="">All priorities</option>
            <option value="HIGH">HIGH</option>
            <option value="NORMAL">NORMAL</option>
            <option value="LOW">LOW</option>
          </Select>
          <Button type="submit" size="sm">
            Filter
          </Button>
        </form>
      </FilterBar>

      <DataTable
        rows={pages}
        rowKey={(p) => `${p.entityType}-${p.entityId}`}
        columns={[
          {
            key: "page",
            header: "Page",
            cell: (p) => (
              <div>
                <Link href={p.editorHref} className="font-medium text-accent-text hover:underline">
                  {p.title}
                </Link>
                <div className="text-xs text-muted">{p.route}</div>
              </div>
            ),
          },
          { key: "type", header: "Type", cell: (p) => p.entityType },
          {
            key: "verdict",
            header: "Verdict",
            cell: (p) => <span className="text-xs">{p.verdict.replace(/_/g, " ")}</span>,
          },
          { key: "priority", header: "Priority", cell: (p) => p.priority },
          {
            key: "findings",
            header: "Findings",
            cell: (p) =>
              p.findings.length ? (
                <ul className="space-y-1 text-xs text-muted">
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
                <span className="text-xs text-success-text">
                  No change recommended
                </span>
              ),
          },
          {
            key: "next",
            header: "Next",
            cell: (p) => (
              <Link
                href={p.findings[0]?.editorHref || p.editorHref}
                className="text-xs text-accent-text hover:underline"
              >
                {p.recommendedNextAction || "Open"}
              </Link>
            ),
          },
        ]}
      />

      <p className="text-xs text-muted">
        Showing {pages.length} of {report.summary.pagesReviewed} reviewed pages.
        Baseline docs:{" "}
        <code>docs/SMARTLANCE_CONTENT_AUDIT_BASELINE.md</code>
      </p>
    </div>
  );
}
