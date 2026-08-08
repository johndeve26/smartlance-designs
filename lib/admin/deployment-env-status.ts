import type { EnvClass } from "@/lib/env";

export type DeploymentEnvRow = {
  key: string;
  label: string;
  class: EnvClass;
  notes: string;
  status: "configured" | "not_configured" | "enabled" | "disabled";
};

function present(key: string) {
  return Boolean(process.env[key]?.trim());
}

function flagEnabled(key: string) {
  return process.env[key]?.trim().toLowerCase() === "true";
}

/** Read-only deployment env status for Admin Settings (never exposes secret values). */
export function getDeploymentEnvStatus(): DeploymentEnvRow[] {
  const mediaProvider = (process.env.MEDIA_STORAGE_PROVIDER || "local").toLowerCase();

  return [
    {
      key: "DATABASE_URL",
      label: "Database (pooled)",
      class: "SECRET",
      notes: "Required for Admin + CMS runtime",
      status: present("DATABASE_URL") ? "configured" : "not_configured",
    },
    {
      key: "DIRECT_URL",
      label: "Database (direct)",
      class: "SECRET",
      notes: "Optional; preferred for Prisma migrate",
      status: present("DIRECT_URL") ? "configured" : "not_configured",
    },
    {
      key: "ADMIN_SESSION_SECRET",
      label: "Admin session secret",
      class: "SECRET",
      notes: "Required in production (≥32 chars)",
      status: present("ADMIN_SESSION_SECRET") ? "configured" : "not_configured",
    },
    {
      key: "ADMIN_PREVIEW_SECRET",
      label: "Admin preview secret",
      class: "SECRET",
      notes: "Optional preview HMAC",
      status: present("ADMIN_PREVIEW_SECRET") ? "configured" : "not_configured",
    },
    {
      key: "ADMIN_BOOTSTRAP_EMAIL",
      label: "Bootstrap admin email",
      class: "SECRET",
      notes: "First Super Admin bootstrap only",
      status: present("ADMIN_BOOTSTRAP_EMAIL") ? "configured" : "not_configured",
    },
    {
      key: "ADMIN_BOOTSTRAP_PASSWORD",
      label: "Bootstrap admin password",
      class: "SECRET",
      notes: "Bootstrap only — rotate after first login",
      status: present("ADMIN_BOOTSTRAP_PASSWORD") ? "configured" : "not_configured",
    },
    {
      key: "ADMIN_BOOTSTRAP_NAME",
      label: "Bootstrap admin name",
      class: "OPTIONAL",
      notes: "Display name for bootstrap user",
      status: present("ADMIN_BOOTSTRAP_NAME") ? "configured" : "not_configured",
    },
    {
      key: "RESEND_API_KEY",
      label: "Resend API key",
      class: "SECRET",
      notes: "Email notifications",
      status: present("RESEND_API_KEY") ? "configured" : "not_configured",
    },
    {
      key: "FORM_WEBHOOK_URL",
      label: "Form webhook",
      class: "SECRET",
      notes: "Alternate notification channel",
      status: present("FORM_WEBHOOK_URL") ? "configured" : "not_configured",
    },
    {
      key: "CONTACT_WEBHOOK_URL",
      label: "Contact webhook",
      class: "SECRET",
      notes: "Contact form webhook override",
      status: present("CONTACT_WEBHOOK_URL") ? "configured" : "not_configured",
    },
    {
      key: "WEBSITE_REVIEW_WEBHOOK_URL",
      label: "Review webhook",
      class: "SECRET",
      notes: "Free review form webhook override",
      status: present("WEBSITE_REVIEW_WEBHOOK_URL") ? "configured" : "not_configured",
    },
    {
      key: "ALLOW_FORM_LOG_FALLBACK",
      label: "Form log fallback",
      class: "DEVELOPMENT_ONLY",
      notes: "Log submissions when email/webhook missing",
      status: flagEnabled("ALLOW_FORM_LOG_FALLBACK") ? "enabled" : "disabled",
    },
    {
      key: "MEDIA_STORAGE_PROVIDER",
      label: "Media storage provider",
      class: "OPTIONAL",
      notes: "local (dev) or s3 (production)",
      status: mediaProvider === "s3" ? "configured" : "disabled",
    },
    {
      key: "MEDIA_S3_BUCKET",
      label: "Media S3 bucket",
      class: "SECRET",
      notes: "Object storage bucket",
      status: present("MEDIA_S3_BUCKET") ? "configured" : "not_configured",
    },
    {
      key: "MEDIA_S3_ACCESS_KEY_ID",
      label: "Media S3 access key",
      class: "SECRET",
      notes: "Object storage credentials",
      status: present("MEDIA_S3_ACCESS_KEY_ID") ? "configured" : "not_configured",
    },
    {
      key: "MEDIA_S3_SECRET_ACCESS_KEY",
      label: "Media S3 secret key",
      class: "SECRET",
      notes: "Object storage credentials",
      status: present("MEDIA_S3_SECRET_ACCESS_KEY") ? "configured" : "not_configured",
    },
    {
      key: "MEDIA_S3_ENDPOINT",
      label: "Media S3 endpoint",
      class: "OPTIONAL",
      notes: "Custom S3-compatible endpoint",
      status: present("MEDIA_S3_ENDPOINT") ? "configured" : "not_configured",
    },
    {
      key: "MEDIA_PUBLIC_BASE_URL",
      label: "Media public base URL",
      class: "OPTIONAL",
      notes: "CDN/base URL for uploaded objects",
      status: present("MEDIA_PUBLIC_BASE_URL") ? "configured" : "not_configured",
    },
    {
      key: "MEDIA_ALLOW_LOCAL_IN_PRODUCTION",
      label: "Allow local media in production",
      class: "DEVELOPMENT_ONLY",
      notes: "Escape hatch only — not recommended",
      status: flagEnabled("MEDIA_ALLOW_LOCAL_IN_PRODUCTION") ? "enabled" : "disabled",
    },
    {
      key: "NEXT_PUBLIC_SHOW_DRAFT_CONTENT",
      label: "Show draft content (public)",
      class: "DEVELOPMENT_ONLY",
      notes: "Local QA only — never enable in production",
      status: flagEnabled("NEXT_PUBLIC_SHOW_DRAFT_CONTENT") ? "enabled" : "disabled",
    },
  ];
}
