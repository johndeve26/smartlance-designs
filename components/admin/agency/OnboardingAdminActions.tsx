"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  cancelOnboardingAction,
  completeOnboardingAction,
  reopenOnboardingAction,
  sendOnboardingReminderAction,
} from "@/lib/admin/onboarding-actions";

export function OnboardingAdminActions({
  onboardingId,
  projectId,
  status,
  readyToComplete,
}: {
  onboardingId: string;
  projectId: string;
  status: string;
  readyToComplete: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "COMPLETED" && status !== "CANCELLED" ? (
        <>
          <button
            type="button"
            disabled={pending || !readyToComplete}
            className="admin-btn admin-btn-primary"
            onClick={() =>
              start(async () => {
                const result = await completeOnboardingAction(onboardingId);
                if (!result.ok) alert(result.error);
                router.refresh();
              })
            }
          >
            Mark complete
          </button>
          <button
            type="button"
            disabled={pending}
            className="admin-btn admin-btn-secondary"
            onClick={() =>
              start(async () => {
                await sendOnboardingReminderAction(onboardingId);
                router.refresh();
              })
            }
          >
            Send reminder
          </button>
          <button
            type="button"
            disabled={pending}
            className="admin-btn admin-btn-secondary"
            onClick={() =>
              start(async () => {
                if (!confirm("Cancel this onboarding?")) return;
                await cancelOnboardingAction(onboardingId);
                router.refresh();
              })
            }
          >
            Cancel
          </button>
        </>
      ) : status === "COMPLETED" ? (
        <button
          type="button"
          disabled={pending}
          className="admin-btn admin-btn-secondary"
          onClick={() =>
            start(async () => {
              await reopenOnboardingAction(onboardingId);
              router.refresh();
            })
          }
        >
          Reopen
        </button>
      ) : null}
      <a href={`/portal/projects/${projectId}/onboarding`} className="admin-btn admin-btn-secondary">
        Portal preview
      </a>
    </div>
  );
}
