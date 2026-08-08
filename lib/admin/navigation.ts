import type { AdminCapability } from "@/lib/admin/rbac";

export type AdminNavItemDef = {
  id: string;
  label: string;
  href: string;
  capability?: AdminCapability;
  /** Show enquiry count badge when layout supplies count */
  badge?: "enquiries";
};

export type AdminNavGroupDef = {
  id: string;
  label: string;
  items: AdminNavItemDef[];
};

export const adminNavigation: AdminNavGroupDef[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      { id: "dashboard", label: "Dashboard", href: "/admin", capability: "dashboard" },
    ],
  },
  {
    id: "content",
    label: "Content",
    items: [
      { id: "homepage", label: "Homepage", href: "/admin/homepage", capability: "edit_draft" },
      { id: "services", label: "Services", href: "/admin/services", capability: "edit_draft" },
      { id: "solutions", label: "Solutions", href: "/admin/solutions", capability: "edit_draft" },
      { id: "platforms", label: "Platforms", href: "/admin/platforms", capability: "edit_draft" },
      { id: "industries", label: "Industries", href: "/admin/industries", capability: "edit_draft" },
      { id: "work", label: "Work", href: "/admin/work", capability: "edit_draft" },
      {
        id: "testimonials",
        label: "Testimonials",
        href: "/admin/testimonials",
        capability: "edit_draft",
      },
    ],
  },
  {
    id: "editorial",
    label: "Editorial",
    items: [
      { id: "insights", label: "Insights", href: "/admin/insights", capability: "edit_draft" },
      { id: "resources", label: "Resources", href: "/admin/resources", capability: "edit_draft" },
      { id: "ai-writer", label: "AI Writer", href: "/admin/ai-writer", capability: "use_ai_writer" },
      {
        id: "topic-intelligence",
        label: "Topic Intelligence",
        href: "/admin/ai-writer/discover",
        capability: "use_ai_writer",
      },
      {
        id: "content-audit",
        label: "Content Audit",
        href: "/admin/content-audit",
        capability: "edit_draft",
      },
    ],
  },
  {
    id: "site-management",
    label: "Site Management",
    items: [
      { id: "media", label: "Media", href: "/admin/media", capability: "manage_media" },
      {
        id: "navigation",
        label: "Navigation",
        href: "/admin/navigation",
        capability: "manage_navigation",
      },
      { id: "seo", label: "SEO", href: "/admin/seo", capability: "manage_seo" },
      {
        id: "link-health",
        label: "Link Health",
        href: "/admin/link-health",
        capability: "run_link_health",
      },
      {
        id: "redirects",
        label: "Redirects",
        href: "/admin/redirects",
        capability: "manage_redirects",
      },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    items: [
      {
        id: "enquiries",
        label: "Enquiries",
        href: "/admin/enquiries",
        capability: "view_enquiries",
        badge: "enquiries",
      },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      { id: "users", label: "Users", href: "/admin/users", capability: "manage_users" },
      { id: "audit-log", label: "Audit Log", href: "/admin/audit-log", capability: "view_audit" },
      { id: "settings", label: "Settings", href: "/admin/settings", capability: "manage_settings" },
      { id: "system", label: "System", href: "/admin/system", capability: "view_system" },
    ],
  },
];

export const adminNavItemById = new Map(
  adminNavigation.flatMap((g) => g.items.map((item) => [item.id, item] as const)),
);

export function flattenAdminNavItems() {
  return adminNavigation.flatMap((g) => g.items);
}
