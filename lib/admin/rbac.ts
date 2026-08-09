import type { AdminRole } from "@prisma/client";

export type AdminCapability =
  | "login"
  | "dashboard"
  | "edit_draft"
  | "publish"
  | "preview"
  | "manage_users"
  | "slug_redirect"
  | "view_audit"
  | "view_audit_limited"
  | "verify_testimonial"
  | "manage_media"
  | "manage_navigation"
  | "manage_redirects"
  | "manage_settings"
  | "manage_seo"
  | "run_link_health"
  | "view_system"
  | "media_permanent_delete"
  | "settings_critical"
  | "view_enquiries"
  | "manage_enquiries"
  | "export_enquiries"
  | "enquiry_destructive"
  | "view_audience"
  | "manage_audience"
  | "export_audience"
  | "view_crm"
  | "manage_crm"
  | "export_crm"
  | "send_crm_email"
  | "view_projects"
  | "manage_projects"
  | "manage_project_templates"
  | "use_ai_writer"
  | "manage_ai_settings"
  | "approve_ai_cms";

const ROLE_CAPABILITIES: Record<AdminRole, ReadonlySet<AdminCapability>> = {
  SUPER_ADMIN: new Set([
    "login",
    "dashboard",
    "edit_draft",
    "publish",
    "preview",
    "manage_users",
    "slug_redirect",
    "view_audit",
    "verify_testimonial",
    "manage_media",
    "manage_navigation",
    "manage_redirects",
    "manage_settings",
    "manage_seo",
    "run_link_health",
    "view_system",
    "media_permanent_delete",
    "settings_critical",
    "view_enquiries",
    "manage_enquiries",
    "export_enquiries",
    "enquiry_destructive",
    "view_audience",
    "manage_audience",
    "export_audience",
    "view_crm",
    "manage_crm",
    "export_crm",
    "send_crm_email",
    "view_projects",
    "manage_projects",
    "manage_project_templates",
    "use_ai_writer",
    "manage_ai_settings",
    "approve_ai_cms",
  ]),
  EDITOR: new Set([
    "login",
    "dashboard",
    "edit_draft",
    "publish",
    "preview",
    "slug_redirect",
    "view_audit",
    "verify_testimonial",
    "manage_media",
    "manage_navigation",
    "manage_redirects",
    "manage_settings",
    "manage_seo",
    "run_link_health",
    "view_system",
    "view_enquiries",
    "manage_enquiries",
    "view_audience",
    "manage_audience",
    "view_crm",
    "manage_crm",
    "send_crm_email",
    "view_projects",
    "manage_projects",
    "manage_project_templates",
    "use_ai_writer",
    "manage_ai_settings",
    "approve_ai_cms",
  ]),
  CONTENT_MANAGER: new Set([
    "login",
    "dashboard",
    "edit_draft",
    "preview",
    "view_audit_limited",
    "manage_media",
    "manage_navigation",
    "manage_seo",
    "view_system",
    "use_ai_writer",
    "approve_ai_cms",
  ]),
  REVIEWER: new Set([
    "login",
    "dashboard",
    "preview",
    "view_audit_limited",
    "view_system",
  ]),
};

export function can(role: AdminRole, capability: AdminCapability): boolean {
  const caps = ROLE_CAPABILITIES[role];
  if (!caps) return false;
  if (capability === "view_audit") {
    return caps.has("view_audit") || caps.has("view_audit_limited");
  }
  return caps.has(capability);
}

export function assertCan(role: AdminRole, capability: AdminCapability): void {
  if (!can(role, capability)) {
    throw new Error(`Forbidden: missing capability "${capability}"`);
  }
}

export function roleLabel(role: AdminRole): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "Super Admin";
    case "EDITOR":
      return "Editor";
    case "CONTENT_MANAGER":
      return "Content Manager";
    case "REVIEWER":
      return "Reviewer";
    default:
      return role;
  }
}
