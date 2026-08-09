"use client";

import { useTransition } from "react";
import {
  portalApproveDeliverableAction,
  portalRequestChangesAction,
} from "@/lib/portal/actions";

export function PortalDeliverableReview({
  deliverableId,
  versionId,
  status,
}: {
  deliverableId: string;
  versionId?: string;
  status: string;
}) {
  const [pending, start] = useTransition();

  if (status !== "READY_FOR_REVIEW" && status !== "CHANGES_REQUESTED") {
    return null;
  }
  if (!versionId) return null;

  return (
    <div className="mt-3 space-y-2">
      <textarea
        id={`comment-${deliverableId}`}
        placeholder="Optional feedback"
        className="min-h-20 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          className="inline-flex h-10 items-center justify-center rounded bg-neutral-900 px-4 text-sm font-semibold text-white hover:bg-neutral-800"
          onClick={() => {
            const comment = (
              document.getElementById(`comment-${deliverableId}`) as HTMLTextAreaElement | null
            )?.value;
            const fd = new FormData();
            fd.set("deliverableId", deliverableId);
            fd.set("versionId", versionId);
            fd.set("comment", comment ?? "");
            start(async () => {
              const r = await portalApproveDeliverableAction(fd);
              if (!r.ok) alert(r.error);
              else window.location.reload();
            });
          }}
        >
          Approve
        </button>
        <button
          type="button"
          disabled={pending}
          className="inline-flex h-10 items-center justify-center rounded border border-neutral-300 bg-white px-4 text-sm font-semibold hover:bg-neutral-50"
          onClick={() => {
            const comment = (
              document.getElementById(`comment-${deliverableId}`) as HTMLTextAreaElement | null
            )?.value;
            const fd = new FormData();
            fd.set("deliverableId", deliverableId);
            fd.set("versionId", versionId);
            fd.set("comment", comment ?? "");
            start(async () => {
              const r = await portalRequestChangesAction(fd);
              if (!r.ok) alert(r.error);
              else window.location.reload();
            });
          }}
        >
          Request changes
        </button>
      </div>
    </div>
  );
}
