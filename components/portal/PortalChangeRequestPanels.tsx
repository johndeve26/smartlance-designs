"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  approveChangeRequestAction,
  declineChangeRequestAction,
  respondToClarificationAction,
  submitPortalChangeRequestAction,
} from "@/lib/portal/change-request-actions";

export function PortalChangeRequestForm({ projectId }: { projectId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <form
      className="space-y-3 rounded border p-4"
      action={(fd) => {
        startTransition(async () => {
          fd.set("projectId", projectId);
          const result = await submitPortalChangeRequestAction(fd);
          if (result.ok) router.refresh();
        });
      }}
    >
      <h2 className="font-semibold">Request a change</h2>
      <p className="text-sm text-neutral-600">
        Smartlance will review whether your request affects scope, price, or timeline.
      </p>
      <input name="title" placeholder="What would you like changed?" className="w-full rounded border px-3 py-2 text-sm" required />
      <textarea
        name="requestDescription"
        placeholder="Why? Any deadline or context?"
        className="w-full rounded border px-3 py-2 text-sm"
        rows={4}
        required
      />
      <button type="submit" disabled={pending} className="rounded bg-neutral-900 px-4 py-2 text-sm text-white">
        Submit change request
      </button>
    </form>
  );
}

export function PortalChangeApprovalActions({ changeRequestId }: { changeRequestId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="space-y-3 rounded border border-amber-200 bg-amber-50 p-4">
      <h3 className="font-semibold">Your approval is required</h3>
      <p className="text-sm">
        By approving, you confirm the stated scope, price, and timeline impact for this change.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          className="rounded bg-neutral-900 px-4 py-2 text-sm text-white"
          onClick={() =>
            startTransition(async () => {
              await approveChangeRequestAction(changeRequestId);
              router.refresh();
            })
          }
        >
          Approve change
        </button>
        <form
          action={(fd) => {
            startTransition(async () => {
              fd.set("changeRequestId", changeRequestId);
              await declineChangeRequestAction(fd);
              router.refresh();
            });
          }}
          className="flex gap-2"
        >
          <input name="comment" placeholder="Reason (optional)" className="rounded border px-2 py-1 text-sm" />
          <button type="submit" disabled={pending} className="rounded border px-4 py-2 text-sm">
            Decline
          </button>
        </form>
      </div>
    </div>
  );
}

export function PortalClarificationForm({ changeRequestId }: { changeRequestId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <form
      className="space-y-2 rounded border p-4"
      action={(fd) => {
        startTransition(async () => {
          fd.set("changeRequestId", changeRequestId);
          await respondToClarificationAction(fd);
          router.refresh();
        });
      }}
    >
      <h3 className="font-semibold">Clarification requested</h3>
      <textarea name="message" rows={3} className="w-full rounded border px-3 py-2 text-sm" required />
      <button type="submit" disabled={pending} className="rounded bg-neutral-900 px-4 py-2 text-sm text-white">
        Send response
      </button>
    </form>
  );
}
