"use client";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createThreadFollowUpTaskAction } from "@/lib/admin/crm-inbox-actions";
import { formatDateTime } from "@/lib/crm/display";

export function ThreadFollowUpPanel({
  threadId,
  defaultTitle,
  defaultAssigneeId,
  owners,
  nextFollowUp,
  canManage,
}: {
  threadId: string;
  defaultTitle: string;
  defaultAssigneeId: string | null;
  owners: Array<{ id: string; name: string }>;
  nextFollowUp: {
    id: string;
    title: string;
    dueAt: Date | null;
    assignedTo: { name: string } | null;
  } | null;
  canManage: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!canManage) return null;

  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(9, 0, 0, 0);
  const defaultDue = tomorrow.toISOString().slice(0, 16);

  return (
    <AdminPanel className=" space-y-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">Follow-up</h2>
        <button
          type="button"
          className="admin-btn admin-btn-secondary text-xs"
          disabled={pending}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Cancel" : "Create follow-up task"}
        </button>
      </div>

      {nextFollowUp ? (
        <div className="rounded border px-3 py-2 text-sm">
          <p className="font-medium">{nextFollowUp.title}</p>
          <p className="text-neutral-600">
            Due {nextFollowUp.dueAt ? formatDateTime(nextFollowUp.dueAt) : "—"}
            {nextFollowUp.assignedTo ? ` · ${nextFollowUp.assignedTo.name}` : ""}
          </p>
          <a href={`/admin/crm/tasks`} className="text-xs underline">
            Open tasks
          </a>
        </div>
      ) : (
        <p className="text-xs text-neutral-500">No upcoming follow-up task for this conversation.</p>
      )}

      {open ? (
        <form
          className="space-y-2 border-t pt-3 text-sm"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            const fd = new FormData(e.currentTarget);
            start(async () => {
              const res = await createThreadFollowUpTaskAction({
                threadId,
                title: String(fd.get("title") || ""),
                description: String(fd.get("description") || "") || undefined,
                dueAt: String(fd.get("dueAt") || ""),
                assignedToId: String(fd.get("assignedToId") || "") || undefined,
                priority: (String(fd.get("priority") || "NORMAL") as "LOW" | "NORMAL" | "HIGH"),
              });
              if (!res.ok) {
                setError(res.error);
                return;
              }
              setOpen(false);
              router.refresh();
            });
          }}
        >
          {error ? <p className="text-red-700">{error}</p> : null}
          <label className="block">
            <span className="text-neutral-600">Title</span>
            <input name="title" defaultValue={defaultTitle} className="admin-input mt-1 w-full" required />
          </label>
          <label className="block">
            <span className="text-neutral-600">Due</span>
            <input
              name="dueAt"
              type="datetime-local"
              defaultValue={defaultDue}
              className="admin-input mt-1 w-full"
              required
            />
          </label>
          <label className="block">
            <span className="text-neutral-600">Assignee</span>
            <select name="assignedToId" defaultValue={defaultAssigneeId ?? ""} className="admin-input mt-1 w-full">
              {owners.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-neutral-600">Priority</span>
            <select name="priority" defaultValue="NORMAL" className="admin-input mt-1 w-full">
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
            </select>
          </label>
          <label className="block">
            <span className="text-neutral-600">Notes (optional)</span>
            <textarea name="description" className="admin-input mt-1 min-h-[60px] w-full" />
          </label>
          <button type="submit" className="admin-btn admin-btn-primary text-sm" disabled={pending}>
            {pending ? "Saving…" : "Save follow-up task"}
          </button>
        </form>
      ) : null}
    </AdminPanel>
  );
}
