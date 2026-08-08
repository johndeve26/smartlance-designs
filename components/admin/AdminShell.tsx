"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import type { SessionUser } from "@/lib/admin/session";
import { logoutAction } from "@/lib/admin/auth-actions";
import { filterAdminNavigation } from "@/lib/admin/navigation-active";
import { adminBreadcrumbs } from "@/lib/admin/navigation-active";
import { roleLabel } from "@/lib/admin/rbac";
import type { AdminRole } from "@prisma/client";
import {
  AdminSidebarNav,
  ViewSiteLink,
} from "@/components/admin/AdminSidebarNav";
import "@/components/admin/admin.css";

const SIDEBAR_COLLAPSED_KEY = "admin-sidebar-collapsed";

type AdminShellProps = {
  user: SessionUser | null;
  isDev: boolean;
  newEnquiryCount?: number;
  children: ReactNode;
};

export function AdminShell({
  user,
  isDev,
  newEnquiryCount = 0,
  children,
}: AdminShellProps) {
  const pathname = usePathname() ?? "";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeMobile();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  const isLogin = pathname === "/admin/login";
  const isPreview = pathname.startsWith("/admin/preview");

  if (isLogin) {
    return (
      <div className="admin-root fixed inset-0 z-[200] overflow-auto bg-neutral-100">
        {children}
      </div>
    );
  }

  if (isPreview) {
    return (
      <>
        <div className="sticky top-0 z-[210] border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
          Preview mode — draft content, not indexed
        </div>
        {children}
      </>
    );
  }

  const role = user?.role as AdminRole | undefined;
  const visibleGroups = filterAdminNavigation(role);
  const breadcrumbs = adminBreadcrumbs(pathname);
  const pageTitle = breadcrumbs[breadcrumbs.length - 1]?.label ?? "Admin";

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  function closeMobile() {
    setMobileOpen(false);
    menuButtonRef.current?.focus();
  }

  return (
    <div className="admin-root fixed inset-0 z-[200] flex overflow-hidden bg-white">
      {/* Desktop sidebar */}
      <aside
        className={`admin-sidebar hidden shrink-0 flex-col border-r border-white/5 lg:flex ${
          collapsed ? "w-[4.25rem]" : "w-60"
        }`}
      >
        <div className="border-b border-white/10 px-3 py-3">
          <Link
            href="/admin"
            className={`block rounded-md px-2 py-1.5 hover:bg-white/5 ${
              collapsed ? "text-center" : ""
            }`}
          >
            <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#F47A48]">
              {collapsed ? "SL" : "Smartlance"}
            </div>
            {!collapsed ? (
              <div className="mt-0.5 text-sm font-medium text-white">Admin</div>
            ) : null}
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <AdminSidebarNav
            groups={visibleGroups}
            pathname={pathname}
            collapsed={collapsed}
            newEnquiryCount={newEnquiryCount}
          />
        </div>
        <div className="hidden border-t border-white/10 p-2 lg:block">
          <button
            type="button"
            onClick={toggleCollapsed}
            className="flex w-full items-center justify-center gap-2 rounded-md px-2 py-2 text-xs text-white/60 hover:bg-white/5 hover:text-white"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile drawer backdrop */}
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-[220] bg-black/40 lg:hidden"
          aria-label="Close menu"
          onClick={closeMobile}
        />
      ) : null}

      {/* Mobile drawer */}
      <aside
        id="admin-mobile-drawer"
        className={`admin-sidebar fixed inset-y-0 left-0 z-[230] flex w-[min(100%,18rem)] flex-col shadow-xl transition-transform lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!mobileOpen}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <Link href="/admin" onClick={closeMobile} className="min-w-0">
            <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#F47A48]">
              Smartlance
            </div>
            <div className="text-sm font-medium text-white">Admin</div>
          </Link>
          <button
            type="button"
            className="rounded-md p-2 text-white/80 hover:bg-white/10"
            aria-label="Close menu"
            onClick={closeMobile}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2" key={pathname}>
          <AdminSidebarNav
            groups={visibleGroups}
            pathname={pathname}
            newEnquiryCount={newEnquiryCount}
            onNavigate={closeMobile}
          />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-neutral-200 bg-white px-4 lg:px-5">
          <button
            ref={menuButtonRef}
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 lg:hidden"
            aria-expanded={mobileOpen}
            aria-controls="admin-mobile-drawer"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((v) => !v)}
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
                      <Link
                        href={crumb.href}
                        className="hover:text-neutral-900"
                      >
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
                isDev
                  ? "bg-amber-100 text-amber-800"
                  : "bg-emerald-100 text-emerald-800"
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
                    Log out
                  </button>
                </form>
              </div>
            ) : (
              <span className="text-xs text-neutral-500">Not signed in</span>
            )}
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto bg-neutral-50 p-4 sm:p-6">
            {children}
          </div>
          <footer className="shrink-0 border-t border-neutral-200 bg-white px-4 py-2 text-center text-[0.6875rem] text-neutral-500 sm:px-6">
            © {new Date().getFullYear()} Smartlance Designs · Admin
          </footer>
        </main>
      </div>
    </div>
  );
}
