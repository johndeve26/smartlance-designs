"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import type { SessionUser } from "@/lib/admin/session";
import { filterAdminNavigation } from "@/lib/admin/navigation-active";
import { adminBreadcrumbs } from "@/lib/admin/navigation-active";
import type { AdminRole } from "@prisma/client";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import "@/components/admin/admin.css";

const SIDEBAR_COLLAPSED_KEY = "admin-sidebar-collapsed";

type AdminShellProps = {
  user: SessionUser | null;
  isDev: boolean;
  badgeCounts?: { enquiries?: number; inbox?: number; support?: number };
  children: ReactNode;
};

export function AdminShell({
  user,
  isDev,
  badgeCounts = {},
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
            <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--admin-accent)]">
              {collapsed ? "SL" : "Smartlance"}
            </div>
            {!collapsed ? (
              <div className="mt-0.5 text-sm font-medium text-white">Admin</div>
            ) : null}
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <AdminSidebar
            groups={visibleGroups}
            badgeCounts={badgeCounts}
            collapsed={collapsed}
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

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-[220] bg-black/40 lg:hidden"
          aria-label="Close menu"
          onClick={closeMobile}
        />
      ) : null}

      <aside
        id="admin-mobile-drawer"
        className={`admin-sidebar fixed inset-y-0 left-0 z-[230] flex w-[min(100%,18rem)] flex-col shadow-xl transition-transform lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!mobileOpen}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <Link href="/admin" onClick={closeMobile} className="min-w-0">
            <div className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--admin-accent)]">
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
          <AdminSidebar
            groups={visibleGroups}
            badgeCounts={badgeCounts}
            onNavigate={closeMobile}
          />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar
          breadcrumbs={breadcrumbs}
          pageTitle={pageTitle}
          user={user}
          isDev={isDev}
          mobileOpen={mobileOpen}
          menuButtonRef={menuButtonRef}
          onToggleMobile={() => setMobileOpen((v) => !v)}
        />

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
