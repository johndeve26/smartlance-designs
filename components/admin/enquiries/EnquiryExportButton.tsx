"use client";

import { useState, useTransition } from "react";
import { exportEnquiriesAction } from "@/lib/admin/enquiry-actions";

export function EnquiryExportButton({
  type,
}: {
  type?: "CONTACT" | "WEBSITE_REVIEW";
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        className="rounded border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium disabled:opacity-60"
        onClick={() => {
          if (!confirm("Export filtered enquiry records as CSV? This action is audited.")) {
            return;
          }
          start(async () => {
            const res = await exportEnquiriesAction({ type, includeSpam: true });
            if (!res.ok) {
              setError(res.error);
              return;
            }
            const blob = new Blob([res.csv], {
              type: "text/csv;charset=utf-8",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `smartlance-enquiries-${type || "all"}-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            setError(null);
          });
        }}
      >
        {pending ? "Exporting…" : "Export CSV"}
      </button>
      {error ? <p className="mt-1 text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
