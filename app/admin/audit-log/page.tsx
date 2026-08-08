import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/session";
import { listAuditLogs } from "@/lib/repositories/auditRepository";

export const metadata: Metadata = {
  title: "Audit log",
};

type PageProps = {
  searchParams: Promise<{ entityType?: string }>;
};

const ENTITY_TYPES = [
  "",
  "Service",
  "Solution",
  "Platform",
  "HomepageContent",
  "AdminUser",
  "Redirect",
] as const;

export default async function AdminAuditLogPage({ searchParams }: PageProps) {
  const user = await requireAdminUser("view_audit");
  const params = await searchParams;
  const entityType = params.entityType?.trim() || undefined;
  const limited =
    user.role === "CONTENT_MANAGER" || user.role === "REVIEWER";

  // Limited roles cannot filter to AdminUser
  const safeEntityType =
    limited && entityType === "AdminUser" ? undefined : entityType;

  const { items, total } = await listAuditLogs({
    entityType: safeEntityType,
    limit: 100,
    limited,
  });

  const filterOptions = limited
    ? ENTITY_TYPES.filter((t) => t !== "AdminUser")
    : ENTITY_TYPES;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="admin-page-title">Audit log</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {total} event{total === 1 ? "" : "s"}
          {limited ? " (limited view)" : ""}
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-3">
        <label className="admin-field">
          <span className="admin-label">Entity type</span>
          <select
            name="entityType"
            defaultValue={safeEntityType ?? ""}
            className="admin-input min-w-[180px]"
          >
            {filterOptions.map((t) => (
              <option key={t || "all"} value={t}>
                {t || "All"}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="admin-btn">
          Filter
        </button>
      </form>

      <section className="admin-card overflow-x-auto">
        {items.length === 0 ? (
          <div className="admin-empty">No audit events match this filter.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Actor</th>
                <th>Metadata</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  <td className="whitespace-nowrap text-neutral-500">
                    {row.createdAt.toLocaleString()}
                  </td>
                  <td className="font-medium">{row.action}</td>
                  <td>
                    <div>{row.entityType}</div>
                    {row.entityId ? (
                      <div className="font-mono text-xs text-neutral-400">
                        {row.entityId}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    {row.actor ? (
                      <>
                        <div>{row.actor.name}</div>
                        <div className="text-xs text-neutral-400">
                          {row.actor.email}
                        </div>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="max-w-xs truncate font-mono text-xs text-neutral-500">
                    {row.metadata
                      ? JSON.stringify(row.metadata)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
