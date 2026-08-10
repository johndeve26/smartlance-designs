import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/session";
import { listAuditLogs } from "@/lib/repositories/auditRepository";
import { AdminListPage } from "@/components/admin/patterns/AdminListPage";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

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
    <AdminListPage
      title="Audit log"
      description={`${total} event${total === 1 ? "" : "s"}${limited ? " (limited view)" : ""}`}
      filters={
        <form className="flex flex-wrap items-end gap-3">
          <Select
            name="entityType"
            label="Entity type"
            defaultValue={safeEntityType ?? ""}
            className="min-w-[180px]"
          >
            {filterOptions.map((t) => (
              <option key={t || "all"} value={t}>
                {t || "All"}
              </option>
            ))}
          </Select>
          <Button type="submit" size="sm">
            Filter
          </Button>
        </form>
      }
      isEmpty={items.length === 0}
      empty={{
        title: "No audit events",
        description: "No events match this filter.",
      }}
    >
      <DataTable
        rows={items}
        rowKey={(row) => row.id}
        columns={[
          {
            key: "when",
            header: "When",
            className: "whitespace-nowrap text-muted",
            cell: (row) => row.createdAt.toLocaleString(),
          },
          {
            key: "action",
            header: "Action",
            cell: (row) => <span className="font-medium">{row.action}</span>,
          },
          {
            key: "entity",
            header: "Entity",
            cell: (row) => (
              <div>
                <div>{row.entityType}</div>
                {row.entityId ? (
                  <div className="font-mono text-xs text-subtle">{row.entityId}</div>
                ) : null}
              </div>
            ),
          },
          {
            key: "actor",
            header: "Actor",
            cell: (row) =>
              row.actor ? (
                <>
                  <div>{row.actor.name}</div>
                  <div className="text-xs text-subtle">{row.actor.email}</div>
                </>
              ) : (
                "—"
              ),
          },
          {
            key: "metadata",
            header: "Metadata",
            className: "max-w-xs truncate font-mono text-xs text-muted",
            cell: (row) => (row.metadata ? JSON.stringify(row.metadata) : "—"),
          },
        ]}
      />
    </AdminListPage>
  );
}
