/**
 * Server-only environment validation.
 * Never import this module from client components.
 */

export type EnvClass = "REQUIRED" | "OPTIONAL" | "DEVELOPMENT_ONLY" | "PUBLIC" | "SECRET";

type EnvIssue = { key: string; message: string; severity: "error" | "warn" };

function isProductionLike() {
  return (
    process.env.VERCEL_ENV === "production" ||
    (process.env.NODE_ENV === "production" && process.env.VERCEL_ENV !== "preview")
  );
}

function isPreview() {
  return process.env.VERCEL_ENV === "preview";
}

function present(key: string) {
  return Boolean(process.env[key]?.trim());
}

/** Soft classification reference for operators (see ENVIRONMENT.md). */
export const ENV_CATALOG: Array<{
  key: string;
  class: EnvClass;
  notes: string;
}> = [
  { key: "DATABASE_URL", class: "SECRET", notes: "Required for Admin + CMS runtime" },
  { key: "DIRECT_URL", class: "SECRET", notes: "Optional; preferred for prisma migrate" },
  { key: "ADMIN_SESSION_SECRET", class: "SECRET", notes: "Required in production (≥32 chars)" },
  { key: "ADMIN_PREVIEW_SECRET", class: "SECRET", notes: "Optional; falls back to session secret" },
  { key: "ADMIN_BOOTSTRAP_EMAIL", class: "SECRET", notes: "Bootstrap only" },
  { key: "ADMIN_BOOTSTRAP_PASSWORD", class: "SECRET", notes: "Bootstrap only" },
  { key: "RESEND_API_KEY", class: "SECRET", notes: "Email notification" },
  { key: "CONTACT_TO_EMAIL", class: "OPTIONAL", notes: "Notification recipient" },
  { key: "CONTACT_FROM_EMAIL", class: "OPTIONAL", notes: "Verified sender" },
  { key: "FORM_WEBHOOK_URL", class: "SECRET", notes: "Alt notification channel" },
  { key: "MEDIA_S3_ACCESS_KEY_ID", class: "SECRET", notes: "Object storage" },
  { key: "MEDIA_S3_SECRET_ACCESS_KEY", class: "SECRET", notes: "Object storage" },
  { key: "MEDIA_STORAGE_PROVIDER", class: "OPTIONAL", notes: "local (dev) or s3" },
  { key: "MEDIA_ALLOW_LOCAL_IN_PRODUCTION", class: "DEVELOPMENT_ONLY", notes: "Never set in real prod" },
  { key: "ALLOW_FORM_LOG_FALLBACK", class: "DEVELOPMENT_ONLY", notes: "Never set in real prod" },
  { key: "AI_SECRETS_ENCRYPTION_KEY", class: "SECRET", notes: "AES key material for Admin-stored AI provider keys (falls back to ADMIN_SESSION_SECRET)" },
  { key: "OPENAI_API_KEY", class: "SECRET", notes: "Env fallback LLM key if Admin provider not set" },
  { key: "AI_PROVIDER_API_KEY", class: "SECRET", notes: "Alt env fallback LLM key" },
  { key: "ANTHROPIC_API_KEY", class: "SECRET", notes: "Env fallback for Claude" },
  { key: "GOOGLE_AI_API_KEY", class: "SECRET", notes: "Env fallback for Gemini" },
  { key: "XAI_API_KEY", class: "SECRET", notes: "Env fallback for Grok" },
  { key: "OPENROUTER_API_KEY", class: "SECRET", notes: "Env fallback for OpenRouter" },
  { key: "AGENT_ROUTER_TOKEN", class: "SECRET", notes: "Env fallback for Agent Router (or AGENTROUTER_API_KEY)" },
  { key: "TAVILY_API_KEY", class: "SECRET", notes: "Optional research provider" },
  { key: "NEXT_PUBLIC_SITE_URL", class: "PUBLIC", notes: "Canonical origin" },
  { key: "NEXT_PUBLIC_CONTACT_EMAIL", class: "PUBLIC", notes: "Prefer Site Settings after Phase 4" },
  { key: "NEXT_PUBLIC_CONTACT_PHONE", class: "PUBLIC", notes: "Prefer Site Settings after Phase 4" },
  { key: "NEXT_PUBLIC_WHATSAPP", class: "PUBLIC", notes: "Prefer Site Settings after Phase 4" },
  { key: "NEXT_PUBLIC_LOCATION_LABEL", class: "PUBLIC", notes: "Prefer Site Settings extras" },
  { key: "NEXT_PUBLIC_SERVICE_AREAS", class: "PUBLIC", notes: "Prefer Site Settings extras" },
  { key: "NEXT_PUBLIC_WORKING_HOURS", class: "PUBLIC", notes: "Prefer Site Settings extras" },
  { key: "NEXT_PUBLIC_STREET_ADDRESS", class: "PUBLIC", notes: "Prefer Site Settings extras" },
  { key: "NEXT_PUBLIC_CITY", class: "PUBLIC", notes: "Prefer Site Settings extras" },
  { key: "NEXT_PUBLIC_REGION", class: "PUBLIC", notes: "Prefer Site Settings extras" },
  { key: "NEXT_PUBLIC_POSTAL_CODE", class: "PUBLIC", notes: "Prefer Site Settings extras" },
  { key: "NEXT_PUBLIC_COUNTRY", class: "PUBLIC", notes: "Prefer Site Settings extras" },
  { key: "NEXT_PUBLIC_TWITTER_HANDLE", class: "PUBLIC", notes: "Prefer Site Settings extras" },
  { key: "NEXT_PUBLIC_RESPONSE_EXPECTATION", class: "PUBLIC", notes: "Prefer Site Settings extras" },
  { key: "NEXT_PUBLIC_GA_MEASUREMENT_ID", class: "PUBLIC", notes: "Prefer Site Settings" },
  { key: "NEXT_PUBLIC_GTM_ID", class: "PUBLIC", notes: "Prefer Site Settings" },
  { key: "NEXT_PUBLIC_CLARITY_ID", class: "PUBLIC", notes: "Prefer Site Settings" },
  { key: "MEDIA_MAX_UPLOAD_MB", class: "OPTIONAL", notes: "Prefer Site Settings extras" },
  { key: "NEXT_PUBLIC_SHOW_DRAFT_CONTENT", class: "DEVELOPMENT_ONLY", notes: "Local draft QA only" },
];

