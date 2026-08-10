"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PortalNavItem } from "@/lib/portal/navigation";
import { cn } from "@/lib/utils";

type PortalMobileNavProps = {
  items: PortalNavItem[];
};

export function PortalMobileNav({ items }: PortalMobileNavProps) {
  const pathname = usePathname() ?? "";

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-10 flex border-t border-border bg-surface lg:hidden"
    >
      {items.map((item) => (
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
  );
}
