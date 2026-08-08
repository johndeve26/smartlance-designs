import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/session";
import { buildSeoInventory } from "@/lib/ops/seo-health";
import { listManagedPages } from "@/lib/repositories/managedPagesRepository";
import { ManagedPageSeoForm } from "@/components/admin/ManagedPageSeoForm";

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
      <div>
        <h1 className="text-2xl font-semibold">SEO operations</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {summary.errors} issues · {summary.warnings} warnings · {summary.infos}{" "}
          infos across {pages.length} pages. No fake SEO score.
        </p>
      </div>

      <form method="get" className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={sp.q || ""}
          placeholder="Search pages"
          className="rounded border px-3 py-2 text-sm"
        />
        <select name="type" defaultValue={sp.type || ""} className="rounded border px-3 py-2 text-sm">
          <option value="">All types</option>
          {[...new Set(pages.map((p) => p.type))].sort().map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded bg-neutral-900 px-3 py-2 text-sm text-white">
          Filter
        </button>
      </form>

      {selected ? (
        <ManagedPageSeoForm
          page={{
            key: selected.key,
            displayName: selected.displayName,
            route: selected.route,
            seoTitle: selected.seoTitle,
            seoDescription: selected.seoDescription,
            ogImagePath: selected.ogImagePath,
            noIndex: selected.noIndex,
            canonicalOverride: selected.canonicalOverride,
          }}
        />
      ) : null}

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-neutral-50 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-3 py-2">Page</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">SEO title</th>
              <th className="px-3 py-2">Indexable</th>
              <th className="px-3 py-2">Issues</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((row) => (
              <tr key={row.key} className="border-b align-top">
                <td className="px-3 py-2">
                  {row.editHref ? (
                    <Link href={row.editHref} className="font-medium text-[#F47A48] hover:underline">
                      {row.page}
                    </Link>
                  ) : (
                    row.page
                  )}
                  <div className="font-mono text-xs text-neutral-500">{row.route}</div>
                </td>
                <td className="px-3 py-2">{row.type}</td>
                <td className="px-3 py-2">{row.status}</td>
                <td className="px-3 py-2 max-w-[16rem] truncate">{row.seoTitle || "—"}</td>
                <td className="px-3 py-2">{row.indexable ? "Yes" : "No"}</td>
                <td className="px-3 py-2">
                  {row.issues.length === 0 ? (
                    <span className="text-neutral-500">None</span>
                  ) : (
                    <ul className="space-y-1">
                      {row.issues.slice(0, 3).map((issue) => (
                        <li key={issue.code + issue.message}>
                          <span className="font-medium uppercase">
                            {issue.severity}
                          </span>
                          : {issue.message}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
