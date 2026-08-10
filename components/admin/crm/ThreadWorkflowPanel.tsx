"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  assignThreadAction,
  snoozeThreadAction,
  closeThreadAction,
  reopenThreadAction,
} from "@/lib/admin/crm-inbox-actions";

function snoozeLaterToday(): Date {
  const d = new Date();
  d.setUTCHours(18, 0, 0, 0);
  if (d.getTime() <= Date.now()) {
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return d;
}

function snoozeTomorrowMorning(): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  d.setUTCHours(9, 0, 0, 0);
  return d;
}

function snoozeDays(days: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(9, 0, 0, 0);
  return d;
}

export function ThreadWorkflowPanel({
  threadId,
  workflowStatus,
  assignedToId,
  owners,
  canManage,
}: {
  threadId: string;
  workflowStatus: string;
  assignedToId: string | null;
  owners: Array<{ id: string; name: string }>;
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [customOpen, setCustomOpen] = useState(false);
  const [customDate, setCustomDate] = useState("");
  const [snoozeError, setSnoozeError] = useState<string | null>(null);

  if (!canManage) return null;

  function applySnooze(until: Date) {
    setSnoozeError(null);
    start(async () => {
      const res = await snoozeThreadAction({ threadId, snoozedUntil: until.toISOString() });
      if (!res.ok) {
        setSnoozeError(res.error);
        return;
      }
      setCustomOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded bg-neutral-100 px-2 py-1 font-medium">
          {workflowStatus.replace(/_/g, " ")}
        </span>
        <select
          className="admin-input text-sm"
          value={assignedToId ?? ""}
          disabled={pending}
          onChange={(e) => {
            start(async () => {
              await assignThreadAction({
                threadId,
                assignedToId: e.target.value || null,
              });
              router.refresh();
            });
          }}
        >
          <option value="">Unassigned</option>
          {owners.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
        <button type="button" className="admin-btn admin-btn-secondary text-sm" disabled={pending} onClick={() => applySnooze(snoozeLaterToday())}>
          Later today
        </button>
        <button type="button" className="admin-btn admin-btn-secondary text-sm" disabled={pending} onClick={() => applySnooze(snoozeTomorrowMorning())}>
          Tomorrow
        </button>
        <button type="button" className="admin-btn admin-btn-secondary text-sm" disabled={pending} onClick={() => applySnooze(snoozeDays(3))}>
          3 days
        </button>
        <button type="button" className="admin-btn admin-btn-secondary text-sm" disabled={pending} onClick={() => applySnooze(snoozeDays(7))}>
          1 week
        </button>
        <button
          type="button"
          className="admin-btn admin-btn-secondary text-sm"
          disabled={pending}
          onClick={() => setCustomOpen((v) => !v)}
        >
          Custom
        </button>
        {workflowStatus === "CLOSED" ? (
          <button
            type="button"
            className="admin-btn admin-btn-secondary text-sm"
            disabled={pending}
            onClick={() => {
              start(async () => {
                await reopenThreadAction({ threadId });
                router.refresh();
              });
            }}
          >
            Reopen
          </button>
        ) : (
          <button
            type="button"
            className="admin-btn admin-btn-secondary text-sm"
            disabled={pending}
            onClick={() => {
              start(async () => {
                await closeThreadAction({ threadId });
                router.refresh();
              });
            }}
          >
            Close
          </button>
        )}
      </div>
      {snoozeError ? <p className="text-sm text-red-700">{snoozeError}</p> : null}
      {customOpen ? (
        <div className="flex flex-wrap items-end gap-2 text-sm">
          <label>
            <span className="text-neutral-600">Snooze until</span>
            <input
              type="datetime-local"
              className="admin-input ml-2"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="admin-btn admin-btn-primary text-sm"
            disabled={pending || !customDate}
            onClick={() => applySnooze(new Date(customDate))}
          >
            Apply
          </button>
        </div>
      ) : null}
    </div>
  );
}
