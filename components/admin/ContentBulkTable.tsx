"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  SelectableAdminTable,
  type BulkActionDef,
} from "@/components/admin/SelectableAdminTable";
import {
  bulkArchiveAction,
  bulkPublishAction,
  type ContentFamily,
} from "@/lib/admin/bulk-content-actions";

export type BulkListRow = {
  id: string;
  href: string;
  title: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  /** Extra display fields keyed for columns */
  fields: Record<string, string>;
};

export type BulkListColumn = {
  key: string;
  header: string;
  /** Render as primary title link */
  isTitle?: boolean;
  mono?: boolean;
};

export function ContentBulkTable({
  family,
  rows,
  columns,
  canPublish,
  emptyMessage,
}: {
  family: ContentFamily;
  rows: BulkListRow[];
  columns: BulkListColumn[];
  canPublish: boolean;
  emptyMessage?: string;
}) {
  const bulkActions: BulkActionDef[] = canPublish
    ? [
        { id: "publish", label: "Publish", variant: "primary" },
        {
          id: "archive",
          label: "Archive",
          confirm: "Archive selected items? They will leave the public site.",
        },
      ]
    : [];

  return (
    <SelectableAdminTable
      rows={rows}
      getRowId={(row) => row.id}
      emptyMessage={emptyMessage}
      bulkActions={bulkActions}
      onBulkAction={async (actionId, ids) => {
        if (actionId === "publish") {
          return bulkPublishAction(family, ids);
        }
        if (actionId === "archive") {
          return bulkArchiveAction(family, ids);
        }
        return { ok: false, message: "Unknown action." };
      }}
      columns={columns.map((col) => ({
        key: col.key,
        header: col.header,
        className: col.mono ? "font-mono text-xs" : undefined,
        cell: (row: BulkListRow) => {
          if (col.isTitle) {
            return (
              <Link
                href={row.href}
                className="font-medium text-accent-text hover:underline"
              >
                {row.title}
              </Link>
            );
          }
          if (col.key === "status") {
            return <StatusBadge status={row.status} />;
          }
          return row.fields[col.key] ?? "—";
        },
      }))}
    />
  );
}
