"use client";

import { useTransition } from "react";
import { createChangeRequestAction } from "@/lib/admin/change-request-actions";

export function CreateChangeRequestForm({ projectId }: { projectId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mt-4 space-y-2 border-b pb-4"
      action={(fd) => {
        startTransition(() => createChangeRequestAction(fd));
      }}
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="submit" value="true" />
      <input name="title" placeholder="Change title" className="admin-input w-full" required />
      <textarea
        name="requestDescription"
        placeholder="What change is being requested?"
        className="admin-input w-full"
        rows={3}
        required
      />
      <button type="submit" disabled={pending} className="admin-btn admin-btn-primary">
        New change request
      </button>
    </form>
  );
}
