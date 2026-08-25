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
  bulkDeleteContactsAction,
  bulkUpdateContactLifecycleAction,
} from "@/lib/admin/crm-bulk-actions";
import { CRM_LIFECYCLE_LABELS, temperatureTone } from "@/lib/crm/display";

export type ContactBulkRow = {
  id: string;
  name: string;
  company: string;
  country: string;
  email: string;
  lifecycle: keyof typeof CRM_LIFECYCLE_LABELS;
  lifecycleLabel: string;
  leadStatus: string;
  temperature: "COLD" | "WARM" | "HOT" | null;
  temperatureLabel: string | null;
  nextAction: string;
};

const LIFECYCLE_OPTIONS = Object.entries(CRM_LIFECYCLE_LABELS) as Array<
  [keyof typeof CRM_LIFECYCLE_LABELS, string]
>;

export function ContactsBulkTable({
  rows,
  canManage,
}: {
  rows: ContactBulkRow[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [lifecycle, setLifecycle] = useState<string>("LEAD");

  const bulkActions: BulkActionDef[] = canManage
    ? [
        {
          id: "delete",
          label: "Delete",
          variant: "danger",
          confirm:
            "Permanently delete selected contacts? This cannot be undone and removes related CRM records (leads, deals, emails, tasks).",
        },
      ]
    : [];

  return (
    <SelectableAdminTable
      rows={rows}
      getRowId={(r) => r.id}
      showSelection={canManage}
      emptyMessage="No contacts found"
      bulkActions={bulkActions}
      onBulkAction={async (actionId, ids) => {
        if (actionId === "delete") {
          const result = await bulkDeleteContactsAction({ ids });
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
                  value={lifecycle}
                  disabled={pending}
                  onChange={(e) => setLifecycle(e.target.value)}
                  aria-label="Lifecycle stage"
                >
                  {LIFECYCLE_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={pending || !lifecycle}
                  className="rounded border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 disabled:opacity-50"
                  onClick={() =>
                    runWithSelection(async (ids) => {
                      const result = await bulkUpdateContactLifecycleAction({
                        ids,
                        lifecycleStage: lifecycle,
                      });
                      if (result.ok) router.refresh();
                      return result;
                    })
                  }
                >
                  Apply lifecycle
                </button>
              </>
            )
          : undefined
      }
      columns={[
        {
          key: "name",
          header: "Contact",
          cell: (c) => (
            <Link
              href={`/admin/crm/contacts/${c.id}`}
              className="font-medium text-accent-text hover:underline"
            >
              {c.name}
            </Link>
          ),
        },
        { key: "company", header: "Company", cell: (c) => c.company },
        {
          key: "country",
          header: "Country",
          className: "hidden md:table-cell",
          cell: (c) => c.country,
        },
        {
          key: "email",
          header: "Email",
          className: "hidden md:table-cell",
          cell: (c) => c.email,
        },
        { key: "lifecycle", header: "Lifecycle", cell: (c) => c.lifecycleLabel },
        {
          key: "lead",
          header: "Lead",
          className: "hidden md:table-cell",
          cell: (c) => c.leadStatus,
        },
        {
          key: "temp",
          header: "Temp",
          className: "hidden md:table-cell",
          cell: (c) =>
            c.temperature && c.temperatureLabel ? (
              <CrmBadge tone={temperatureTone(c.temperature)}>
                {c.temperatureLabel}
              </CrmBadge>
            ) : (
              "—"
            ),
        },
        { key: "next", header: "Next action", cell: (c) => c.nextAction },
      ]}
    />
  );
}
