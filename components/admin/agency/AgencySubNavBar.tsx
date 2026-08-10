"use client";

import { cn } from "@/lib/utils";

/** @deprecated Primary agency navigation lives in Admin sidebar. Templates use agency layout. */
export function AgencySubNavBar() {
  return null;
}

export function AgencyBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const tones = {
    neutral: "bg-neutral-100 text-neutral-700",
    success: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-900",
    danger: "bg-red-100 text-red-800",
  };
  return (
    <span className={cn("inline-flex rounded px-2 py-0.5 text-xs font-medium", tones[tone])}>
      {children}
    </span>
  );
}
