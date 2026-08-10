import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import {
  getAIWriterDashboard,
  listAIProjects,
} from "@/lib/ai/editorial-service";
import { AIWriterSubnav } from "@/components/admin/ai-writer/AIWriterSubnav";
import { PageHeader } from "@/components/ui/page-header";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";
import { AdminStatGrid } from "@/components/admin/patterns/AdminDashboardPanels";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FilterBar } from "@/components/ui/filter-bar";

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
      <PageHeader
        title="AI Editorial Studio"
        description="Research, plan, write and optimize useful Smartlance content with AI — while keeping publishing under editorial control."
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href="/admin/ai-writer/new">New project</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href="/admin/ai-writer/discover">Topic Discovery</Link>
            </Button>
          </div>
        }
      />

      <AIWriterSubnav current="/admin/ai-writer" />

      <AdminStatGrid
        stats={[
          { label: "Drafting", value: dash.drafting },
          { label: "Needs review", value: dash.needsReview },
          { label: "Approved for CMS", value: dash.approved },
          { label: "Failed runs (7d)", value: dash.failedRuns },
        ]}
      />

      <AdminPanel className="text-sm">
        <div className="text-xs text-muted">Providers</div>
        <div className="mt-1">AI: {dash.provider.label}</div>
        <div>Research: {dash.research.label}</div>
      </AdminPanel>

      <AdminPanel className="text-sm">
        <div className="text-xs text-muted">Usage (tokens — not public analytics)</div>
        <div className="mt-1">
          Today: {dash.usageToday.runs} runs · {dash.usageToday.input + dash.usageToday.output} tokens
          · {dash.usageToday.failed} failed
        </div>
        <div>
          Month: {dash.usageMonth.runs} runs · {dash.usageMonth.input + dash.usageMonth.output} tokens
        </div>
        {dash.tokenWarning ? (
          <div className="mt-2 text-warning-text">{dash.tokenWarning}</div>
        ) : null}
        {dash.staleJobsRecovered > 0 ? (
          <div className="mt-1 text-warning-text">
            Recovered {dash.staleJobsRecovered} stale RUNNING job(s).
          </div>
        ) : null}
      </AdminPanel>

      {!dash.provider.configured ? (
        <AdminPanel className="border-warning bg-warning-soft/40 text-sm text-warning-text">
          AI provider is not configured. Existing Insights and Admin continue to work. Add an API key
          under{" "}
          <Link href="/admin/ai-writer/settings" className="underline">
            AI → Settings
          </Link>{" "}
          (or set an env fallback key) to enable generation.
        </AdminPanel>
      ) : null}

      <FilterBar>
        <form className="flex flex-wrap items-end gap-3">
          <Input
            name="q"
            label="Search"
            defaultValue={sp.q || ""}
            placeholder="Title, topic, Insight…"
            className="min-w-[200px] flex-1"
          />
          <Select name="status" label="Status" defaultValue={sp.status || ""}>
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
          </Select>
          <Select name="mode" label="Mode" defaultValue={sp.mode || ""}>
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
          </Select>
          <Select name="linked" label="Linked" defaultValue={sp.linked || ""}>
            <option value="">Linked any</option>
            <option value="linked">Linked Insight</option>
            <option value="unlinked">Unlinked</option>
          </Select>
          <Button type="submit" size="sm">
            Filter
          </Button>
        </form>
      </FilterBar>

      <DataTable
        rows={projects}
        rowKey={(p) => p.id}
        emptyState={
          <AdminPanel className="text-center text-muted">
            No editorial projects yet. Create one to start research → brief → draft.
          </AdminPanel>
        }
        columns={[
          {
            key: "title",
            header: "Working title",
            cell: (p) => (
              <Link href={`/admin/ai-writer/${p.id}`} className="font-medium text-accent-text">
                {p.title}
              </Link>
            ),
          },
          { key: "mode", header: "Mode", cell: (p) => <span className="text-xs">{p.mode}</span> },
          {
            key: "status",
            header: "Status",
            cell: (p) => (
              <span className="rounded bg-surface-muted px-2 py-0.5 text-xs">{p.status}</span>
            ),
          },
          {
            key: "topic",
            header: "Topic",
            className: "max-w-[220px]",
            cell: (p) => <span className="truncate text-muted">{p.workingTopic}</span>,
          },
          {
            key: "createdBy",
            header: "Created by",
            cell: (p) => <span className="text-xs">{p.createdBy?.name || "—"}</span>,
          },
          {
            key: "updated",
            header: "Updated",
            cell: (p) => (
              <span className="text-xs">
                {p.updatedAt.toISOString().slice(0, 16).replace("T", " ")}
              </span>
            ),
          },
          {
            key: "linked",
            header: "Linked Insight",
            cell: (p) =>
              p.linkedInsight ? (
                <Link href={`/admin/insights/${p.linkedInsight.id}`} className="text-xs underline">
                  {p.linkedInsight.title}
                </Link>
              ) : (
                "—"
              ),
          },
        ]}
      />
    </div>
  );
}
