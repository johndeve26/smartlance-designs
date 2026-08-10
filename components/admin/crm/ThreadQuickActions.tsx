"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  updateLeadStatusAction,
  updateLeadTemperatureAction,
  updateEmailStatusAction,
} from "@/lib/admin/crm-actions";
import { createThreadFollowUpTaskAction } from "@/lib/admin/crm-inbox-actions";

export function ThreadQuickActions({
  threadId,
  leadId,
  contactId,
  defaultAssigneeId,
  canManage,
}: {
  threadId: string;
  leadId?: string | null;
  contactId: string;
  defaultAssigneeId: string | null;
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirmSuppress, setConfirmSuppress] = useState(false);
  const [badTimingOpen, setBadTimingOpen] = useState(false);
  const [createFollowUp, setCreateFollowUp] = useState(false);
  const [followUpDue, setFollowUpDue] = useState("");

  if (!canManage) return null;

  function setStatus(status: string) {
    if (!leadId) return;
    const fd = new FormData();
    fd.set("leadId", leadId);
    fd.set("status", status);
    start(async () => {
      await updateLeadStatusAction(fd);
      router.refresh();
    });
  }

  function setTemp(temperature: string) {
    if (!leadId) return;
    const fd = new FormData();
    fd.set("leadId", leadId);
    fd.set("temperature", temperature);
    start(async () => {
      await updateLeadTemperatureAction(fd);
      router.refresh();
    });
  }

  function suppressContact() {
    const fd = new FormData();
    fd.set("contactId", contactId);
    fd.set("emailStatus", "DO_NOT_EMAIL");
    start(async () => {
      await updateEmailStatusAction(fd);
      setConfirmSuppress(false);
      router.refresh();
    });
  }

  function applyBadTiming() {
    if (!leadId) return;
    start(async () => {
      const fd = new FormData();
      fd.set("leadId", leadId);
      fd.set("status", "BAD_TIMING");
      await updateLeadStatusAction(fd);
      if (createFollowUp && followUpDue) {
        await createThreadFollowUpTaskAction({
          threadId,
          dueAt: new Date(followUpDue).toISOString(),
          assignedToId: defaultAssigneeId ?? undefined,
        });
      }
      setBadTimingOpen(false);
      router.refresh();
    });
  }

  const defaultFollowUpDue = () => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + 14);
    d.setUTCHours(9, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-neutral-600">Human CRM actions</p>
      {leadId ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={pending} className="admin-btn admin-btn-secondary text-xs" onClick={() => setStatus("CONNECTED")}>Mark Connected</button>
          <button type="button" disabled={pending} className="admin-btn admin-btn-secondary text-xs" onClick={() => setStatus("QUALIFIED")}>Mark Qualified</button>
          <button
            type="button"
            disabled={pending}
            className="admin-btn admin-btn-secondary text-xs"
            onClick={() => {
              setBadTimingOpen((v) => !v);
              if (!followUpDue) setFollowUpDue(defaultFollowUpDue());
            }}
          >
            Bad Timing
          </button>
          <button type="button" disabled={pending} className="admin-btn admin-btn-secondary text-xs" onClick={() => setStatus("UNQUALIFIED")}>Not Interested</button>
          <button type="button" disabled={pending} className="admin-btn admin-btn-secondary text-xs" onClick={() => setTemp("WARM")}>Mark Warm</button>
        </div>
      ) : (
        <p className="text-xs text-neutral-500">Lead quick actions appear when an active Lead is linked.</p>
      )}

      {badTimingOpen && leadId ? (
        <div className="space-y-2 rounded border p-2 text-xs">
          <p>Mark lead as Bad Timing. Optionally schedule a follow-up task.</p>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={createFollowUp}
              onChange={(e) => setCreateFollowUp(e.target.checked)}
            />
            Create follow-up task
          </label>
          {createFollowUp ? (
            <input
              type="datetime-local"
              className="admin-input w-full"
              value={followUpDue}
              onChange={(e) => setFollowUpDue(e.target.value)}
            />
          ) : null}
          <div className="flex gap-2">
            <button type="button" disabled={pending} className="admin-btn admin-btn-primary text-xs" onClick={applyBadTiming}>
              Apply
            </button>
            <button type="button" className="admin-btn admin-btn-secondary text-xs" onClick={() => setBadTimingOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <a href={`/admin/crm/deals/new?contactId=${contactId}`} className="text-xs underline">
        Create deal
      </a>
      <div className="border-t pt-2">
        {!confirmSuppress ? (
          <button
            type="button"
            disabled={pending}
            className="admin-btn admin-btn-secondary text-xs text-red-700"
            onClick={() => setConfirmSuppress(true)}
          >
            Do not email
          </button>
        ) : (
          <div className="space-y-2 text-xs">
            <p>Future CRM outreach to this contact will be blocked. Active sequences will stop.</p>
            <div className="flex gap-2">
              <button type="button" disabled={pending} className="admin-btn admin-btn-primary text-xs" onClick={suppressContact}>
                Confirm suppression
              </button>
              <button type="button" className="admin-btn admin-btn-secondary text-xs" onClick={() => setConfirmSuppress(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
