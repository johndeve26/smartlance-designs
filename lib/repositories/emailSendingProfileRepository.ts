import type { EmailProfileTestStatus, EmailSendingProfile, EmailTransportType } from "@prisma/client";
import { prisma, hasDatabaseUrl } from "@/lib/db";
import {
  decryptDedicatedSecret,
  encryptDedicatedSecret,
} from "@/lib/secrets/dedicated";
import type { SmtpSecurityMode } from "@/lib/email/types";

export type AdminSendingProfileDto = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  fromName: string;
  fromEmail: string;
  replyToName: string | null;
  replyToEmail: string | null;
  transportType: EmailTransportType;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpSecurityMode: SmtpSecurityMode;
  smtpUsername: string | null;
  smtpPasswordConfigured: boolean;
  smtpPasswordLast4: string | null;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
  lastTestedAt: string | null;
  lastTestStatus: EmailProfileTestStatus;
  lastTestErrorCode: string | null;
  routeCount: number;
};

function decryptProfilePassword(row: EmailSendingProfile): string | null {
  if (!row.smtpPasswordCiphertext || !row.smtpPasswordIv || !row.smtpPasswordTag) {
    return null;
  }
  try {
    return decryptDedicatedSecret({
      ciphertext: row.smtpPasswordCiphertext,
      iv: row.smtpPasswordIv,
      tag: row.smtpPasswordTag,
    });
  } catch {
    return null;
  }
}

export function encryptProfileSmtpPassword(plaintext: string) {
  const enc = encryptDedicatedSecret(plaintext);
  const last4 =
    plaintext.trim().length >= 4 ? plaintext.trim().slice(-4) : null;
  return {
    smtpPasswordCiphertext: enc.ciphertext,
    smtpPasswordIv: enc.iv,
    smtpPasswordTag: enc.tag,
    smtpPasswordLast4: last4,
  };
}

export function resolveCustomSmtpConfig(
  row: EmailSendingProfile,
): { ok: true; config: import("@/lib/email/types").ResolvedSmtpConfig } | { ok: false; error: string } {
  if (row.transportType !== "CUSTOM_SMTP") {
    return { ok: false, error: "Profile does not use custom SMTP." };
  }
  if (!row.smtpHost || row.smtpPort == null) {
    return { ok: false, error: "Custom SMTP configuration is incomplete." };
  }
  const password = decryptProfilePassword(row);
  if (row.smtpUsername?.trim() && !password) {
    return {
      ok: false,
      error: "Custom SMTP password is required when a username is configured.",
    };
  }
  return {
    ok: true,
    config: {
      host: row.smtpHost,
      port: row.smtpPort,
      securityMode: (row.smtpSecurityMode as SmtpSecurityMode) || "STARTTLS",
      username: row.smtpUsername,
      password,
      fromName: row.fromName,
      fromEmail: row.fromEmail,
      replyToEmail: row.replyToEmail,
    },
  };
}

export function toAdminSendingProfileDto(
  row: EmailSendingProfile & { _count?: { routingRules: number } },
): AdminSendingProfileDto {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    fromName: row.fromName,
    fromEmail: row.fromEmail,
    replyToName: row.replyToName,
    replyToEmail: row.replyToEmail,
    transportType: row.transportType,
    smtpHost: row.smtpHost,
    smtpPort: row.smtpPort,
    smtpSecurityMode: (row.smtpSecurityMode as SmtpSecurityMode) || "STARTTLS",
    smtpUsername: row.smtpUsername,
    smtpPasswordConfigured: Boolean(row.smtpPasswordCiphertext),
    smtpPasswordLast4: row.smtpPasswordLast4,
    isActive: row.isActive,
    isDefault: row.isDefault,
    sortOrder: row.sortOrder,
    lastTestedAt: row.lastTestedAt?.toISOString() ?? null,
    lastTestStatus: row.lastTestStatus,
    lastTestErrorCode: row.lastTestErrorCode,
    routeCount: row._count?.routingRules ?? 0,
  };
}

export async function listEmailSendingProfiles() {
  if (!hasDatabaseUrl()) return [];
  const rows = await prisma.emailSendingProfile.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { routingRules: true } } },
  });
  return rows.map(toAdminSendingProfileDto);
}

export async function listActiveEmailSendingProfiles() {
  if (!hasDatabaseUrl()) return [];
  const rows = await prisma.emailSendingProfile.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return rows.map((row) => toAdminSendingProfileDto({ ...row, _count: { routingRules: 0 } }));
}

export async function getEmailSendingProfileById(id: string) {
  if (!hasDatabaseUrl()) return null;
  const row = await prisma.emailSendingProfile.findUnique({
    where: { id },
    include: { _count: { select: { routingRules: true } } },
  });
  return row ? toAdminSendingProfileDto(row) : null;
}

export async function getEmailSendingProfileRecord(id: string) {
  if (!hasDatabaseUrl()) return null;
  return prisma.emailSendingProfile.findUnique({ where: { id } });
}

export async function getDefaultEmailSendingProfileRecord() {
  if (!hasDatabaseUrl()) return null;
  return prisma.emailSendingProfile.findFirst({
    where: { isDefault: true, isActive: true },
  });
}

export async function updateProfileTestMetadata(
  profileId: string,
  input: {
    success: boolean;
    errorCode?: string | null;
  },
) {
  const now = new Date();
  await prisma.emailSendingProfile.update({
    where: { id: profileId },
    data: {
      lastTestedAt: now,
      lastTestStatus: input.success ? "PASSED" : "FAILED",
      lastTestErrorCode: input.success ? null : input.errorCode ?? "TEST_FAILED",
    },
  });
}

export async function setDefaultEmailSendingProfile(
  profileId: string,
  updatedById: string,
) {
  await prisma.$transaction(async (tx) => {
    await tx.emailSendingProfile.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });
    await tx.emailSendingProfile.update({
      where: { id: profileId },
      data: { isDefault: true, isActive: true, updatedById },
    });
  });
}

export { decryptProfilePassword };
