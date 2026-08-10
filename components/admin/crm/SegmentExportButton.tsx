"use client";

import { useTransition } from "react";
import { exportSegmentAction } from "@/lib/admin/crm-outreach-actions";

export function SegmentExportButton({
  segmentId,
  segmentName,
}: {
  segmentId: string;
  segmentName: string;
}) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm("Export segment contacts? This will be logged in the audit trail.")) {
          return;
        }
        start(async () => {
          const result = await exportSegmentAction(segmentId);
          if (!result.ok) {
            alert(result.error);
            return;
          }
          const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `crm-segment-${segmentName.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
          a.click();
          URL.revokeObjectURL(url);
        });
      }}
      className="admin-btn admin-btn-secondary text-sm"
    >
      {pending ? "Exporting…" : "Export segment"}
    </button>
  );
}
