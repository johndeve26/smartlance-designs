"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { saveSequenceAction } from "@/lib/admin/crm-outreach-actions";

const DEFAULT_STEPS = [
  {
    type: "EMAIL" as const,
    delayDays: 0,
    delayMinutes: 0,
    subject: "Quick intro — Smartlance Designs",
    body: "Hi {{firstName}},\n\nI wanted to reach out from Smartlance Designs.\n\nBest,\n{{senderName}}",
    taskAdvanceMode: "AUTO_CONTINUE" as const,
  },
  {
    type: "WAIT" as const,
    delayDays: 3,
    delayMinutes: 0,
    taskAdvanceMode: "AUTO_CONTINUE" as const,
  },
  {
    type: "TASK" as const,
    delayDays: 0,
    delayMinutes: 0,
    taskTitle: "Review prospect before follow-up",
    taskDescription: "Check website and notes before next email.",
    taskAdvanceMode: "WAIT_FOR_TASK_COMPLETION" as const,
  },
  {
    type: "EMAIL" as const,
    delayDays: 2,
    delayMinutes: 0,
    subject: "Following up",
    body: "Hi {{firstName}},\n\nJust following up on my previous note.\n\nBest,\n{{senderName}}",
    taskAdvanceMode: "AUTO_CONTINUE" as const,
  },
];

export function SequenceForm({ sequenceId }: { sequenceId?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <form
      className="mt-4 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        if (sequenceId) fd.set("id", sequenceId);
        fd.set("stepsJson", JSON.stringify(DEFAULT_STEPS));
        start(async () => {
          const r = await saveSequenceAction(fd);
          if (!r.ok) alert(r.error);
          else if (r.id) router.push(`/admin/crm/sequences/${r.id}`);
          else router.refresh();
        });
      }}
    >
      <input name="name" required placeholder="Sequence name" className="admin-input w-full" />
      <input name="description" placeholder="Description" className="admin-input w-full" />
      <p className="text-xs text-neutral-500">
        Default template: Email → Wait 3d → Review task → Wait 2d → Follow-up email
      </p>
      <button type="submit" disabled={pending} className="admin-btn admin-btn-primary">
        {sequenceId ? "Save as new draft steps" : "Create sequence"}
      </button>
    </form>
  );
}
