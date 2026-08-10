"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import type { AdminNavGroupDef } from "@/lib/admin/navigation";
import {
  activeAdminNavGroupId,
  activeAdminNavItemId,
  isAdminNavItemActive,
} from "@/lib/admin/navigation-active";
import { adminNavIcons } from "@/components/admin/AdminSidebarNav";
import { cn } from "@/lib/utils";

const COLLAPSED_GROUPS_KEY = "admin-sidebar-collapsed-groups";

type AdminSidebarProps = {
  groups: AdminNavGroupDef[];
  badgeCounts?: { enquiries?: number; inbox?: number; support?: number };
  collapsed?: boolean;
  onNavigate?: () => void;
};

export function AdminSidebar({
  groups,
  badgeCounts = {},
  collapsed = false,
  onNavigate,
}: AdminSidebarProps) {
  const pathname = usePathname() ?? "";
  const activeId = activeAdminNavItemId(pathname);
  const activeGroupId = activeAdminNavGroupId(pathname);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COLLAPSED_GROUPS_KEY);
      if (raw) setCollapsedGroups(new Set(JSON.parse(raw) as string[]));
    } catch {
      /* ignore */
    }
  }, []);

  function toggleGroup(groupId: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      try {
        localStorage.setItem(COLLAPSED_GROUPS_KEY, JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  function badgeFor(itemId: string, badge?: string) {
    if (badge === "enquiries" && badgeCounts.enquiries) return badgeCounts.enquiries;
    if (badge === "inbox" && badgeCounts.inbox) return badgeCounts.inbox;
    if (badge === "support" && badgeCounts.support) return badgeCounts.support;
    if (itemId === "enquiries" && badgeCounts.enquiries) return badgeCounts.enquiries;
    return null;
  }

  return (
    <nav aria-label="Admin" className="space-y-4">
      {groups.map((group) => {
        const isGroupCollapsed =
          group.collapsible &&
          collapsedGroups.has(group.id) &&
          group.id !== activeGroupId;

        return (
          <div key={group.id}>
            {!collapsed ? (
              group.collapsible ? (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="mb-1 flex w-full items-center justify-between px-2 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-white/40 hover:text-white/60"
                >
                  {group.label}
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 transition-transform",
                      isGroupCollapsed && "-rotate-90",
                    )}
                  />
                </button>
              ) : (
                <p className="mb-1.5 px-2 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-white/40">
                  {group.label}
                </p>
              )
            ) : (
              <div className="mb-2 border-t border-white/10 first:border-0 first:pt-0" />
            )}

            {!isGroupCollapsed ? (
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = adminNavIcons[item.id] ?? adminNavIcons.dashboard!;
                  const active =
                    activeId === item.id || isAdminNavItemActive(pathname, item.id);
                  const badge = badgeFor(item.id, item.badge);

                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        title={collapsed ? item.label : undefined}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "admin-nav-link relative flex items-center gap-2.5",
                          collapsed && "justify-center px-2",
                          active && "admin-nav-link-active",
                        )}
                        data-active={active ? "true" : "false"}
                      >
                        <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                        {!collapsed ? (
                          <>
                            <span className="min-w-0 flex-1 truncate">{item.label}</span>
                            {badge ? (
                              <span className="rounded bg-[var(--admin-accent)] px-1.5 py-0.5 text-[0.6rem] font-bold text-white">
                                {badge > 99 ? "99+" : badge}
                              </span>
                            ) : null}
                          </>
                        ) : badge ? (
                          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[var(--admin-accent)]" />
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