/**
 * Validate critical production configuration.
 * Throws on hard errors; returns warnings for soft gaps.
 */
export function validateServerEnv(options?: {
  throwOnError?: boolean;
}): { ok: boolean; issues: EnvIssue[] } {
  const issues: EnvIssue[] = [];
  const prod = isProductionLike();
  const preview = isPreview();

  if (prod || preview || present("DATABASE_URL")) {
    if (!present("DATABASE_URL")) {
      issues.push({
        key: "DATABASE_URL",
        message: "DATABASE_URL is required for Admin Manager and CMS.",
        severity: "error",
      });
    }
  }

  if (prod) {
    const secret = process.env.ADMIN_SESSION_SECRET?.trim() || "";
    if (secret.length < 32) {
      issues.push({
        key: "ADMIN_SESSION_SECRET",
        message:
          "ADMIN_SESSION_SECRET must be set to a long random string (≥32 characters) in production.",
        severity: "error",
      });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "";
    if (!siteUrl || /localhost|127\.0\.0\.1|vercel\.app/i.test(siteUrl)) {
      issues.push({
        key: "NEXT_PUBLIC_SITE_URL",
        message:
          "NEXT_PUBLIC_SITE_URL must be the real production origin (not localhost or preview).",
        severity: "error",
      });
    }

    const mediaProvider = (process.env.MEDIA_STORAGE_PROVIDER || "local").toLowerCase();
    if (mediaProvider === "local" && process.env.MEDIA_ALLOW_LOCAL_IN_PRODUCTION !== "1") {
      issues.push({
        key: "MEDIA_STORAGE_PROVIDER",
        message:
          "Production media requires S3-compatible storage (MEDIA_STORAGE_PROVIDER=s3). Local storage is blocked.",
        severity: "error",
      });
    }

    if (process.env.NEXT_PUBLIC_SHOW_DRAFT_CONTENT === "true") {
      issues.push({
        key: "NEXT_PUBLIC_SHOW_DRAFT_CONTENT",
        message: "Draft content flag must not be enabled in production.",
        severity: "error",
      });
    }

    if (process.env.ALLOW_FORM_LOG_FALLBACK === "true") {
      issues.push({
        key: "ALLOW_FORM_LOG_FALLBACK",
        message:
          "ALLOW_FORM_LOG_FALLBACK must not be true in production (masks missing email config).",
        severity: "warn",
      });
    }

    const emailConfigured =
      present("RESEND_API_KEY") ||
      present("FORM_WEBHOOK_URL") ||
      present("CONTACT_WEBHOOK_URL") ||
      present("WEBSITE_REVIEW_WEBHOOK_URL");
    if (!emailConfigured) {
      issues.push({
        key: "RESEND_API_KEY",
        message:
          "No form notification channel configured. Enquiries still persist, but operators will not be emailed.",
        severity: "warn",
      });
    }
  }

  const errors = issues.filter((i) => i.severity === "error");
  const throwOnError = options?.throwOnError ?? prod;
  if (throwOnError && errors.length > 0) {
    const detail = errors.map((e) => `${e.key}: ${e.message}`).join("\n");
    throw new Error(`Production environment validation failed:\n${detail}`);
  }

  return { ok: errors.length === 0, issues };
}

export function assertProductionEnv() {
  return validateServerEnv({ throwOnError: true });
}
