"use client";

import { useState, useTransition } from "react";
import { runLinkHealthAction } from "@/lib/admin/phase4-actions";

export function LinkHealthRunner({ lastRunAt }: { lastRunAt: string | null }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-white p-4">
      <button
        type="button"
        disabled={pending}
        className="rounded bg-[#F47A48] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        onClick={() =>
          start(async () => {
            const res = await runLinkHealthAction();
            setMessage(res.ok ? "Link check completed." : "Link check failed.");
            if (res.ok) window.location.reload();
          })
        }
      >
        {pending ? "Running…" : "Run link check"}
      </button>
      <p className="text-sm text-neutral-600">
        Last completed: {lastRunAt ? new Date(lastRunAt).toLocaleString() : "never"}
      </p>
      {message ? <p className="text-sm">{message}</p> : null}
    </div>
  );
}
