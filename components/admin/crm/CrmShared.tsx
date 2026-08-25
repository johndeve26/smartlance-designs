"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin/crm", label: "Overview", exact: true },
  { href: "/admin/crm/contacts", label: "Contacts" },
  { href: "/admin/crm/companies", label: "Companies" },
  { href: "/admin/crm/leads", label: "Leads" },
  { href: "/admin/crm/deals", label: "Deals" },
  { href: "/admin/crm/tasks", label: "Tasks" },
  { href: "/admin/crm/inbox", label: "Inbox" },
  { href: "/admin/crm/segments", label: "Segments" },
  { href: "/admin/crm/sequences", label: "Sequences" },
  { href: "/admin/crm/outreach", label: "Outreach" },
  { href: "/admin/crm/email-templates", label: "Email Templates" },
];

export function CrmSubNav({ inboxNeedsReview }: { inboxNeedsReview?: number } = {}) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-1 border-b pb-3">
      {links.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        const badge =
          link.href === "/admin/crm/inbox" && inboxNeedsReview && inboxNeedsReview > 0
            ? inboxNeedsReview
            : null;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded px-3 py-1.5 text-sm font-medium",
              active
                ? "bg-neutral-900 text-white"
                : "text-neutral-600 hover:bg-neutral-100",
            )}
          >
            {link.label}
            {badge ? (
              <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-xs text-white">
                {badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function CrmBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "cold" | "warm" | "hot" | "success" | "warning" | "danger";
}) {
  const tones = {
    neutral: "bg-neutral-100 text-neutral-700",
    cold: "bg-sky-50 text-sky-800",
    warm: "bg-amber-50 text-amber-900",
    hot: "bg-orange-50 text-orange-900",
    success: "bg-emerald-50 text-emerald-800",
    warning: "bg-yellow-50 text-yellow-900",
    danger: "bg-red-50 text-red-800",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded px-2 py-0.5 text-xs font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
