"use client";

import { useTransition } from "react";
import { exportCrmAction } from "@/lib/admin/crm-actions";

export function CrmExportButton({
  type,
  label,
}: {
  type: "contacts" | "leads" | "deals" | "companies";
  label: string;
}) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm("Export will be logged in the audit trail. Continue?")) {
          return;
        }
        start(async () => {
          const result = await exportCrmAction(type);
          if (!result.ok) {
            alert(result.error);
            return;
          }
          const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `crm-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
          a.click();
          URL.revokeObjectURL(url);
        });
      }}
      className="admin-btn admin-btn-secondary text-sm"
    >
      {pending ? "Exporting…" : label}
    </button>
  );
}
