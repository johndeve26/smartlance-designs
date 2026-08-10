import type { AdminCapability } from "@/lib/admin/rbac";

export type AdminNavBadge = "enquiries" | "inbox" | "support";

export type AdminNavItemDef = {
  id: string;
  label: string;
  href: string;
  capability?: AdminCapability;
  badge?: AdminNavBadge;
};

export type AdminNavGroupDef = {
  id: string;
  label: string;
  items: AdminNavItemDef[];
  /** Groups may be collapsed in sidebar; default expanded */
  collapsible?: boolean;
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
    id: "sales",
    label: "Sales",
    collapsible: true,
    items: [
      { id: "crm", label: "CRM", href: "/admin/crm", capability: "view_crm" },
      {
        id: "crm-inbox",
        label: "Inbox",
        href: "/admin/crm/inbox",
        capability: "view_crm",
        badge: "inbox",
      },
      {
        id: "crm-contacts",
        label: "Contacts",
        href: "/admin/crm/contacts",
        capability: "view_crm",
      },
      {
        id: "crm-companies",
        label: "Companies",
        href: "/admin/crm/companies",
        capability: "view_crm",
      },
      {
        id: "crm-leads",
        label: "Leads",
        href: "/admin/crm/leads",
        capability: "view_crm",
      },
      {
        id: "crm-deals",
        label: "Deals",
        href: "/admin/crm/deals",
        capability: "view_crm",
      },
      {
        id: "enquiries",
        label: "Enquiries",
        href: "/admin/enquiries",
        capability: "view_enquiries",
        badge: "enquiries",
      },
      {
        id: "audience",
        label: "Audience",
        href: "/admin/audience",
        capability: "view_audience",
      },
    ],
  },
  {
    id: "agency",
    label: "Agency",
    collapsible: true,
    items: [
      {
        id: "agency-projects",
        label: "Projects",
        href: "/admin/agency/projects",
        capability: "view_projects",
      },
      {
        id: "agency-onboarding",
        label: "Onboarding",
        href: "/admin/agency/onboarding",
        capability: "view_onboarding",
      },
      {
        id: "agency-change-requests",
        label: "Change Requests",
        href: "/admin/agency/change-requests",
        capability: "view_change_requests",
      },
    ],
  },
  {
    id: "commercial",
    label: "Commercial",
    collapsible: true,
    items: [
      {
        id: "agency-proposals",
        label: "Proposals",
        href: "/admin/agency/proposals",
        capability: "view_proposals",
      },
      {
        id: "agency-contracts",
        label: "Contracts",
        href: "/admin/agency/contracts",
        capability: "view_contracts",
      },
      {
        id: "agency-billing",
        label: "Billing",
        href: "/admin/agency/billing",
        capability: "view_billing",
      },
      {
        id: "agency-retainers",
        label: "Retainers",
        href: "/admin/agency/retainers",
        capability: "manage_retainers",
      },
    ],
  },
  {
    id: "client-success",
    label: "Client Success",
    collapsible: true,
    items: [
      {
        id: "agency-websites",
        label: "Websites",
        href: "/admin/agency/websites",
        capability: "view_websites",
      },
      {
        id: "agency-support",
        label: "Support",
        href: "/admin/agency/support",
        capability: "view_support",
        badge: "support",
      },
    ],
  },
  {
    id: "content",
    label: "Content",
    collapsible: true,
    items: [
      { id: "homepage", label: "Homepage", href: "/admin/homepage", capability: "edit_draft" },
      { id: "services", label: "Services", href: "/admin/services", capability: "edit_draft" },
      { id: "solutions", label: "Solutions", href: "/admin/solutions", capability: "edit_draft" },
      { id: "work", label: "Work", href: "/admin/work", capability: "edit_draft" },
      { id: "industries", label: "Industries", href: "/admin/industries", capability: "edit_draft" },
      { id: "insights", label: "Blog", href: "/admin/insights", capability: "edit_draft" },
      { id: "resources", label: "Resources", href: "/admin/resources", capability: "edit_draft" },
      {
        id: "testimonials",
        label: "Testimonials",
        href: "/admin/testimonials",
        capability: "edit_draft",
      },
      { id: "platforms", label: "Platforms", href: "/admin/platforms", capability: "edit_draft" },
    ],
  },
  {
    id: "marketing",
    label: "Marketing / SEO",
    collapsible: true,
    items: [
      { id: "seo", label: "SEO", href: "/admin/seo", capability: "manage_seo" },
      {
        id: "navigation",
        label: "Navigation",
        href: "/admin/navigation",
        capability: "manage_navigation",
      },
      {
        id: "redirects",
        label: "Redirects",
        href: "/admin/redirects",
        capability: "manage_redirects",
      },
      { id: "media", label: "Media", href: "/admin/media", capability: "manage_media" },
      {
        id: "link-health",
        label: "Link Health",
        href: "/admin/link-health",
        capability: "run_link_health",
      },
    ],
  },
  {
    id: "system",
    label: "System",
    collapsible: true,
    items: [
      { id: "users", label: "Users", href: "/admin/users", capability: "manage_users" },
      { id: "email", label: "Email", href: "/admin/email", capability: "manage_settings" },
      { id: "ai-writer", label: "AI", href: "/admin/ai-writer", capability: "use_ai_writer" },
      { id: "audit-log", label: "Audit", href: "/admin/audit-log", capability: "view_audit" },
      { id: "settings", label: "Settings", href: "/admin/settings", capability: "manage_settings" },
      { id: "system", label: "System", href: "/admin/system", capability: "view_system" },
    ],
  },
];

/** Secondary items shown in area layouts (not primary sidebar). */
export const adminAgencySecondaryNav = [
  { id: "agency-templates", label: "Project Templates", href: "/admin/agency/templates" },
  {
    id: "agency-contract-templates",
    label: "Contract Templates",
    href: "/admin/agency/contract-templates",
  },
  {
    id: "agency-onboarding-templates",
    label: "Onboarding Templates",
    href: "/admin/agency/onboarding-templates",
  },
] as const;

export const adminCrmSecondaryNav = [
  { id: "crm-tasks", label: "Tasks", href: "/admin/crm/tasks" },
  { id: "crm-segments", label: "Segments", href: "/admin/crm/segments" },
  { id: "crm-sequences", label: "Sequences", href: "/admin/crm/sequences" },
  { id: "crm-outreach", label: "Outreach", href: "/admin/crm/outreach" },
  {
    id: "crm-email-templates",
    label: "Email Templates",
    href: "/admin/crm/email-templates",
  },
  {
    id: "crm-properties",
    label: "Properties",
    href: "/admin/crm/settings/properties",
  },
] as const;

export const adminNavItemById = new Map(
  adminNavigation.flatMap((g) => g.items.map((item) => [item.id, item] as const)),
);

export function flattenAdminNavItems() {
  return adminNavigation.flatMap((g) => g.items);
}
