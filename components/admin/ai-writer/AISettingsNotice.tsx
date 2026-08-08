"use client";

import { useEffect, useState } from "react";

export function AISettingsNotice({
  message,
  tone = "success",
}: {
  message: string;
  tone?: "success" | "warning" | "danger";
}) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(() => setDismissed(true), 5000);
    return () => window.clearTimeout(t);
  }, [message]);

  if (dismissed || !message) return null;

  const toneClass =
    tone === "danger"
      ? "border-red-200 bg-red-50 text-red-900"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-950"
        : "border-emerald-200 bg-emerald-50 text-emerald-900";

  return (
    <div
      role="status"
      className={`flex items-start justify-between gap-3 rounded-md border px-3 py-2 text-sm ${toneClass}`}
    >
      <p>{message}</p>
      <button
        type="button"
        className="shrink-0 text-xs underline-offset-2 hover:underline"
        onClick={() => setDismissed(true)}
      >
        Dismiss
      </button>
    </div>
  );
}
