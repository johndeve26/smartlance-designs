import { requireAdminUser } from "@/lib/admin/session";
import { getLatestLinkHealthRun } from "@/lib/ops/link-health";
import { LinkHealthRunner } from "@/components/admin/LinkHealthRunner";

export const dynamic = "force-dynamic";

export default async function AdminLinkHealthPage() {
  await requireAdminUser("run_link_health");
  const latest = await getLatestLinkHealthRun();
  const summary = (latest?.summary || {}) as Record<string, number>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Link health</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Internal connection checks for navigation, redirects and relations.
          Runs on demand — not on every Admin page load.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Broken", summary.broken ?? 0],
          ["Redirecting", summary.redirecting ?? 0],
          ["Orphan warnings", summary.orphan ?? 0],
          ["Invalid relations", summary.invalidRelation ?? 0],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-lg border bg-white p-4">
            <div className="text-2xl font-semibold">{value}</div>
            <div className="text-xs uppercase tracking-wide text-neutral-500">
              {label}
            </div>
          </div>
        ))}
      </div>

      <LinkHealthRunner
        lastRunAt={latest?.completedAt?.toISOString() || null}
      />

      {latest?.issues?.length ? (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-3 py-2">Severity</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2">Target</th>
                <th className="px-3 py-2">Message</th>
              </tr>
            </thead>
            <tbody>
              {latest.issues.map((issue) => (
                <tr key={issue.id} className="border-b align-top">
                  <td className="px-3 py-2">{issue.severity}</td>
                  <td className="px-3 py-2">{issue.type}</td>
                  <td className="px-3 py-2">
                    {issue.sourceLabel}
                    {issue.sourcePath ? (
                      <div className="font-mono text-xs text-neutral-500">
                        {issue.sourcePath}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {issue.targetPath || "—"}
                  </td>
                  <td className="px-3 py-2">
                    {issue.message}
                    {issue.fixHint ? (
                      <div className="text-xs text-neutral-500">{issue.fixHint}</div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-neutral-600">
          {latest ? "No issues in the latest run." : "No health run yet."}
        </p>
      )}
    </div>
  );
}
