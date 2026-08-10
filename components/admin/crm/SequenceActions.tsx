"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  activateSequenceAction,
  pauseSequenceAction,
  runSchedulerAction,
} from "@/lib/admin/crm-outreach-actions";

export function SequenceActions({
  sequenceId,
  status,
  canSend,
}: {
  sequenceId: string;
  status: string;
  canSend: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      {status === "DRAFT" && canSend ? (
        <button
          type="button"
          disabled={pending}
          className="admin-btn admin-btn-primary text-sm"
          onClick={() => {
            const fd = new FormData();
            fd.set("id", sequenceId);
            start(async () => {
              const r = await activateSequenceAction(fd);
              if (!r.ok) alert(r.error);
              else router.refresh();
            });
          }}
        >
          Activate
        </button>
      ) : null}
      {status === "ACTIVE" ? (
        <button
          type="button"
          disabled={pending}
          className="admin-btn admin-btn-secondary text-sm"
          onClick={() => {
            const fd = new FormData();
            fd.set("id", sequenceId);
            start(async () => {
              await pauseSequenceAction(fd);
              router.refresh();
            });
          }}
        >
          Pause sequence
        </button>
      ) : null}
      {canSend ? (
        <button
          type="button"
          disabled={pending}
          className="admin-btn admin-btn-secondary text-sm"
          onClick={() => {
            start(async () => {
              const r = await runSchedulerAction();
              if (r.ok) alert(`Scheduler: sent ${r.result.sent}, skipped ${r.result.skipped}`);
              router.refresh();
            });
          }}
        >
          Run scheduler now
        </button>
      ) : null}
    </div>
  );
}
