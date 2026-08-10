"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  prospectFooterNav,
  prospectMainNav,
  prospectMobileBottomNav,
} from "@/lib/prospect/navigation";
import { cn } from "@/lib/utils";

export function ProspectShell({
  children,
  hasClientAccess = false,
}: {
  children: React.ReactNode;
  hasClientAccess?: boolean;
}) {
  const pathname = usePathname() ?? "";
  const isAuthRoute =
    pathname.startsWith("/workspace/login") ||
    pathname.startsWith("/workspace/auth");

  if (isAuthRoute) {
    return <div className="min-h-screen surface-page text-foreground">{children}</div>;
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="min-h-screen surface-page text-foreground">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col lg:flex-row">
        <aside className="hidden w-56 shrink-0 border-r border-border bg-surface lg:flex lg:flex-col">
          <div className="border-b border-border px-5 py-5">
            <Link href="/workspace" className="text-lg font-semibold tracking-tight text-foreground">
              Smartlance
            </Link>
            <p className="mt-0.5 text-xs text-subtle">Your workspace</p>
          </div>
          <nav className="flex flex-1 flex-col gap-0.5 p-3">
            {prospectMainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item.href, item.exact)
                    ? "bg-brand-soft text-foreground"
                    : "text-muted hover:bg-surface-muted",
                )}
                aria-current={isActive(item.href, item.exact) ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-border p-3">
            {prospectFooterNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-md px-3 py-2 text-sm text-muted hover:bg-surface-muted"
              >
                {item.label}
              </Link>
            ))}
            {hasClientAccess ? (
              <Link
                href="/portal"
                className="mt-2 block rounded-md bg-cta px-3 py-2 text-center text-sm font-semibold text-cta-foreground hover:bg-cta-hover"
              >
                Open Client Portal
              </Link>
            ) : null}
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:hidden">
            <Link href="/workspace" className="font-semibold text-foreground">
              Smartlance
            </Link>
            {hasClientAccess ? (
              <Link href="/portal" className="text-sm font-medium text-accent-text">
                Client Portal
              </Link>
            ) : null}
          </header>

          <main className="flex-1 p-4 pb-24 sm:p-6 lg:pb-6">{children}</main>

          <nav
            aria-label="Primary"
            className="fixed bottom-0 left-0 right-0 z-10 flex border-t border-border bg-surface lg:hidden"
          >
            {prospectMobileBottomNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center py-2 text-[10px] font-medium",
                  isActive(item.href, item.exact) ? "text-accent-text" : "text-subtle",
                )}
                aria-current={isActive(item.href, item.exact) ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}

export function ProspectPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-page-title">{title}</h1>
          {description ? <p className="mt-1 text-body-sm">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}
