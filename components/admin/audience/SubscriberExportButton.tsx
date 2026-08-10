"use client";

import { useState, useTransition } from "react";
import { exportSubscribersAction } from "@/lib/admin/audience-actions";

export function SubscriberExportButton() {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          start(async () => {
            const res = await exportSubscribersAction();
            if (!res.ok) {
              setError(res.error);
              return;
            }
            const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `smartlance-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          });
        }}
        className="rounded border px-3 py-1.5 text-sm hover:bg-white disabled:opacity-60"
      >
        {pending ? "Exporting…" : "Export CSV"}
      </button>
      {error ? <p className="mt-1 text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
