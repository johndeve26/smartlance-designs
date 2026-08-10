import { NextResponse } from "next/server";
import { siteConfig } from "@/lib/site";
import { OUTBOUND_TIMEOUTS, timeoutSignal } from "@/lib/ops/request-timeout";
import {
  isEmailDeliveryConfigured,
  isEmailDeliveryConfiguredFromEnv,
  resolveNotificationRecipients,
} from "@/lib/email/config";
import {
  sendTransactionalEmail,
  escapeHeaderFragment,
} from "@/lib/email/send";
import {
  formatContactEmailText,
  formatReviewEmailText,
  contactNotificationSubject,
  reviewNotificationSubject,
} from "@/lib/email/templates";

type FormPayload = Record<string, unknown>;

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

export function formDeliveryConfiguredFromEnv(): boolean {
  return isEmailDeliveryConfiguredFromEnv();
}

export async function formDeliveryConfigured(): Promise<boolean> {
  return isEmailDeliveryConfigured();
}

/**
 * Deliver form submissions via webhook and/or shared transactional email service.
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

  const recipients = await resolveNotificationRecipients();
  if (recipients.length > 0) {
    const text =
      input.type === "contact"
        ? formatContactEmailText(input.payload, submittedAt)
        : formatReviewEmailText(input.payload, submittedAt);
    const subject =
      input.type === "contact"
        ? contactNotificationSubject(input.payload)
        : reviewNotificationSubject(input.payload);

    const emailResult = await sendTransactionalEmail({
      to: recipients,
      subject,
      text,
      replyTo: escapeHeaderFragment(input.payload.email) || undefined,
    });

    results.push({
      channel: "email",
      ok: emailResult.success,
      detail: emailResult.success
        ? undefined
        : emailResult.errorMessage || emailResult.errorCode,
    });
  }

  if (results.length === 0) {
    const allowLog =
      process.env.NODE_ENV !== "production" ||
      process.env.ALLOW_FORM_LOG_FALLBACK === "true";

    if (allowLog) {
      console.info("[form-submission:dev]", input.type, {
        submittedAt,
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
            "No webhook or email delivery configured",
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
