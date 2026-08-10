import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const toneStyles = {
  warning: "border-l-warning bg-warning-soft/40",
  danger: "border-l-error bg-error-soft/40",
  info: "border-l-accent bg-brand-soft/40",
} as const;

type AdminAttentionListProps = {
  items: Array<{
    id: string;
    label: string;
    detail: string;
    href: string;
    tone: keyof typeof toneStyles;
  }>;
};

export function AdminAttentionList({ items }: AdminAttentionListProps) {
  if (!items.length) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-surface px-4 py-6 text-sm text-muted">
        Nothing needs immediate attention. You&apos;re caught up.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={item.href}
            className={cn(
              "flex items-center justify-between gap-4 border-l-4 px-4 py-3 transition-colors hover:bg-surface-muted/50",
              toneStyles[item.tone],
            )}
          >
            <div className="min-w-0">
              <p className="font-medium text-foreground">{item.label}</p>
              <p className="text-sm text-muted">{item.detail}</p>
            </div>
            <span className="shrink-0 text-sm font-medium text-accent-text">View</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

type AdminStatGridProps = {
  stats: Array<{ label: string; value: number | string; href?: string }>;
};

export function AdminStatGrid({ stats }: AdminStatGridProps) {
  if (!stats.length) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const inner = (
          <>
            <p className="text-sm text-muted">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
              {stat.value}
            </p>
          </>
        );

        return stat.href ? (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-strong hover:bg-surface-muted/30"
          >
            {inner}
          </Link>
        ) : (
          <div
            key={stat.label}
            className="rounded-lg border border-border bg-surface p-4"
          >
            {inner}
          </div>
        );
      })}
    </div>
  );
}

type AdminSectionProps = {
  title: string;
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
    <section className={className}>
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-section-heading">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-sm text-muted">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
