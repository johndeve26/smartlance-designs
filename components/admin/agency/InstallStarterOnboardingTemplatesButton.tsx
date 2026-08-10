"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { installStarterOnboardingTemplatesAction } from "@/lib/admin/onboarding-actions";

export function InstallStarterOnboardingTemplatesButton() {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="admin-btn admin-btn-secondary"
      onClick={() => {
        start(async () => {
          const result = await installStarterOnboardingTemplatesAction();
          if (!result.ok) {
            alert("error" in result ? result.error : "Install failed.");
            return;
          }
          router.refresh();
        });
      }}
    >
      {pending ? "Installing…" : "Install starter onboarding templates"}
    </button>
  );
}
