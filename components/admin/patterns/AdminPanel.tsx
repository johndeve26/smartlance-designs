import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AdminPanelProps = {
  children: ReactNode;
  className?: string;
  /** When true, removes default padding (e.g. for tables). */
  flush?: boolean;
};

/** Section panel — replaces legacy `.admin-card` with design-system surfaces. */
export function AdminPanel({ children, className, flush }: AdminPanelProps) {
  return (
    <section
      className={cn(
        "rounded-lg border border-border bg-surface",
        flush ? "overflow-hidden" : "p-4 sm:p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}

type AdminSectionProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function AdminSection({
  title,
  description,
  action,
  children,
  className,
}: AdminSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      {title ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-section-heading">{title}</h2>
            {description ? (
              <p className="mt-1 text-body-sm">{description}</p>
            ) : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}
