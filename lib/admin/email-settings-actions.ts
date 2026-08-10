"use server";

import { assertSameOrigin, requireAdminUser } from "@/lib/admin/session";
import { writeAuditLog } from "@/lib/repositories/auditRepository";
import { isFormRateLimited } from "@/lib/forms";
import { canEncryptDedicatedSecrets } from "@/lib/secrets/dedicated";
import {
  ensureEmailSettingsRow,
  encryptEmailPassword,
  getAdminEmailSettings,
  getEmailSettingsRecord,
  resolveEmailSettingsSmtpConfig,
  updateEmailSettingsTestMetadata,
  type AdminEmailSettingsDto,
} from "@/lib/repositories/emailSettingsRepository";
import {
  smtpSettingsUpdateSchema,
} from "@/lib/email/smtp-schema";
import { verifySmtpConnection, sendViaSmtp } from "@/lib/email/smtp";
import { normalizeSmtpError } from "@/lib/email/errors";
import { smtpTestEmailContent } from "@/lib/email/templates";

const TEST_RATE_LIMIT = 5;
const TEST_RATE_WINDOW_MS = 15 * 60 * 1000;

type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

function parseRecipientsField(raw: string): string[] {
  if (!raw.trim()) return [];
  return raw
    .split(/[,;\n]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function resolveSmtpConfigOrError(
  row: NonNullable<Awaited<ReturnType<typeof getEmailSettingsRecord>>>,
) {
  return resolveEmailSettingsSmtpConfig(row);
}

function checkTestRateLimit(userId: string): ActionResult | null {
  if (
    isFormRateLimited(
      `smtp-test:${userId}`,
      TEST_RATE_LIMIT,
      TEST_RATE_WINDOW_MS,
    )
  ) {
    return {
      ok: false,
      error: "Too many SMTP test requests. Try again in a few minutes.",
    };
  }
  return null;
}

async function recordSmtpTestAttempt(input: {
  userId: string;
  action: "smtp.connection_tested" | "smtp.test_email_sent";
  success: boolean;
  errorSafe?: string | null;
  errorCode?: string;
  host: string;
  port: number;
  securityMode?: string;
  recipientDomain?: string;
}) {
  try {
    await updateEmailSettingsTestMetadata({
      success: input.success,
      errorSafe: input.errorSafe,
    });
  } catch (err) {
    console.error(
      "[email:smtp:test-metadata]",
      err instanceof Error ? err.message : err,
    );
  }

  try {
    await writeAuditLog({
      actorId: input.userId,
      action: input.action,
      entityType: "EmailSettings",
      entityId: "site",
      metadata: {
        success: input.success,
        host: input.host,
        port: input.port,
        ...(input.securityMode ? { securityMode: input.securityMode } : {}),
        ...(input.errorCode ? { errorCode: input.errorCode } : {}),
        ...(input.recipientDomain ? { recipientDomain: input.recipientDomain } : {}),
      },
    });
  } catch (err) {
    console.error(
      "[email:smtp:audit]",
      err instanceof Error ? err.message : err,
    );
  }
}

export async function saveEmailSettingsAction(
  formData: FormData,
): Promise<ActionResult> {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_settings");

  const enabled = String(formData.get("enabled")) === "on";
  const hostRaw = String(formData.get("host") || "").trim();
  const portRaw = String(formData.get("port") || "").trim();
  const port = portRaw ? Number(portRaw) : null;
  const securityMode = String(formData.get("securityMode") || "STARTTLS").trim();
  const username = String(formData.get("username") || "").trim() || null;
  const fromName = String(formData.get("fromName") || "").trim() || null;
  const fromEmail = String(formData.get("fromEmail") || "").trim() || null;
  const replyToEmail = String(formData.get("replyToEmail") || "").trim() || null;
  const testRecipient =
    String(formData.get("testRecipient") || "").trim() || null;
  const notificationRecipients = parseRecipientsField(
    String(formData.get("notificationRecipients") || ""),
  );
  const newPassword = String(formData.get("newPassword") || "").trim();
  const clearPassword = String(formData.get("clearPassword")) === "1";

  const parsed = smtpSettingsUpdateSchema.safeParse({
    enabled,
    host: hostRaw || null,
    port: port != null && Number.isFinite(port) ? port : null,
    securityMode,
    username,
    fromName,
    fromEmail,
    replyToEmail,
    notificationRecipients,
    testRecipient,
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message || "Invalid SMTP settings.";
    return { ok: false, error: first };
  }

  if ((newPassword || clearPassword) && !canEncryptDedicatedSecrets()) {
    return {
      ok: false,
      error:
        "Cannot store SMTP password: set AI_SECRETS_ENCRYPTION_KEY or APP_SECRETS_ENCRYPTION_KEY (≥16 chars).",
    };
  }

  await ensureEmailSettingsRow();
  const existing = await getEmailSettingsRecord();

  let passwordCiphertext = existing?.passwordCiphertext ?? null;
  let passwordIv = existing?.passwordIv ?? null;
  let passwordTag = existing?.passwordTag ?? null;
  let passwordLast4 = existing?.passwordLast4 ?? null;
  let passwordAction: "unchanged" | "set" | "cleared" = "unchanged";

  if (clearPassword) {
    passwordCiphertext = null;
    passwordIv = null;
    passwordTag = null;
    passwordLast4 = null;
    passwordAction = "cleared";
  } else if (newPassword) {
    const enc = encryptEmailPassword(newPassword);
    passwordCiphertext = enc.passwordCiphertext;
    passwordIv = enc.passwordIv;
    passwordTag = enc.passwordTag;
    passwordLast4 = enc.passwordLast4;
    passwordAction = "set";
  }

  if (
    parsed.data.enabled &&
    parsed.data.username &&
    !passwordCiphertext &&
    passwordAction !== "set"
  ) {
    return {
      ok: false,
      error: "SMTP password is required when a username is configured.",
    };
  }

  const wasEnabled = existing?.enabled ?? false;

  const { prisma } = await import("@/lib/db");
  await prisma.emailSettings.update({
    where: { id: "site" },
    data: {
      enabled: parsed.data.enabled,
      host: parsed.data.host,
      port: parsed.data.port,
      securityMode: parsed.data.securityMode,
      username: parsed.data.username,
      passwordCiphertext,
      passwordIv,
      passwordTag,
      passwordLast4,
      fromName: parsed.data.fromName,
      fromEmail: parsed.data.fromEmail,
      replyToEmail: parsed.data.replyToEmail,
      notificationRecipients: parsed.data.notificationRecipients,
      testRecipient: parsed.data.testRecipient,
      updatedById: user.id,
    },
  });

  const auditAction = !wasEnabled && parsed.data.enabled
    ? "smtp.enabled"
    : wasEnabled && !parsed.data.enabled
      ? "smtp.disabled"
      : passwordAction === "set"
        ? "smtp.password_replaced"
        : passwordAction === "cleared"
          ? "smtp.password_removed"
          : "smtp.configuration_updated";

  await writeAuditLog({
    actorId: user.id,
    action: auditAction,
    entityType: "EmailSettings",
    entityId: "site",
    metadata: {
      enabled: parsed.data.enabled,
      host: parsed.data.host,
      port: parsed.data.port,
      securityMode: parsed.data.securityMode,
      fromEmail: parsed.data.fromEmail,
      passwordAction,
      recipientCount: parsed.data.notificationRecipients.length,
    },
  });

  return { ok: true, message: "Email settings saved." };
}

export async function testSmtpConnectionAction(): Promise<ActionResult> {
  try {
    await assertSameOrigin();
    const user = await requireAdminUser("manage_settings");
    const rateLimited = checkTestRateLimit(user.id);
    if (rateLimited) return rateLimited;

    const row = await getEmailSettingsRecord();
    if (!row?.enabled) {
      return { ok: false, error: "Enable and save SMTP settings before testing." };
    }

    const resolved = resolveSmtpConfigOrError(row);
    if (!resolved.ok) {
      return { ok: false, error: resolved.error };
    }
    const config = resolved.config;

    try {
      await verifySmtpConnection(config);
      await recordSmtpTestAttempt({
        userId: user.id,
        action: "smtp.connection_tested",
        success: true,
        host: config.host,
        port: config.port,
        securityMode: config.securityMode,
      });
      return { ok: true, message: "SMTP connection verified." };
    } catch (error) {
      const normalized = normalizeSmtpError(error);
      await recordSmtpTestAttempt({
        userId: user.id,
        action: "smtp.connection_tested",
        success: false,
        errorSafe: normalized.message,
        errorCode: normalized.code,
        host: config.host,
        port: config.port,
        securityMode: config.securityMode,
      });
      return { ok: false, error: normalized.message };
    }
  } catch (error) {
    console.error(
      "[email:smtp:connection-test]",
      error instanceof Error ? error.message : error,
    );
    return {
      ok: false,
      error:
        error instanceof Error && error.message
          ? error.message
          : "SMTP connection test failed unexpectedly.",
    };
  }
}

export async function sendSmtpTestEmailAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    await assertSameOrigin();
    const user = await requireAdminUser("manage_settings");
    const rateLimited = checkTestRateLimit(user.id);
    if (rateLimited) return rateLimited;

    const row = await getEmailSettingsRecord();
    if (!row?.enabled) {
      return { ok: false, error: "Enable and save SMTP settings before testing." };
    }

    const resolved = resolveSmtpConfigOrError(row);
    if (!resolved.ok) {
      return { ok: false, error: resolved.error };
    }
    const config = resolved.config;

    const overrideRecipient = String(formData.get("recipient") || "").trim();
    const recipient =
      overrideRecipient ||
      row.testRecipient?.trim() ||
      user.email?.trim() ||
      null;

    if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
      return { ok: false, error: "A valid test recipient email is required." };
    }

    const sentAt = new Date().toISOString();
    const content = smtpTestEmailContent(sentAt);

    try {
      await sendViaSmtp(config, {
        to: recipient,
        subject: content.subject,
        text: content.text,
      });

      await recordSmtpTestAttempt({
        userId: user.id,
        action: "smtp.test_email_sent",
        success: true,
        host: config.host,
        port: config.port,
        recipientDomain: recipient.split("@")[1] || "unknown",
      });

      return { ok: true, message: `Test email sent to ${recipient}.` };
    } catch (error) {
      const normalized = normalizeSmtpError(error);
      await recordSmtpTestAttempt({
        userId: user.id,
        action: "smtp.test_email_sent",
        success: false,
        errorSafe: normalized.message,
        errorCode: normalized.code,
        host: config.host,
        port: config.port,
        recipientDomain: recipient.split("@")[1] || "unknown",
      });
      return { ok: false, error: normalized.message };
    }
  } catch (error) {
    console.error(
      "[email:smtp:test-email]",
      error instanceof Error ? error.message : error,
    );
    return {
      ok: false,
      error:
        error instanceof Error && error.message
          ? error.message
          : "Test email failed unexpectedly.",
    };
  }
}

export async function getEmailSettingsForAdminAction(): Promise<
  AdminEmailSettingsDto | null
> {
  await requireAdminUser("manage_settings");
  return getAdminEmailSettings();
}
