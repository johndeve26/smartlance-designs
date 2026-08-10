import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 text-subtle [&_svg]:h-8 [&_svg]:w-8">{icon}</div>
      ) : null}
      <h3 className="text-card-title">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-sm text-body-sm">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
