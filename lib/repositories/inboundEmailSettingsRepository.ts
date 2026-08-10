import { prisma, hasDatabaseUrl } from "@/lib/db";
import {
  decryptDedicatedSecret,
  encryptDedicatedSecret,
} from "@/lib/secrets/dedicated";
import type { SmtpSecurityMode } from "@/lib/email/types";
import { buildMailboxKey, type ResolvedImapConfig } from "@/lib/email/inbound/imap-provider";

export const INBOUND_EMAIL_SETTINGS_ID = "inbound";

export type AdminInboundEmailSettingsDto = {
  enabled: boolean;
  providerType: string;
  host: string | null;
  port: number | null;
  securityMode: SmtpSecurityMode;
  username: string | null;
  passwordConfigured: boolean;
  passwordLast4: string | null;
  mailboxFolder: string;
  crmReplyToEmail: string | null;
  syncEnabledAt: string | null;
  lastSyncedAt: string | null;
  lastSuccessfulSyncAt: string | null;
  lastSyncErrorSafe: string | null;
  lastImportCount: number;
  configurationStatus: "not_configured" | "configured" | "enabled" | "disabled";
};

export async function getInboundEmailSettingsRecord() {
  if (!hasDatabaseUrl()) return null;
  return prisma.inboundEmailSettings.findUnique({
    where: { id: INBOUND_EMAIL_SETTINGS_ID },
  });
}

export function decryptInboundPassword(
  row: NonNullable<Awaited<ReturnType<typeof getInboundEmailSettingsRecord>>>,
): string | null {
  if (!row.passwordCiphertext || !row.passwordIv || !row.passwordTag) return null;
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

export function toAdminInboundEmailSettingsDto(
  row: NonNullable<Awaited<ReturnType<typeof getInboundEmailSettingsRecord>>>,
): AdminInboundEmailSettingsDto {
  const hasCore = Boolean(row.host && row.port && row.username);
  let configurationStatus: AdminInboundEmailSettingsDto["configurationStatus"] =
    "not_configured";
  if (hasCore) {
    configurationStatus = row.enabled ? "enabled" : "disabled";
    if (!row.passwordCiphertext) configurationStatus = "configured";
  }

  return {
    enabled: row.enabled,
    providerType: row.providerType,
    host: row.host,
    port: row.port,
    securityMode: (row.securityMode as SmtpSecurityMode) || "TLS",
    username: row.username,
    passwordConfigured: Boolean(row.passwordCiphertext),
    passwordLast4: row.passwordLast4,
    mailboxFolder: row.mailboxFolder || "INBOX",
    crmReplyToEmail: row.crmReplyToEmail,
    syncEnabledAt: row.syncEnabledAt?.toISOString() ?? null,
    lastSyncedAt: row.lastSyncedAt?.toISOString() ?? null,
    lastSuccessfulSyncAt: row.lastSuccessfulSyncAt?.toISOString() ?? null,
    lastSyncErrorSafe: row.lastSyncErrorSafe,
    lastImportCount: row.lastImportCount,
    configurationStatus,
  };
}

export async function getAdminInboundEmailSettings() {
  const row = await getInboundEmailSettingsRecord();
  if (!row) return null;
  return toAdminInboundEmailSettingsDto(row);
}

export async function ensureInboundEmailSettingsRow() {
  return prisma.inboundEmailSettings.upsert({
    where: { id: INBOUND_EMAIL_SETTINGS_ID },
    create: { id: INBOUND_EMAIL_SETTINGS_ID },
    update: {},
  });
}

export function encryptInboundPassword(plaintext: string) {
  const enc = encryptDedicatedSecret(plaintext);
  return {
    passwordCiphertext: enc.ciphertext,
    passwordIv: enc.iv,
    passwordTag: enc.tag,
    passwordLast4:
      plaintext.trim().length >= 4 ? plaintext.trim().slice(-4) : null,
  };
}

export function buildImapConfigFromRow(
  row: NonNullable<Awaited<ReturnType<typeof getInboundEmailSettingsRecord>>>,
): ResolvedImapConfig | null {
  if (!row.host || row.port == null || !row.username) return null;
  const password = decryptInboundPassword(row);
  if (!password) return null;
  return {
    host: row.host,
    port: row.port,
    securityMode: (row.securityMode as SmtpSecurityMode) || "TLS",
    username: row.username,
    password,
    mailboxFolder: row.mailboxFolder || "INBOX",
  };
}

export async function getMailboxState(mailboxKey: string) {
  return prisma.inboundMailboxState.findUnique({
    where: { mailboxKey },
  });
}

export async function upsertMailboxState(input: {
  mailboxKey: string;
  uidValidity: bigint;
  lastSeenUid: bigint;
  lastErrorSafe?: string | null;
}) {
  return prisma.inboundMailboxState.upsert({
    where: { mailboxKey: input.mailboxKey },
    create: {
      id: "primary",
      mailboxKey: input.mailboxKey,
      uidValidity: input.uidValidity,
      lastSeenUid: input.lastSeenUid,
      lastSyncedAt: new Date(),
      lastErrorSafe: input.lastErrorSafe ?? null,
    },
    update: {
      uidValidity: input.uidValidity,
      lastSeenUid: input.lastSeenUid,
      lastSyncedAt: new Date(),
      lastErrorSafe: input.lastErrorSafe ?? null,
    },
  });
}

export function resolveMailboxKeyFromConfig(config: ResolvedImapConfig) {
  return buildMailboxKey(config);
}
