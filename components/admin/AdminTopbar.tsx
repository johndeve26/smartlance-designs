"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import type { RefObject } from "react";
import type { SessionUser } from "@/lib/admin/session";
import type { AdminBreadcrumb } from "@/lib/admin/navigation-active";
import { roleLabel } from "@/lib/admin/rbac";
import { logoutAction } from "@/lib/admin/auth-actions";
import { ViewSiteLink } from "@/components/admin/AdminSidebarNav";

type AdminTopbarProps = {
  breadcrumbs: AdminBreadcrumb[];
  pageTitle: string;
  user: SessionUser | null;
  isDev: boolean;
  mobileOpen: boolean;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
  onToggleMobile: () => void;
};

export function AdminTopbar({
  breadcrumbs,
  pageTitle,
  user,
  isDev,
  mobileOpen,
  menuButtonRef,
  onToggleMobile,
}: AdminTopbarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-neutral-200 bg-white px-4 lg:px-5">
      <button
        ref={menuButtonRef}
        type="button"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 lg:hidden"
        aria-expanded={mobileOpen}
        aria-controls="admin-mobile-drawer"
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        onClick={onToggleMobile}
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        <nav aria-label="Breadcrumb" className="hidden sm:block">
          <ol className="flex flex-wrap items-center gap-1 text-sm text-neutral-500">
            {breadcrumbs.map((crumb, i) => (
              <li key={`${crumb.label}-${i}`} className="flex items-center gap-1">
                {i > 0 ? <span className="text-neutral-300">/</span> : null}
                {crumb.href && i < breadcrumbs.length - 1 ? (
                  <Link href={crumb.href} className="hover:text-neutral-900">
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={
                      i === breadcrumbs.length - 1
                        ? "font-medium text-neutral-900"
                        : undefined
                    }
                  >
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <p className="truncate text-sm font-medium text-neutral-900 sm:hidden">
          {pageTitle}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <ViewSiteLink className="hidden md:inline-flex" />
        <span
          className={`hidden rounded px-2 py-0.5 text-xs font-semibold sm:inline ${
            isDev ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
          }`}
        >
          {isDev ? "Dev" : "Prod"}
        </span>
        {user ? (
          <div className="flex items-center gap-2 border-l border-neutral-200 pl-3">
            <div className="hidden text-right text-xs leading-tight sm:block">
              <p className="font-medium text-neutral-900">{user.name}</p>
              <p className="text-neutral-500">{roleLabel(user.role)}</p>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Sign out
              </button>
            </form>
          </div>
        ) : (
          <span className="text-xs text-neutral-500">Not signed in</span>
        )}
      </div>
    </header>
  );
}
