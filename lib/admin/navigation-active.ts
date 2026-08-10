import type { AdminRole } from "@prisma/client";
import { can, type AdminCapability } from "@/lib/admin/rbac";
import {
  adminNavigation,
  type AdminNavGroupDef,
  type AdminNavItemDef,
} from "@/lib/admin/navigation";

export function itemAllowed(role: AdminRole | undefined, item: AdminNavItemDef): boolean {
  if (!item.capability) return Boolean(role);
  if (!role) return false;
  if (item.capability === "edit_draft") {
    return (
      can(role, "edit_draft") || can(role, "preview") || can(role, "dashboard")
    );
  }
  return can(role, item.capability as AdminCapability);
}

export function filterAdminNavigation(
  role: AdminRole | undefined,
): AdminNavGroupDef[] {
  return adminNavigation
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => itemAllowed(role, item)),
    }))
    .filter((group) => group.items.length > 0);
}

/** Determines which sidebar item is active for the current pathname. */
export function activeAdminNavItemId(pathname: string): string | null {
  if (pathname === "/admin/login" || pathname.startsWith("/admin/preview")) {
    return null;
  }

  const matches: string[] = [];

  for (const item of adminNavigation.flatMap((g) => g.items)) {
    if (isAdminNavItemActive(pathname, item.id)) matches.push(item.id);
  }

  if (!matches.length) return null;

  // Prefer the most specific match (longest href wins).
  matches.sort((a, b) => {
    const hrefA =
      adminNavigation.flatMap((g) => g.items).find((i) => i.id === a)?.href.length ?? 0;
    const hrefB =
      adminNavigation.flatMap((g) => g.items).find((i) => i.id === b)?.href.length ?? 0;
    return hrefB - hrefA;
  });

  return matches[0] ?? null;
}

export function isAdminNavItemActive(pathname: string, itemId: string): boolean {
  if (itemId === "dashboard") return pathname === "/admin";

  if (itemId === "topic-intelligence") {
    return pathname.startsWith("/admin/ai-writer/discover");
  }

  if (itemId === "ai-writer") {
    return pathname.startsWith("/admin/ai-writer");
  }

  if (itemId === "enquiries") {
    return pathname === "/admin/enquiries" || pathname.startsWith("/admin/enquiries/");
  }

  if (itemId === "crm") {
    return pathname === "/admin/crm";
  }

  if (itemId === "crm-inbox") {
    return pathname.startsWith("/admin/crm/inbox");
  }

  if (itemId === "crm-contacts") {
    return pathname.startsWith("/admin/crm/contacts");
  }

  if (itemId === "crm-companies") {
    return pathname.startsWith("/admin/crm/companies");
  }

  if (itemId === "crm-leads") {
    return pathname.startsWith("/admin/crm/leads");
  }

  if (itemId === "crm-deals") {
    return pathname.startsWith("/admin/crm/deals");
  }

  if (itemId === "agency-projects") {
    return (
      pathname === "/admin/agency" ||
      pathname.startsWith("/admin/agency/projects") ||
      pathname.startsWith("/admin/agency/templates")
    );
  }

  if (itemId === "agency-onboarding") {
    return (
      pathname.startsWith("/admin/agency/onboarding") &&
      !pathname.startsWith("/admin/agency/onboarding-templates")
    );
  }

  if (itemId === "agency-change-requests") {
    return pathname.startsWith("/admin/agency/change-requests");
  }

  if (itemId === "agency-proposals") {
    return pathname.startsWith("/admin/agency/proposals");
  }

  if (itemId === "agency-contracts") {
    return (
      pathname.startsWith("/admin/agency/contracts") &&
      !pathname.startsWith("/admin/agency/contract-templates")
    );
  }

  if (itemId === "agency-billing") {
    return (
      pathname.startsWith("/admin/agency/billing") ||
      pathname.startsWith("/admin/agency/invoices") ||
      pathname.startsWith("/admin/agency/payments")
    );
  }

  if (itemId === "agency-retainers") {
    return pathname.startsWith("/admin/agency/retainers");
  }

  if (itemId === "agency-websites") {
    return pathname.startsWith("/admin/agency/websites");
  }

  if (itemId === "agency-support") {
    return pathname.startsWith("/admin/agency/support");
  }

  if (itemId === "settings") {
    return (
      pathname === "/admin/settings" ||
      (pathname.startsWith("/admin/settings/") &&
        !pathname.startsWith("/admin/crm/settings"))
    );
  }

  if (itemId === "email") {
    return pathname === "/admin/email" || pathname.startsWith("/admin/email/");
  }

  const item = adminNavigation
    .flatMap((g) => g.items)
    .find((i) => i.id === itemId);
  if (!item) return false;

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function activeAdminNavGroupId(pathname: string): string | null {
  const itemId = activeAdminNavItemId(pathname);
  if (!itemId) return null;
  return adminNavigation.find((g) => g.items.some((i) => i.id === itemId))?.id ?? null;
}

const SEGMENT_LABELS: Record<string, string> = {
  admin: "Admin",
  homepage: "Homepage",
  services: "Services",
  solutions: "Solutions",
  platforms: "Platforms",
  industries: "Industries",
  work: "Work",
  testimonials: "Testimonials",
  insights: "Blog",
  resources: "Resources",
  "ai-writer": "AI",
  discover: "Topic Intelligence",
  "content-audit": "Content Audit",
  media: "Media",
  navigation: "Navigation",
  seo: "SEO",
  "link-health": "Link Health",
  redirects: "Redirects",
  enquiries: "Enquiries",
  crm: "CRM",
  agency: "Agency",
  projects: "Projects",
  templates: "Templates",
  contacts: "Contacts",
  companies: "Companies",
  leads: "Leads",
  deals: "Deals",
  tasks: "Tasks",
  segments: "Segments",
  sequences: "Sequences",
  outreach: "Outreach",
  "email-templates": "Email Templates",
  onboarding: "Onboarding",
  "change-requests": "Change Requests",
  proposals: "Proposals",
  contracts: "Contracts",
  billing: "Billing",
  retainers: "Retainers",
  websites: "Websites",
  support: "Support",
  invoices: "Invoices",
  payments: "Payments",
  contact: "Contact",
  reviews: "Website Reviews",
  users: "Users",
  "audit-log": "Audit",
  email: "Email",
  settings: "Settings",
  system: "System",
  new: "New",
};

export type AdminBreadcrumb = { label: string; href?: string };

export function adminBreadcrumbs(pathname: string): AdminBreadcrumb[] {
  if (pathname === "/admin") {
    return [{ label: "Admin" }, { label: "Dashboard" }];
  }

  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "admin") return [{ label: "Admin", href: "/admin" }];

  const crumbs: AdminBreadcrumb[] = [{ label: "Admin", href: "/admin" }];
  let acc = "";

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i]!;
    acc += `/${part}`;
    const href = `/admin${acc}`;
    const isLast = i === parts.length - 1;
    const looksLikeId =
      isLast &&
      (part.length > 12 || /^[a-f0-9-]{8,}$/i.test(part) || /^\d+$/.test(part));

    const label = looksLikeId
      ? "Edit"
      : SEGMENT_LABELS[part] ?? part.replace(/-/g, " ");

    crumbs.push(isLast ? { label } : { label, href });
  }

  return crumbs;
}

export function viewSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "/";
}
