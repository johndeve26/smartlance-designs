import type { ReactNode } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import type { StatusDomain } from "@/lib/ui/status";
import { cn } from "@/lib/utils";

type AdminDetailHeaderProps = {
  title: string;
  subtitle?: string;
  status?: { domain: StatusDomain; value: string };
  primaryAction?: ReactNode;
  secondaryActions?: ReactNode;
  tabs?: ReactNode;
  className?: string;
};

export function AdminDetailHeader({
  title,
  subtitle,
  status,
  primaryAction,
  secondaryActions,
  tabs,
  className,
}: AdminDetailHeaderProps) {
  return (
    <header className={cn("space-y-4 border-b border-border pb-5", className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-page-title">{title}</h1>
            {status ? (
              <StatusBadge domain={status.domain} value={status.value} audience="admin" />
            ) : null}
          </div>
          {subtitle ? <p className="text-body-sm">{subtitle}</p> : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {secondaryActions}
          {primaryAction}
        </div>
      </div>
      {tabs}
    </header>
  );
}
