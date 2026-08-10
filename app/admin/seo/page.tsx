import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { buildSeoInventory } from "@/lib/ops/seo-health";
import { listManagedPages } from "@/lib/repositories/managedPagesRepository";
import { ManagedPageSeoForm } from "@/components/admin/ManagedPageSeoForm";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FilterBar } from "@/components/ui/filter-bar";
import { Pagination } from "@/components/ui/pagination";

export const dynamic = "force-dynamic";

export default async function AdminSeoPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; p?: string; managed?: string }>;
}) {
  await requireAdminUser("manage_seo");
  const sp = await searchParams;
  const [{ pages, summary }, managed] = await Promise.all([
    buildSeoInventory(),
    listManagedPages(),
  ]);

  const selectedKey = sp.managed;
  const selected = managed.find((m) => m.key === selectedKey);

  let filtered = pages;
  if (sp.type) filtered = filtered.filter((p) => p.type === sp.type);
  if (sp.q?.trim()) {
    const q = sp.q.trim().toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.page.toLowerCase().includes(q) ||
        p.route.toLowerCase().includes(q) ||
        (p.seoTitle || "").toLowerCase().includes(q),
    );
  }

  const currentPage = Math.max(1, Number(sp.p || "1") || 1);
  const pageSize = 40;
  const slice = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      <PageHeader
        title="SEO operations"
        description={`${summary.errors} issues · ${summary.warnings} warnings · ${summary.infos} infos across ${pages.length} pages. No fake SEO score.`}
      />

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
            {[...new Set(pages.map((p) => p.type))].sort().map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Button type="submit" size="sm">
            Filter
          </Button>
        </form>
      </FilterBar>

      {selected ? (
        <ManagedPageSeoForm
          page={{
            key: selected.key,
            displayName: selected.displayName,
            route: selected.route,
            seoTitle: selected.seoTitle,
            seoDescription: selected.seoDescription,
            ogTitle: selected.ogTitle,
            ogDescription: selected.ogDescription,
            ogImagePath: selected.ogImagePath,
            noIndex: selected.noIndex,
            canonicalOverride: selected.canonicalOverride,
            heroEyebrow: selected.heroEyebrow,
            heroHeadline: selected.heroHeadline,
            heroSupporting: selected.heroSupporting,
          }}
        />
      ) : null}

      <DataTable
        rows={slice}
        rowKey={(row) => row.key}
        columns={[
          {
            key: "page",
            header: "Page",
            cell: (row) => (
              <div>
                {row.editHref ? (
                  <Link href={row.editHref} className="font-medium text-accent-text hover:underline">
                    {row.page}
                  </Link>
                ) : (
                  row.page
                )}
                <div className="font-mono text-xs text-muted">{row.route}</div>
              </div>
            ),
          },
          { key: "type", header: "Type", cell: (row) => row.type },
          { key: "status", header: "Status", cell: (row) => row.status },
          {
            key: "seoTitle",
            header: "SEO title",
            className: "max-w-[16rem]",
            cell: (row) => <span className="truncate">{row.seoTitle || "—"}</span>,
          },
          {
            key: "indexable",
            header: "Indexable",
            cell: (row) => (row.indexable ? "Yes" : "No"),
          },
          {
            key: "issues",
            header: "Issues",
            cell: (row) =>
              row.issues.length === 0 ? (
                <span className="text-muted">None</span>
              ) : (
                <ul className="space-y-1">
                  {row.issues.slice(0, 3).map((issue) => (
                    <li key={issue.code + issue.message}>
                      <span className="font-medium uppercase">{issue.severity}</span>
                      : {issue.message}
                    </li>
                  ))}
                </ul>
              ),
          },
        ]}
      />

      {filtered.length > pageSize ? (
        <Pagination
          page={currentPage}
          pageSize={pageSize}
          total={filtered.length}
          hrefForPage={(p) => {
            const params = new URLSearchParams();
            if (sp.q) params.set("q", sp.q);
            if (sp.type) params.set("type", sp.type);
            if (sp.managed) params.set("managed", sp.managed);
            params.set("p", String(p));
            return `/admin/seo?${params.toString()}`;
          }}
        />
      ) : null}
    </div>
  );
}
