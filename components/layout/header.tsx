"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import {
  aiAutomationMenu,
  companyMenu,
  headerTopNavigation,
  mobileAiAutomationLinks,
  mobileResourcesLinks,
  mobileServicesLinks,
  mobileUtilityLinks,
  primaryCta as defaultPrimaryCta,
  resourcesMegaMenu,
  servicesMegaMenu,
  solutionsMenu,
} from "@/data/navigation";
import { getWorkMenuLinks } from "@/lib/public/work-capabilities";
import { isNavSectionActive } from "@/lib/navigation/active-section";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import type { HeaderMenuId, HeaderTopItem } from "@/data/navigation";

type OpenMenu = HeaderMenuId | null;

type HeaderProps = {
  primaryCta?: { label: string; href: string };
};

function navTriggerClass(active: boolean) {
  return cn(
    "relative inline-flex items-center gap-1 rounded-md px-3.5 py-2 text-[0.9375rem] font-medium tracking-[-0.005em] transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2",
    // Underline indicator: solid when active, faint on hover/focus.
    "after:absolute after:inset-x-3.5 after:-bottom-[0.4375rem] after:h-[2px] after:rounded-full after:transition-colors",
    active
      ? "font-semibold text-foreground after:bg-accent"
      : "text-muted after:bg-transparent hover:text-foreground hover:after:bg-border-strong",
  );
}

export function Header({ primaryCta = defaultPrimaryCta }: HeaderProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <HeaderShell scrolled={scrolled}>
      <HeaderInteractive
        key={pathname}
        pathname={pathname}
        primaryCta={primaryCta}
      />
    </HeaderShell>
  );
}

function HeaderShell({
  scrolled,
  children,
}: {
  scrolled: boolean;
  children: ReactNode;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-border bg-surface transition-shadow print:hidden",
        scrolled ? "shadow-[0_1px_16px_rgb(26_26_26_/_0.06)]" : "shadow-none",
      )}
    >
      {children}
    </header>
  );
}

