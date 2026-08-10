import { getAdminSiteSettingsExtras, getSiteSettingsAdmin } from "@/lib/repositories/siteSettingsRepository";
import {
  getEmailSettingsRecord,
  decryptEmailSettingsPassword,
} from "@/lib/repositories/emailSettingsRepository";
import type {
  ActiveEmailTransport,
  ResolvedSmtpConfig,
  SmtpSecurityMode,
} from "@/lib/email/types";
import { parseNotificationRecipients } from "@/lib/email/smtp-schema";

function envSmtpConfig(): ResolvedSmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const portRaw = process.env.SMTP_PORT?.trim();
  const fromEmail = process.env.SMTP_FROM_EMAIL?.trim();
  if (!host || !portRaw || !fromEmail) return null;

  const port = Number(portRaw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) return null;

  const securityRaw = process.env.SMTP_SECURITY?.trim().toUpperCase();
  const securityMode: SmtpSecurityMode =
    securityRaw === "TLS" ||
    securityRaw === "STARTTLS" ||
    securityRaw === "NONE" ||
    securityRaw === "AUTO"
      ? securityRaw
      : port === 465
        ? "TLS"
        : "STARTTLS";

  return {
    host,
    port,
    securityMode,
    username: process.env.SMTP_USER?.trim() || null,
    password: process.env.SMTP_PASSWORD?.trim() || null,
    fromName: process.env.SMTP_FROM_NAME?.trim() || null,
    fromEmail,
    replyToEmail: process.env.SMTP_REPLY_TO?.trim() || null,
  };
}

function adminRowToSmtpConfig(
  row: NonNullable<Awaited<ReturnType<typeof getEmailSettingsRecord>>>,
  password: string | null,
): ResolvedSmtpConfig | null {
  if (!row.host || row.port == null || !row.fromEmail) return null;

  return {
    host: row.host,
    port: row.port,
    securityMode: (row.securityMode as SmtpSecurityMode) || "STARTTLS",
    username: row.username,
    password,
    fromName: row.fromName,
    fromEmail: row.fromEmail,
    replyToEmail: row.replyToEmail,
  };
}

export async function resolveActiveEmailTransport(): Promise<ActiveEmailTransport> {
  const adminRow = await getEmailSettingsRecord();

  if (adminRow?.enabled) {
    const password = decryptEmailSettingsPassword(adminRow);
    const config = adminRowToSmtpConfig(adminRow, password);
    if (config) {
      return { kind: "smtp", config };
    }
    return { kind: "none" };
  }

  const envSmtp = envSmtpConfig();
  if (envSmtp) {
    return { kind: "smtp", config: envSmtp };
  }

  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey) {
    const row = await getSiteSettingsAdmin();
    const presentation = getAdminSiteSettingsExtras(row);
    const fromEmail =
      presentation.contactFromEmail ||
      process.env.CONTACT_FROM_EMAIL?.trim() ||
      process.env.SMTP_FROM_EMAIL?.trim() ||
      "Smartlance Designs <onboarding@resend.dev>";
    return { kind: "resend", apiKey: resendKey, fromEmail };
  }

  return { kind: "none" };
}

export async function resolveNotificationRecipients(): Promise<string[]> {
  const adminRow = await getEmailSettingsRecord();
  const adminRecipients = parseNotificationRecipients(
    adminRow?.notificationRecipients,
  );
  if (adminRecipients.length > 0) return adminRecipients;

  const row = await getSiteSettingsAdmin();
  const presentation = getAdminSiteSettingsExtras(row);
  const single =
    presentation.contactToEmail ||
    presentation.formToEmail ||
    process.env.CONTACT_TO_EMAIL?.trim() ||
    process.env.FORM_TO_EMAIL?.trim() ||
    null;

  return single ? [single] : [];
}

export async function isEmailDeliveryConfigured(): Promise<boolean> {
  const transport = await resolveActiveEmailTransport();
  if (transport.kind === "none") {
    return Boolean(
      process.env.FORM_WEBHOOK_URL ||
        process.env.CONTACT_WEBHOOK_URL ||
        process.env.WEBSITE_REVIEW_WEBHOOK_URL,
    );
  }

  if (transport.kind === "resend") {
    const recipients = await resolveNotificationRecipients();
    return recipients.length > 0;
  }

  const recipients = await resolveNotificationRecipients();
  return recipients.length > 0;
}

export function isEmailDeliveryConfiguredFromEnv(): boolean {
  return (
    Boolean(
      process.env.RESEND_API_KEY &&
        (process.env.CONTACT_TO_EMAIL || process.env.FORM_TO_EMAIL),
    ) ||
    Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_FROM_EMAIL) ||
    Boolean(
      process.env.FORM_WEBHOOK_URL ||
        process.env.CONTACT_WEBHOOK_URL ||
        process.env.WEBSITE_REVIEW_WEBHOOK_URL,
    )
  );
}

export async function isAdminSmtpEnabled(): Promise<boolean> {
  const row = await getEmailSettingsRecord();
  return Boolean(row?.enabled);
}
