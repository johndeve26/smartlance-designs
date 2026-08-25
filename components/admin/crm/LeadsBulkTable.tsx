"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  SelectableAdminTable,
  type BulkActionDef,
} from "@/components/admin/SelectableAdminTable";
import { CrmBadge } from "@/components/admin/crm/CrmShared";
import {
  bulkDeleteLeadsAction,
  bulkUpdateLeadStatusAction,
  bulkUpdateLeadTemperatureAction,
} from "@/lib/admin/crm-bulk-actions";
import {
  CRM_LEAD_STATUS_LABELS,
  CRM_LEAD_TEMPERATURE_LABELS,
  temperatureTone,
} from "@/lib/crm/display";

export type LeadBulkRow = {
  id: string;
  contactName: string;
  company: string;
  status: keyof typeof CRM_LEAD_STATUS_LABELS;
  statusLabel: string;
  temperature: keyof typeof CRM_LEAD_TEMPERATURE_LABELS;
  temperatureLabel: string;
  source: string;
  owner: string;
  nextTask: string;
  created: string;
};

const STATUS_OPTIONS = Object.entries(CRM_LEAD_STATUS_LABELS) as Array<
  [keyof typeof CRM_LEAD_STATUS_LABELS, string]
>;
const TEMP_OPTIONS = Object.entries(CRM_LEAD_TEMPERATURE_LABELS) as Array<
  [keyof typeof CRM_LEAD_TEMPERATURE_LABELS, string]
>;

export function LeadsBulkTable({
  rows,
  canManage,
}: {
  rows: LeadBulkRow[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<string>("ATTEMPTING");
  const [temperature, setTemperature] = useState<string>("WARM");

  const bulkActions: BulkActionDef[] = canManage
    ? [
        {
          id: "delete",
          label: "Delete",
          variant: "danger",
          confirm:
            "Permanently delete selected leads? This cannot be undone.",
        },
      ]
    : [];

  return (
    <SelectableAdminTable
      rows={rows}
      getRowId={(r) => r.id}
      showSelection={canManage}
      emptyMessage="No leads found"
      bulkActions={bulkActions}
      onBulkAction={async (actionId, ids) => {
        if (actionId === "delete") {
          const result = await bulkDeleteLeadsAction({ ids });
          if (result.ok) router.refresh();
          return result;
        }
        return { ok: false, message: "Unknown action." };
      }}
      toolbarSlot={
        canManage
          ? ({ pending, runWithSelection }) => (
              <>
                <select
                  className="h-8 rounded border border-neutral-300 bg-white px-2 text-sm"
                  value={status}
                  disabled={pending}
                  onChange={(e) => setStatus(e.target.value)}
                  aria-label="Lead status"
                >
                  {STATUS_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={pending || !status}
                  className="rounded border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 disabled:opacity-50"
                  onClick={() =>
                    runWithSelection(async (ids) => {
                      const result = await bulkUpdateLeadStatusAction({
                        ids,
                        status,
                      });
                      if (result.ok) router.refresh();
                      return result;
                    })
                  }
                >
                  Apply status
                </button>
                <select
                  className="h-8 rounded border border-neutral-300 bg-white px-2 text-sm"
                  value={temperature}
                  disabled={pending}
                  onChange={(e) => setTemperature(e.target.value)}
                  aria-label="Lead temperature"
                >
                  {TEMP_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={pending || !temperature}
                  className="rounded border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 disabled:opacity-50"
                  onClick={() =>
                    runWithSelection(async (ids) => {
                      const result = await bulkUpdateLeadTemperatureAction({
                        ids,
                        temperature,
                      });
                      if (result.ok) router.refresh();
                      return result;
                    })
                  }
                >
                  Apply temp
                </button>
              </>
            )
          : undefined
      }
      columns={[
        {
          key: "contact",
          header: "Contact",
          cell: (l) => (
            <Link
              href={`/admin/crm/leads/${l.id}`}
              className="font-medium text-accent-text hover:underline"
            >
              {l.contactName}
            </Link>
          ),
        },
        { key: "company", header: "Company", cell: (l) => l.company },
        { key: "status", header: "Status", cell: (l) => l.statusLabel },
        {
          key: "temp",
          header: "Temp",
          cell: (l) => (
            <CrmBadge tone={temperatureTone(l.temperature)}>
              {l.temperatureLabel}
            </CrmBadge>
          ),
        },
        {
          key: "source",
          header: "Source",
          className: "hidden md:table-cell",
          cell: (l) => l.source,
        },
        {
          key: "owner",
          header: "Owner",
          className: "hidden md:table-cell",
          cell: (l) => l.owner,
        },
        { key: "next", header: "Next task", cell: (l) => l.nextTask },
        {
          key: "created",
          header: "Created",
          className: "hidden md:table-cell",
          cell: (l) => l.created,
        },
      ]}
    />
  );
}