function HeaderInteractive({
  pathname,
  primaryCta,
}: {
  pathname: string;
  primaryCta: { label: string; href: string };
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const menuIds = {
    services: useId(),
    "ai-automation": useId(),
    solutions: useId(),
    work: useId(),
    resources: useId(),
    company: useId(),
  } as const;

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const closeDesktopMenu = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMenu(null);
  }, []);

  const openDesktopMenu = useCallback((menu: OpenMenu) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMenu(menu);
  }, []);

  const scheduleClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenMenu(null), 120);
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!headerRef.current?.contains(e.target as Node)) closeDesktopMenu();
    }
    function onEscape(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") {
        closeDesktopMenu();
        if (mobileOpen) {
          setMobileOpen(false);
          menuButtonRef.current?.focus();
        }
      }
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEscape);
    };
  }, [closeDesktopMenu, mobileOpen]);

  function onMenuKeyDown(e: KeyboardEvent, menu: OpenMenu) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpenMenu((prev) => (prev === menu ? null : menu));
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      openDesktopMenu(menu);
    }
  }

  function closeMobile() {
    setMobileOpen(false);
    setMobileSection(null);
  }

  return (
    <>
      <div ref={headerRef}>
      <Container
        className="flex h-[4.25rem] items-center justify-between gap-4 lg:h-[4.75rem]"
      >
        <Logo priority />

        <nav
          className="hidden items-center gap-1 xl:flex"
          aria-label="Primary"
        >
          {headerTopNavigation.map((item) =>
            "menu" in item ? (
              <DesktopDropdown
                key={item.id}
                item={item}
                pathname={pathname}
                open={openMenu === item.id}
                panelId={menuIds[item.id as keyof typeof menuIds]}
                onOpen={() => openDesktopMenu(item.id as OpenMenu)}
                onScheduleClose={scheduleClose}
                onCancelClose={() => {
                  if (closeTimer.current) clearTimeout(closeTimer.current);
                }}
                onClose={closeDesktopMenu}
                onKeyDown={(e) => onMenuKeyDown(e, item.id as OpenMenu)}
                onToggle={() =>
                  setOpenMenu((prev) =>
                    prev === item.id ? null : (item.id as OpenMenu),
                  )
                }
              />
            ) : (
              <DirectNavLink key={item.id} item={item} pathname={pathname} />
            ),
          )}
        </nav>

        <div className="hidden shrink-0 xl:flex">
          <Button asChild size="md" className="rounded-[0.5rem]">
            <Link
              href={primaryCta.href}
              onClick={() =>
                trackEvent("get_quote_clicked", { location: "header" })
              }
            >
              {primaryCta.label}
            </Link>
          </Button>
        </div>

        <button
          ref={menuButtonRef}
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:border-border-strong hover:bg-surface-muted xl:hidden"
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav-drawer"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </Container>
      </div>

      {mobileOpen ? (
        <div
          id="mobile-nav-drawer"
          className="border-t border-border bg-surface xl:hidden"
        >
          <Container className="flex max-h-[calc(100dvh-4.25rem)] flex-col overflow-y-auto py-4 lg:max-h-[calc(100dvh-4.75rem)]">
            <nav aria-label="Mobile primary" className="flex flex-col">
              {headerTopNavigation.map((item) => {
                const expandable = "menu" in item;
                const expanded = mobileSection === item.id;
                return (
                  <div key={item.id} className="border-b border-border">
                    <div className="flex items-center justify-between gap-2 py-2">
                      <Link
                        href={item.href}
                        onClick={closeMobile}
                        className="py-1 text-base font-semibold text-foreground"
                      >
                        {item.label}
                      </Link>
                      {expandable ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-muted"
                          aria-expanded={expanded}
                          aria-controls={`mobile-section-${item.id}`}
                          onClick={() =>
                            setMobileSection((prev) =>
                              prev === item.id ? null : item.id,
                            )
                          }
                        >
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform",
                              expanded && "rotate-180",
                            )}
                          />
                        </button>
                      ) : null}
                    </div>
                    {expandable && expanded ? (
                      <div
                        id={`mobile-section-${item.id}`}
                        className="pb-3 pl-1"
                      >
                        <MobileSectionLinks item={item} onNavigate={closeMobile} />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </nav>

            <div className="mt-4 space-y-3 border-t border-border pt-4">
              <Button asChild className="w-full rounded-[0.5rem]">
                <Link
                  href={primaryCta.href}
                  onClick={() => {
                    trackEvent("get_quote_clicked", { location: "mobile-nav" });
                    closeMobile();
                  }}
                >
                  {primaryCta.label}
                </Link>
              </Button>
              <ul className="flex flex-col gap-2">
                {mobileUtilityLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={closeMobile}
                      className="text-[0.9375rem] font-medium text-muted hover:text-accent-text"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </div>
      ) : null}
    </>
  );
}

function DirectNavLink({
  item,
  pathname,
}: {
  item: HeaderTopItem;
  pathname: string;
}) {
  const active = isNavSectionActive(item.id, pathname);
  return (
    <Link href={item.href} className={navTriggerClass(active)}>
      {item.label}
    </Link>
  );
}

function DesktopDropdown({
  item,
  pathname,
  open,
  panelId,
  onOpen,
  onScheduleClose,
  onCancelClose,
  onClose,
  onKeyDown,
  onToggle,
}: {
  item: HeaderTopItem & { menu: string };
  pathname: string;
  open: boolean;
  panelId: string;
  onOpen: () => void;
  onScheduleClose: () => void;
  onCancelClose: () => void;
  onClose: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void;
  onToggle: () => void;
}) {
  const active = isNavSectionActive(item.id, pathname);

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        onCancelClose();
        onOpen();
      }}
      onMouseLeave={onScheduleClose}
    >
      <button
        type="button"
        id={`${panelId}-trigger`}
        className={navTriggerClass(active)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={panelId}
        onClick={onToggle}
        onKeyDown={onKeyDown}
      >
        {item.label}
        <ChevronDown
          className={cn("h-3.5 w-3.5 opacity-60 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open ? (
        <div
          id={panelId}
          role="region"
          aria-labelledby={`${panelId}-trigger`}
          className={cn(
            "absolute top-full z-50 pt-2",
            item.menu === "mega-services" && "left-0 w-[36rem]",
            item.menu === "ai-automation" && "left-0 w-[24rem]",
            item.menu === "mega-resources" && "left-1/2 w-[32rem] -translate-x-1/2",
            item.menu === "solutions" && "left-0 w-[22rem]",
            item.menu === "work" && "left-0 w-[20rem]",
            item.menu === "company" && "right-0 w-[20rem]",
          )}
          onMouseEnter={onCancelClose}
          onMouseLeave={onScheduleClose}
        >
          <div className="rounded-lg border border-border bg-surface p-4 shadow-lg">
            {item.menu === "mega-services" ? (
              <ServicesMegaPanel onNavigate={onClose} />
            ) : null}
            {item.menu === "ai-automation" ? (
              <CompactMenuPanel links={aiAutomationMenu} onNavigate={onClose} />
            ) : null}
            {item.menu === "solutions" ? (
              <CompactMenuPanel links={solutionsMenu} onNavigate={onClose} />
            ) : null}
            {item.menu === "work" ? (
              <CompactMenuPanel links={getWorkMenuLinks()} onNavigate={onClose} />
            ) : null}
            {item.menu === "mega-resources" ? (
              <ResourcesMegaPanel onNavigate={onClose} />
            ) : null}
            {item.menu === "company" ? (
              <CompactMenuPanel links={companyMenu} onNavigate={onClose} />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MenuLink({
  link,
  onNavigate,
  compact,
}: {
  link: { label: string; href: string; description?: string };
  onNavigate?: () => void;
  compact?: boolean;
}) {
  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      className={cn(
        "block rounded-md px-2 py-2 transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
        compact && "py-1.5",
      )}
    >
      <span className="block text-sm font-semibold text-foreground">
        {link.label}
      </span>
      {link.description ? (
        <span className="mt-0.5 block text-[0.8125rem] leading-snug text-muted">
          {link.description}
        </span>
      ) : null}
    </Link>
  );
}

function ServicesMegaPanel({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="px-2 pb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-subtle">
          Services
        </p>
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
          {servicesMegaMenu.links.map((link) => (
            <MenuLink key={link.href} link={link} onNavigate={onNavigate} compact />
          ))}
        </div>
      </div>
      <div className="border-t border-border pt-3">
        <p className="px-2 pb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-subtle">
          Platforms
        </p>
        <div className="flex flex-col gap-0.5">
          {servicesMegaMenu.platforms.map((link) => (
            <MenuLink key={link.href} link={link} onNavigate={onNavigate} />
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-3 border-t border-border pt-3">
        {servicesMegaMenu.actions.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className="text-sm font-semibold text-accent-text hover:underline"
          >
            {link.label} →
          </Link>
        ))}
      </div>
    </div>
  );
}

function ResourcesMegaPanel({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {resourcesMegaMenu.groups.map((group) => (
          <div key={group.title}>
            <p className="px-2 pb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-subtle">
              {group.title}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.links.map((link) => (
                <MenuLink key={link.href} link={link} onNavigate={onNavigate} compact />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-border pt-3">
        <Link
          href={resourcesMegaMenu.footerLink.href}
          onClick={onNavigate}
          className="text-sm font-semibold text-accent-text hover:underline"
        >
          {resourcesMegaMenu.footerLink.label} →
        </Link>
      </div>
    </div>
  );
}

function CompactMenuPanel({
  links,
  onNavigate,
}: {
  links: { label: string; href: string; description?: string }[];
  onNavigate: () => void;
}) {
  return (
    <div className="flex max-h-[24rem] flex-col gap-0.5 overflow-y-auto">
      {links.map((link) => (
        <MenuLink key={link.href} link={link} onNavigate={onNavigate} />
      ))}
    </div>
  );
}

function MobileSectionLinks({
  item,
  onNavigate,
}: {
  item: HeaderTopItem;
  onNavigate: () => void;
}) {
  if (item.id === "services") {
    return (
      <ul className="space-y-1">
        {mobileServicesLinks.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={onNavigate}
              className="block py-2 pl-2 text-[0.9375rem] text-muted hover:text-accent-text"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    );
  }
  if (item.id === "ai-automation") {
    return (
      <ul className="space-y-1">
        {mobileAiAutomationLinks.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={onNavigate}
              className="block py-2 pl-2 text-[0.9375rem] text-muted hover:text-accent-text"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    );
  }
  if (item.id === "solutions") {
    return (
      <ul className="space-y-1">
        {solutionsMenu.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={onNavigate}
              className="block py-2 pl-2 text-[0.9375rem] text-muted hover:text-accent-text"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    );
  }
  if (item.id === "work") {
    return (
      <ul className="space-y-1">
        {getWorkMenuLinks().map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={onNavigate}
              className="block py-2 pl-2 text-[0.9375rem] text-muted hover:text-accent-text"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    );
  }
  if (item.id === "resources") {
    return (
      <ul className="space-y-1">
        {mobileResourcesLinks.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={onNavigate}
              className="block py-2 pl-2 text-[0.9375rem] text-muted hover:text-accent-text"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    );
  }
  if (item.id === "company") {
    return (
      <ul className="space-y-1">
        {companyMenu.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={onNavigate}
              className="block py-2 pl-2 text-[0.9375rem] text-muted hover:text-accent-text"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    );
  }
  return null;
}
