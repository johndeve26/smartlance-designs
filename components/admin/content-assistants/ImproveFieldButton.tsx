"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateContentProposalAction } from "@/lib/admin/ai-content-assistant-actions";

/** Restrained tertiary control for prose fields — type-specific field improve. */
export function ImproveFieldButton({
  entityType,
  entityId,
  field,
  label = "Improve with AI",
}: {
  entityType: "SERVICE" | "SOLUTION" | "PLATFORM" | "INDUSTRY" | "WORK";
  entityId: string;
  field: string;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!entityId) return null;

  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <button
        type="button"
        className="text-xs text-neutral-500 underline-offset-2 hover:text-[#F47A48] hover:underline disabled:opacity-50"
        disabled={pending}
        aria-busy={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              const fd = new FormData();
              fd.set("entityType", entityType);
              fd.set("entityId", entityId);
              fd.set("action", `IMPROVE_FIELD:${field}`);
              fd.set("forceHeuristic", "1");
              await generateContentProposalAction(fd);
              router.refresh();
            } catch (e) {
              setError(
                e instanceof Error
                  ? e.message
                  : "Field improve failed. Nothing was changed.",
              );
            }
          });
        }}
      >
        {pending ? "Improving…" : label}
      </button>
      {error && (
        <span role="alert" className="text-[11px] text-red-700">
          {error}
        </span>
      )}
    </span>
  );
}
