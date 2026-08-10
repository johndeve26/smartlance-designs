"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { installStarterTemplatesAction } from "@/lib/admin/agency-actions";

export function InstallStarterTemplatesButton() {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="admin-btn admin-btn-secondary"
      onClick={() => {
        start(async () => {
          const result = await installStarterTemplatesAction();
          if (!result.ok) {
            alert(result.error);
            return;
          }
          router.refresh();
        });
      }}
    >
      {pending ? "Installing…" : "Install starter templates"}
    </button>
  );
}
