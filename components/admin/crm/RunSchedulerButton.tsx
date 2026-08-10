"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { runSchedulerAction } from "@/lib/admin/crm-outreach-actions";

export function RunSchedulerButton() {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="admin-btn admin-btn-secondary text-sm"
      onClick={() => {
        start(async () => {
          const r = await runSchedulerAction();
          if (r.ok) {
            alert(
              `Claimed: ${r.result.claimed}, sent: ${r.result.sent}, skipped: ${r.result.skipped}, failed: ${r.result.failed}, ambiguous: ${r.result.ambiguous}, deferred: ${r.result.deferred}`,
            );
          }
          router.refresh();
        });
      }}
    >
      {pending ? "Running…" : "Run sequence scheduler"}
    </button>
  );
}
