import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  tone?: "default" | "accent" | "success" | "warning" | "placeholder";
  className?: string;
};

const tones = {
  default: "bg-surface-muted text-foreground",
  accent: "bg-accent-soft text-accent-text",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  placeholder: "bg-warning-soft text-warning border border-warning/20",
} as const;

export function Badge({
  children,
  tone = "default",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
