"use client";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  bulkEnrollAction,
  bulkEnrollPreviewAction,
} from "@/lib/admin/crm-outreach-actions";

type BulkEnrollPreview = Awaited<ReturnType<typeof bulkEnrollPreviewAction>>;

export function SegmentEnrollPanel({
  contactIds,
}: {
  contactIds: string[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [sequenceId, setSequenceId] = useState("");
  const [summary, setSummary] = useState<BulkEnrollPreview | null>(null);

  return (
    <AdminPanel className="space-y-3">
      <h2 className="font-semibold">Enroll in sequence</h2>
      <input
        value={sequenceId}
        onChange={(e) => setSequenceId(e.target.value)}
        placeholder="Sequence ID"
        className="admin-input w-full"
      />
      <button
        type="button"
        className="admin-btn admin-btn-secondary text-sm"
        disabled={!sequenceId || pending}
        onClick={() => {
          start(async () => {
            const s = await bulkEnrollPreviewAction({ sequenceId, contactIds });
            setSummary(s);
          });
        }}
      >
        Review eligibility
      </button>
      {summary ? (
        <div className="text-sm text-neutral-700">
          <p>Total: {summary.total}</p>
          <p>Eligible: {summary.eligible}</p>
          <p>Suppressed: {summary.suppressed}</p>
          <p>No email: {summary.noEmail}</p>
          <p>Already enrolled: {summary.alreadyEnrolled}</p>
        </div>
      ) : null}
      <button
        type="button"
        className="admin-btn admin-btn-primary text-sm"
        disabled={!sequenceId || pending || !summary?.eligible}
        onClick={() => {
          if (!window.confirm(`Enroll ${summary?.eligible ?? 0} contacts?`)) return;
          start(async () => {
            const eligibleIds =
              summary?.details.filter((d: BulkEnrollPreview["details"][number]) => d.eligible).map((d) => d.contactId) ?? [];
            const r = await bulkEnrollAction({ sequenceId, contactIds: eligibleIds });
            if (!r.ok) alert("Enrollment had failures.");
            router.refresh();
          });
        }}
      >
        Confirm enrollment
      </button>
    </AdminPanel>
  );
}
