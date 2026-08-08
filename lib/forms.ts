import { NextResponse } from "next/server";
import { siteConfig } from "@/lib/site";
import { OUTBOUND_TIMEOUTS, timeoutSignal } from "@/lib/ops/request-timeout";
import {
  getAdminSiteSettingsExtras,
  getSiteSettingsAdmin,
} from "@/lib/repositories/siteSettingsRepository";

type FormPayload = Record<string, unknown>;

function escapePlain(value: unknown) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .trim();
}

/** Strip CR/LF for email headers / subject fragments */
function escapeHeaderFragment(value: unknown) {
  return escapePlain(value).replace(/[\r\n]+/g, " ");
}

function payloadRef(payload: FormPayload) {
  const ref = escapeHeaderFragment(payload.reference);
  return ref ? ` (${ref})` : "";
}

function formatContactEmail(payload: FormPayload, submittedAt: string) {
  return [
    "New Smartlance Project Enquiry",
    "",
    `Reference: ${escapePlain(payload.reference) || "—"}`,
    `Submitted: ${submittedAt}`,
    `Name: ${escapePlain(payload.name)}`,
    `Email: ${escapePlain(payload.email)}`,
    `Company: ${escapePlain(payload.company) || "—"}`,
    `Website: ${escapePlain(payload.website) || "—"}`,
    `Service: ${escapePlain(payload.service)}`,
    `Budget: ${escapePlain(payload.budget) || "—"}`,
    `Timeline: ${escapePlain(payload.timeline) || "—"}`,
    `Referral source: ${escapePlain(payload.referralSource) || "—"}`,
    payload.adminPath
      ? `Admin: ${escapePlain(payload.adminPath)}`
      : null,
    "",
    "Project details:",
    escapePlain(payload.projectDetails),
  ]
    .filter((line) => line !== null)
    .join("\n");
}

function formatReviewEmail(payload: FormPayload, submittedAt: string) {
  return [
    "New Free Website Review Request",
    "",
    `Reference: ${escapePlain(payload.reference) || "—"}`,
    `Submitted: ${submittedAt}`,
    `Name: ${escapePlain(payload.name)}`,
    `Email: ${escapePlain(payload.email)}`,
    `Website URL: ${escapePlain(payload.website)}`,
    `Main concern: ${escapePlain(payload.mainConcern)}`,
    payload.adminPath
      ? `Admin: ${escapePlain(payload.adminPath)}`
      : null,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

/** Simple in-memory sliding-window rate limit (per process). */
const rateBuckets = new Map<string, number[]>();

export function isFormRateLimited(
  key: string,
  limit = 8,
  windowMs = 60 * 60 * 1000,
): boolean {
  const now = Date.now();
  const recent = (rateBuckets.get(key) ?? []).filter(
    (timestamp) => now - timestamp < windowMs,
  );
  if (recent.length >= limit) {
    rateBuckets.set(key, recent);
    return true;
  }
  recent.push(now);
  rateBuckets.set(key, recent);
  return false;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

async function getFormNotificationTargets() {
  const row = await getSiteSettingsAdmin();
  const presentation = getAdminSiteSettingsExtras(row);
  const toEmail =
    presentation.contactToEmail ||
    presentation.formToEmail ||
    process.env.CONTACT_TO_EMAIL ||
    process.env.FORM_TO_EMAIL;
  const fromEmail =
    presentation.contactFromEmail ||
    process.env.CONTACT_FROM_EMAIL ||
    "Smartlance Designs <onboarding@resend.dev>";
  return { toEmail, fromEmail };
}

export function formDeliveryConfiguredFromEnv(): boolean {
  return (
    Boolean(
      process.env.RESEND_API_KEY &&
        (process.env.CONTACT_TO_EMAIL || process.env.FORM_TO_EMAIL),
    ) ||
    Boolean(
      process.env.FORM_WEBHOOK_URL ||
        process.env.CONTACT_WEBHOOK_URL ||
        process.env.WEBSITE_REVIEW_WEBHOOK_URL,
    )
  );
}

export async function formDeliveryConfigured(): Promise<boolean> {
  if (
    process.env.FORM_WEBHOOK_URL ||
    process.env.CONTACT_WEBHOOK_URL ||
    process.env.WEBSITE_REVIEW_WEBHOOK_URL
  ) {
    return true;
  }

  const { toEmail } = await getFormNotificationTargets();
  return Boolean(process.env.RESEND_API_KEY && toEmail);
}

/**
 * Deliver form submissions via webhook and/or Resend.
 * Secrets are server-only — never NEXT_PUBLIC_*.
 */
export async function deliverFormSubmission(input: {
  type: "contact" | "website-review";
  payload: FormPayload;
}) {
  const submittedAt = new Date().toISOString();
  const results: { channel: string; ok: boolean; detail?: string }[] = [];

  const typeWebhook =
    input.type === "contact"
      ? process.env.CONTACT_WEBHOOK_URL
      : process.env.WEBSITE_REVIEW_WEBHOOK_URL;
  const webhook = typeWebhook || process.env.FORM_WEBHOOK_URL;

  if (webhook) {
    try {
      const response = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: input.type,
          submittedAt,
          data: input.payload,
        }),
        signal: timeoutSignal(OUTBOUND_TIMEOUTS.notification),
      });
      results.push({
        channel: "webhook",
        ok: response.ok,
        detail: response.ok ? undefined : `HTTP ${response.status}`,
      });
    } catch (error) {
      results.push({
        channel: "webhook",
        ok: false,
        detail: error instanceof Error ? error.message : "Webhook failed",
      });
    }
  }

  const resendKey = process.env.RESEND_API_KEY;
  const { toEmail, fromEmail } = await getFormNotificationTargets();

  if (resendKey && toEmail) {
    const text =
      input.type === "contact"
        ? formatContactEmail(input.payload, submittedAt)
        : formatReviewEmail(input.payload, submittedAt);
    const subject =
      input.type === "contact"
        ? `New Smartlance Project Enquiry${payloadRef(input.payload)}`
        : `New Smartlance Website Review Request${payloadRef(input.payload)}`;

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [toEmail],
          reply_to: escapeHeaderFragment(input.payload.email) || undefined,
          subject,
          text,
        }),
        signal: timeoutSignal(OUTBOUND_TIMEOUTS.notification),
      });
      results.push({
        channel: "email",
        ok: response.ok,
        detail: response.ok ? undefined : `HTTP ${response.status}`,
      });
    } catch (error) {
      results.push({
        channel: "email",
        ok: false,
        detail: error instanceof Error ? error.message : "Email failed",
      });
    }
  }

  if (results.length === 0) {
    const allowLog =
      process.env.NODE_ENV !== "production" ||
      process.env.ALLOW_FORM_LOG_FALLBACK === "true";

    if (allowLog) {
      console.info("[form-submission:dev]", input.type, {
        submittedAt,
        // Avoid logging full PII in production even with fallback
        keys: Object.keys(input.payload),
      });
      return { delivered: true, mode: "log" as const, results };
    }

    return {
      delivered: false,
      mode: "unconfigured" as const,
      results: [
        {
          channel: "none",
          ok: false,
          detail:
            "No FORM_WEBHOOK_URL / CONTACT_WEBHOOK_URL / Resend configured",
        },
      ],
    };
  }

  const ok = results.some((result) => result.ok);
  return { delivered: ok, mode: "external" as const, results };
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export function jsonSuccess(message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: true, message, ...extra });
}

/** Public inbox shown in failure messages — never a secret. */
export function publicContactEmail() {
  return siteConfig.email;
}
