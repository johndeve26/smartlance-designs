import { prisma, hasDatabaseUrl } from "@/lib/db";
import {
  decryptDedicatedSecret,
  encryptDedicatedSecret,
} from "@/lib/secrets/dedicated";
import { parseNotificationRecipients } from "@/lib/email/smtp-schema";
import type { SmtpSecurityMode } from "@/lib/email/types";

export const EMAIL_SETTINGS_ID = "site";

export type AdminEmailSettingsDto = {
  enabled: boolean;
  host: string | null;
  port: number | null;
  securityMode: SmtpSecurityMode;
  username: string | null;
  passwordConfigured: boolean;
  passwordLast4: string | null;
  passwordReadable: boolean;
  fromName: string | null;
  fromEmail: string | null;
  replyToEmail: string | null;
  notificationRecipients: string[];
  testRecipient: string | null;
  lastTestedAt: string | null;
  lastTestSucceededAt: string | null;
  lastTestErrorSafe: string | null;
  configurationStatus:
    | "not_configured"
    | "configured"
    | "enabled"
    | "disabled";
};

function deriveConfigurationStatus(row: {
  enabled: boolean;
  host: string | null;
  port: number | null;
  fromEmail: string | null;
  passwordCiphertext: string | null;
  username: string | null;
}): AdminEmailSettingsDto["configurationStatus"] {
  const hasCore = Boolean(row.host && row.port && row.fromEmail);
  if (!hasCore) return "not_configured";
  if (!row.enabled) return "disabled";
  if (row.username && !row.passwordCiphertext) return "configured";
  return "enabled";
}

export async function getEmailSettingsRecord() {
  if (!hasDatabaseUrl()) return null;
  return prisma.emailSettings.findUnique({
    where: { id: EMAIL_SETTINGS_ID },
  });
}

export function decryptEmailSettingsPassword(
  row: NonNullable<Awaited<ReturnType<typeof getEmailSettingsRecord>>>,
): string | null {
  if (!row.passwordCiphertext || !row.passwordIv || !row.passwordTag) {
    return null;
  }
  try {
    return decryptDedicatedSecret({
      ciphertext: row.passwordCiphertext,
      iv: row.passwordIv,
      tag: row.passwordTag,
    });
  } catch {
    return null;
  }
}

/** True when SMTP auth credentials can be loaded for delivery (does not expose password). */
export function isEmailSettingsPasswordReadable(
  row: NonNullable<Awaited<ReturnType<typeof getEmailSettingsRecord>>>,
): boolean {
  if (!row.username?.trim()) return true;
  if (!row.passwordCiphertext) return false;
  const password = decryptEmailSettingsPassword(row);
  return Boolean(password?.length);
}

export function resolveEmailSettingsSmtpConfig(
  row: NonNullable<Awaited<ReturnType<typeof getEmailSettingsRecord>>>,
): { ok: true; config: import("@/lib/email/types").ResolvedSmtpConfig } | { ok: false; error: string } {
  if (!row.host || row.port == null || !row.fromEmail) {
    return { ok: false, error: "SMTP configuration is incomplete." };
  }

  if (row.username?.trim() && row.passwordCiphertext && !isEmailSettingsPasswordReadable(row)) {
    return {
      ok: false,
      error:
        "Stored SMTP password could not be decrypted. Re-enter the mailbox password and save, or confirm AI_SECRETS_ENCRYPTION_KEY has not changed since the password was saved.",
    };
  }

  const password = decryptEmailSettingsPassword(row);
  if (row.username?.trim() && !password) {
    return {
      ok: false,
      error: "SMTP password is required when a username is configured.",
    };
  }

  return {
    ok: true,
    config: {
      host: row.host,
      port: row.port,
      securityMode: (row.securityMode as import("@/lib/email/types").SmtpSecurityMode) || "STARTTLS",
      username: row.username,
      password,
      fromName: row.fromName,
      fromEmail: row.fromEmail,
      replyToEmail: row.replyToEmail,
    },
  };
}

export function toAdminEmailSettingsDto(
  row: NonNullable<Awaited<ReturnType<typeof getEmailSettingsRecord>>>,
): AdminEmailSettingsDto {
  return {
    enabled: row.enabled,
    host: row.host,
    port: row.port,
    securityMode: (row.securityMode as SmtpSecurityMode) || "STARTTLS",
    username: row.username,
    passwordConfigured: Boolean(row.passwordCiphertext),
    passwordLast4: row.passwordLast4,
    passwordReadable: isEmailSettingsPasswordReadable(row),
    fromName: row.fromName,
    fromEmail: row.fromEmail,
    replyToEmail: row.replyToEmail,
    notificationRecipients: parseNotificationRecipients(
      row.notificationRecipients,
    ),
    testRecipient: row.testRecipient,
    lastTestedAt: row.lastTestedAt?.toISOString() ?? null,
    lastTestSucceededAt: row.lastTestSucceededAt?.toISOString() ?? null,
    lastTestErrorSafe: row.lastTestErrorSafe,
    configurationStatus: deriveConfigurationStatus(row),
  };
}

export async function getAdminEmailSettings(): Promise<AdminEmailSettingsDto | null> {
  const row = await getEmailSettingsRecord();
  if (!row) return null;
  return toAdminEmailSettingsDto(row);
}

export async function ensureEmailSettingsRow() {
  return prisma.emailSettings.upsert({
    where: { id: EMAIL_SETTINGS_ID },
    create: { id: EMAIL_SETTINGS_ID },
    update: {},
  });
}

export function encryptEmailPassword(plaintext: string) {
  const enc = encryptDedicatedSecret(plaintext);
  const last4 =
    plaintext.trim().length >= 4
      ? plaintext.trim().slice(-4)
      : null;
  return {
    passwordCiphertext: enc.ciphertext,
    passwordIv: enc.iv,
    passwordTag: enc.tag,
    passwordLast4: last4,
  };
}

export async function updateEmailSettingsTestMetadata(input: {
  success: boolean;
  errorSafe?: string | null;
}) {
  const now = new Date();
  await ensureEmailSettingsRow();
  await prisma.emailSettings.update({
    where: { id: EMAIL_SETTINGS_ID },
    data: {
      lastTestedAt: now,
      lastTestSucceededAt: input.success ? now : undefined,
      lastTestErrorSafe: input.success ? null : input.errorSafe ?? "Test failed.",
    },
  });
}
