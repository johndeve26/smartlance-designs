"use client";

import { useTransition } from "react";
import { adminUnsubscribeSubscriberAction } from "@/lib/admin/audience-actions";
import type { SubscriberStatus } from "@prisma/client";

export function SubscriberDetailActions({
  id,
  status,
}: {
  id: string;
  status: SubscriberStatus;
}) {
  const [pending, start] = useTransition();

  if (status === "UNSUBSCRIBED") return null;

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        const fd = new FormData();
        fd.set("id", id);
        start(async () => {
          await adminUnsubscribeSubscriberAction(fd);
        });
      }}
      className="rounded border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
    >
      {pending ? "Updating…" : "Mark unsubscribed"}
    </button>
  );
}
