import type { DeploymentEnvRow } from "@/lib/admin/deployment-env-status";

function statusLabel(row: DeploymentEnvRow) {
  if (row.status === "configured" || row.status === "enabled") {
    return row.status === "enabled" ? "Enabled" : "Configured";
  }
  return row.status === "disabled" ? "Disabled" : "Not configured";
}

function statusClass(row: DeploymentEnvRow) {
  if (row.status === "configured" || row.status === "enabled") {
    return "text-emerald-700";
  }
  if (row.class === "DEVELOPMENT_ONLY" && row.status === "disabled") {
    return "text-neutral-600";
  }
  if (row.class === "SECRET" && row.status === "not_configured") {
    return "text-amber-700";
  }
  return "text-neutral-600";
}

export function DeploymentEnvPanel({ rows }: { rows: DeploymentEnvRow[] }) {
  return (
    <section className="rounded-lg border bg-white p-4 space-y-3">
      <div>
        <h2 className="font-semibold">Deployment environment</h2>
        <p className="mt-1 text-xs text-neutral-500">
          Secrets and infrastructure flags stay in environment variables. Values
          are never shown — only configured / not configured status.
        </p>
      </div>
      <div className="overflow-hidden rounded-md border">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-neutral-50 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-3 py-2">Variable</th>
              <th className="px-3 py-2">Status</th>
              <th className="hidden px-3 py-2 md:table-cell">Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b last:border-b-0">
                <td className="px-3 py-2 align-top">
                  <div className="font-medium">{row.label}</div>
                  <code className="text-xs text-neutral-500">{row.key}</code>
                </td>
                <td className={`px-3 py-2 align-top ${statusClass(row)}`}>
                  {statusLabel(row)}
                </td>
                <td className="hidden px-3 py-2 align-top text-neutral-600 md:table-cell">
                  {row.notes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
