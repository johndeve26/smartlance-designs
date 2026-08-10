"use client";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import Link from "next/link";
import {
  retryFailedExecutionAction,
  resolveAmbiguousExecutionAction,
} from "@/lib/crm/sequences/operator-actions";

type AttentionItems = Awaited<
  ReturnType<typeof import("@/lib/crm/outreach/reliability-analytics").getReliabilityAttentionItems>
>;

export function ReliabilityAttentionPanel({
  items,
  canManage,
  canSend,
}: {
  items: AttentionItems;
  canManage: boolean;
  canSend: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <AdminPanel className=" space-y-4 border-amber-200 bg-amber-50/50 p-4">
      <div>
        <h2 className="font-semibold text-amber-900">Needs attention</h2>
        <p className="text-sm text-amber-800">
          Failed executions, ambiguous sends, and paused enrollments requiring operator review.
        </p>
      </div>

      {items.ambiguousExecutions.length ? (
        <div>
          <h3 className="text-sm font-semibold">Ambiguous delivery ({items.ambiguousExecutions.length})</h3>
          <p className="text-xs text-neutral-600">
            SMTP may have accepted the message, but Smartlance could not confirm final persistence.
            Review before retrying.
          </p>
          <ul className="mt-2 space-y-2 text-sm">
            {items.ambiguousExecutions.map((e) => (
              <li key={e.id} className="rounded border bg-white px-3 py-2">
                <Link
                  href={`/admin/crm/contacts/${e.enrollment.contactId}`}
                  className="font-medium hover:underline"
                >
                  {e.enrollment.sequence.name}
                </Link>
                <p className="text-neutral-600">{e.failureCode ?? "Delivery uncertain"}</p>
                {canManage && canSend ? (
                  <button
                    type="button"
                    disabled={pending}
                    className="admin-btn admin-btn-secondary mt-2 text-xs"
                    onClick={() => {
                      if (
                        !window.confirm(
                          "Mark as sent without resending? This advances the sequence.",
                        )
                      ) {
                        return;
                      }
                      const fd = new FormData();
                      fd.set("executionId", e.id);
                      fd.set("resolution", "mark_sent");
                      start(async () => {
                        const r = await resolveAmbiguousExecutionAction(fd);
                        if (!r.ok) alert(r.error);
                        router.refresh();
                      });
                    }}
                  >
                    Mark as sent (no resend)
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {items.failedExecutions.length ? (
        <div>
          <h3 className="text-sm font-semibold">Failed executions ({items.failedExecutions.length})</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {items.failedExecutions.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded border bg-white px-3 py-2">
                <div>
                  <Link
                    href={`/admin/crm/contacts/${e.enrollment.contactId}`}
                    className="font-medium hover:underline"
                  >
                    {e.enrollment.sequence.name}
                  </Link>
                  <p className="text-neutral-600">{e.failureCode ?? "Failed"}</p>
                </div>
                {canSend && e.failureCategory !== "AMBIGUOUS_DO_NOT_AUTO_RETRY" ? (
                  <button
                    type="button"
                    disabled={pending}
                    className="admin-btn admin-btn-secondary text-xs"
                    onClick={() => {
                      if (!window.confirm("Retry this failed execution?")) return;
                      const fd = new FormData();
                      fd.set("executionId", e.id);
                      start(async () => {
                        const r = await retryFailedExecutionAction(fd);
                        if (!r.ok) alert(r.error);
                        router.refresh();
                      });
                    }}
                  >
                    Retry
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-xs text-neutral-600">
        Paused enrollments: {items.pausedEnrollments} · Failed enrollments: {items.failedEnrollments}
      </p>
    </AdminPanel>
  );
}
