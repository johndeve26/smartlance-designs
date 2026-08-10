import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const tones = {
  info: "border-info/20 bg-info-soft text-foreground",
  success: "border-success/20 bg-success-soft text-foreground",
  warning: "border-warning/20 bg-warning-soft text-foreground",
  error: "border-error/20 bg-error-soft text-foreground",
  neutral: "border-border bg-surface-muted text-foreground",
} as const;

type AlertProps = {
  tone?: keyof typeof tones;
  title?: string;
  children: ReactNode;
  className?: string;
};

export function Alert({ tone = "neutral", title, children, className }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn("rounded-lg border px-4 py-3 text-sm", tones[tone], className)}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      <div className={title ? "mt-1" : undefined}>{children}</div>
    </div>
  );
}
