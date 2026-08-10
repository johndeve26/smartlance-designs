"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { completeTaskAction } from "@/lib/admin/crm-actions";

export function TaskCompleteButton({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="admin-btn admin-btn-secondary text-sm"
      onClick={() => {
        const fd = new FormData();
        fd.set("taskId", taskId);
        start(async () => {
          const r = await completeTaskAction(fd);
          if (!r.ok) alert(r.error);
          else router.refresh();
        });
      }}
    >
      Complete
    </button>
  );
}
