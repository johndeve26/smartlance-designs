"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { resolveAmbiguousThreadReplyAction } from "@/lib/admin/crm-inbox-actions";

export function ThreadDeliveryWarning({
  emailId,
  canManage,
}: {
  emailId: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  if (!canManage) {
    return (
      <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        Delivery unconfirmed — operator review required.
      </div>
    );
  }

  return (
    <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
      <p className="font-medium">Delivery unconfirmed</p>
      <p className="mt-1">
        This reply may or may not have been delivered. Do not treat the conversation as waiting on
        the contact until resolved.
      </p>
      <button
        type="button"
        className="admin-btn admin-btn-secondary mt-2 text-xs"
        disabled={pending}
        onClick={() => {
          start(async () => {
            await resolveAmbiguousThreadReplyAction({ emailId });
            router.refresh();
          });
        }}
      >
        {pending ? "Saving…" : "Mark as sent (no resend)"}
      </button>
    </div>
  );
}
