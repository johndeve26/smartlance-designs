"use client";

import { useTransition } from "react";
import {
  reviewOnboardingResponseAction,
  reviewRequirementAction,
} from "@/lib/admin/onboarding-actions";

export function OnboardingReviewPanel({
  kind,
  id,
  expectedUpdatedAt,
}: {
  kind: "response" | "requirement";
  id: string;
  expectedUpdatedAt: string;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <form
        action={(fd) => {
          start(async () => {
            fd.set("expectedUpdatedAt", expectedUpdatedAt);
            if (kind === "response") {
              fd.set("responseId", id);
              fd.set("decision", "ACCEPTED");
              await reviewOnboardingResponseAction(fd);
            } else {
              fd.set("requirementId", id);
              fd.set("decision", "ACCEPTED");
              await reviewRequirementAction(fd);
            }
          });
        }}
      >
        <button type="submit" disabled={pending} className="admin-btn admin-btn-secondary text-xs">
          Accept
        </button>
      </form>
      <form
        className="flex items-center gap-1"
        action={(fd) => {
          start(async () => {
            fd.set("expectedUpdatedAt", expectedUpdatedAt);
            const note = fd.get("reviewNote") || fd.get("clientReviewNote");
            if (!note) {
              alert("Add a clarification note.");
              return;
            }
            if (kind === "response") {
              fd.set("responseId", id);
              fd.set("decision", "NEEDS_CLARIFICATION");
              await reviewOnboardingResponseAction(fd);
            } else {
              fd.set("requirementId", id);
              fd.set("decision", "NEEDS_CLARIFICATION");
              await reviewRequirementAction(fd);
            }
          });
        }}
      >
        <input
          name={kind === "response" ? "reviewNote" : "clientReviewNote"}
          placeholder="Clarification note"
          className="admin-input text-xs"
        />
        <button type="submit" disabled={pending} className="admin-btn admin-btn-secondary text-xs">
          Needs clarification
        </button>
      </form>
    </div>
  );
}
