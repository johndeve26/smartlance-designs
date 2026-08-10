"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  filterPortalNav,
  portalFooterNav,
  portalMobileBottomNav,
} from "@/lib/portal/navigation";
import { PortalSidebar } from "@/components/portal/PortalSidebar";
import { PortalMobileNav } from "@/components/portal/PortalMobileNav";
import { cn } from "@/lib/utils";

export function PortalShell({
  children,
  attentionCount = 0,
  showWebsites = true,
  showSupport = true,
}: {
  children: React.ReactNode;
  attentionCount?: number;
  showWebsites?: boolean;
  showSupport?: boolean;
}) {
  const pathname = usePathname();
  const isAuthRoute =
    pathname.startsWith("/portal/login") || pathname.startsWith("/portal/auth");

  const navGroups = filterPortalNav({ showWebsites, showSupport });

  if (isAuthRoute) {
    return <div className="min-h-screen surface-page text-foreground">{children}</div>;
  }

  return (
    <div className="min-h-screen surface-page text-foreground">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <PortalSidebar
          groups={navGroups}
          footerNav={portalFooterNav}
          attentionCount={attentionCount}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:hidden">
            <Link href="/portal" className="font-semibold text-foreground">
              Smartlance
            </Link>
            {attentionCount > 0 ? (
              <Link
                href="/portal/approvals"
                className="rounded-full bg-cta px-2.5 py-1 text-xs font-medium text-cta-foreground"
              >
                {attentionCount} need you
              </Link>
            ) : null}
          </header>

          <main className="flex-1 px-4 py-6 pb-24 lg:px-8 lg:py-8 lg:pb-8">{children}</main>

          <PortalMobileNav items={portalMobileBottomNav} />
        </div>
      </div>
    </div>
  );
}

export function PortalPageHeader({
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

export function PortalCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-border bg-surface p-4 sm:p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function PortalPrimaryButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-md bg-cta px-4 py-2 text-sm font-semibold text-cta-foreground hover:bg-cta-hover"
    >
      {children}
    </Link>
  );
}

export function PortalSecondaryButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-md border border-border-strong bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted"
    >
      {children}
    </Link>
  );
}
