"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PortalNavGroup, PortalNavItem } from "@/lib/portal/navigation";
import { cn } from "@/lib/utils";

type PortalSidebarProps = {
  groups: PortalNavGroup[];
  footerNav: PortalNavItem[];
  attentionCount?: number;
};

export function PortalSidebar({
  groups,
  footerNav,
  attentionCount = 0,
}: PortalSidebarProps) {
  const pathname = usePathname() ?? "";

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function badgeFor(item: PortalNavItem) {
    if (item.badgeKey === "approvals" && attentionCount > 0) return attentionCount;
    return null;
  }

  return (
    <aside className="hidden w-56 shrink-0 border-r border-border bg-surface lg:flex lg:flex-col">
      <div className="border-b border-border px-5 py-5">
        <Link href="/portal" className="text-lg font-semibold tracking-tight text-foreground">
          Smartlance
        </Link>
        <p className="mt-0.5 text-xs text-subtle">Client portal</p>
      </div>
      <nav className="flex flex-1 flex-col gap-4 p-3">
        {groups.map((group) => (
          <div key={group.id}>
            {group.label ? (
              <p className="mb-1.5 px-3 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-subtle">
                {group.label}
              </p>
            ) : null}
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href, item.exact);
                const badge = badgeFor(item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-brand-soft text-foreground"
                        : "text-muted hover:bg-surface-muted",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                    {badge ? (
                      <span className="rounded-full bg-cta px-2 py-0.5 text-xs text-cta-foreground">
                        {badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-border p-3">
        {footerNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-md px-3 py-2 text-sm text-muted hover:bg-surface-muted"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
