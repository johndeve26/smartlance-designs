export type AnalyticsEvent =
  | "get_quote_clicked"
  | "free_review_clicked"
  | "free_review_submitted"
  | "free_review_submit_error"
  | "contact_form_started"
  | "contact_form_submitted"
  | "contact_form_submit_error"
  | "portfolio_viewed"
  | "case_study_viewed"
  | "service_viewed"
  | "solution_viewed"
  | "solution_cta_clicked"
  | "solution_service_clicked"
  | "blog_service_cta_clicked"
  | "resource_click"
  | "resource_topic_click"
  | "resource_goal_click"
  | "email_clicked"
  | "phone_clicked"
  | "whatsapp_clicked"
  | "tool_start"
  | "tool_complete"
  | "project_planner_start"
  | "project_planner_complete"
  | "project_planner_restart";

type EventPayload = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
  }
}

/**
 * Analytics abstraction — safe no-ops until IDs are configured.
 * Never send form field values or personal data.
 */
export function trackEvent(event: AnalyticsEvent, payload: EventPayload = {}) {
  if (typeof window === "undefined") return;

  const safePayload = sanitizePayload(payload);
  const detail = { event, ...safePayload };

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(detail);

  if (typeof window.gtag === "function") {
    window.gtag("event", event, safePayload);
  }

  if (typeof window.clarity === "function") {
    window.clarity("event", event);
  }

  if (process.env.NODE_ENV === "development") {
    console.info("[analytics]", detail);
  }
}

function sanitizePayload(payload: EventPayload): EventPayload {
  const blocked = /email|phone|name|message|details|quote|company|website/i;
  const safe: EventPayload = {};
  for (const [key, value] of Object.entries(payload)) {
    if (blocked.test(key)) continue;
    safe[key] = value;
  }
  return safe;
}

export function getAnalyticsConfig() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID || "";
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID || "";

  return {
    gaId,
    gtmId,
    clarityId,
    /** Prefer GTM-managed GA4 to avoid double counting */
    loadDirectGa: Boolean(gaId && !gtmId),
  };
}
