"use server";

import { revalidatePath } from "next/cache";
import { assertSameOrigin, requireAdminUser } from "@/lib/admin/session";
import { writeAuditLog } from "@/lib/repositories/auditRepository";
import { isFormRateLimited } from "@/lib/forms";
import { canEncryptDedicatedSecrets } from "@/lib/secrets/dedicated";
import { z } from "zod";
import {
  ensureInboundEmailSettingsRow,
  encryptInboundPassword,
  getInboundEmailSettingsRecord,
  decryptInboundPassword,
  buildImapConfigFromRow,
  getAdminInboundEmailSettings,
} from "@/lib/repositories/inboundEmailSettingsRepository";
import { createImapProvider } from "@/lib/email/inbound/imap-provider";
import { runInboundEmailSync } from "@/lib/email/inbound/sync";
import {
  INBOUND_TEST_RATE_LIMIT,
  INBOUND_TEST_RATE_WINDOW_MS,
} from "@/lib/email/inbound/types";

const inboundSettingsSchema = z.object({
  enabled: z.boolean(),
  host: z.string().trim().min(1).nullable(),
  port: z.number().int().min(1).max(65535).nullable(),
  securityMode: z.enum(["AUTO", "TLS", "STARTTLS", "NONE"]),
  username: z.string().trim().min(1).nullable(),
  mailboxFolder: z.string().trim().min(1).max(120),
  crmReplyToEmail: z.string().email().nullable().or(z.literal("")),
});

function assertInboundTestRateLimit(userId: string) {
  if (
    isFormRateLimited(
      `inbound-test:${userId}`,
      INBOUND_TEST_RATE_LIMIT,
      INBOUND_TEST_RATE_WINDOW_MS,
    )
  ) {
    throw new Error("Too many connection tests. Try again later.");
  }
}

export async function saveInboundEmailSettingsAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_settings");

  const enabled = String(formData.get("enabled")) === "on";
  const host = String(formData.get("host") || "").trim() || null;
  const portRaw = String(formData.get("port") || "").trim();
  const port = portRaw ? Number(portRaw) : null;
  const securityMode = String(formData.get("securityMode") || "TLS").trim();
  const username = String(formData.get("username") || "").trim() || null;
  const mailboxFolder = String(formData.get("mailboxFolder") || "INBOX").trim();
  const crmReplyToEmail =
    String(formData.get("crmReplyToEmail") || "").trim() || null;
  const newPassword = String(formData.get("newPassword") || "").trim();

  const parsed = inboundSettingsSchema.safeParse({
    enabled,
    host,
    port: port != null && Number.isFinite(port) ? port : null,
    securityMode,
    username,
    mailboxFolder,
    crmReplyToEmail,
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid inbound settings.",
    };
  }

  if (newPassword && !canEncryptDedicatedSecrets()) {
    return {
      ok: false as const,
      error: "Cannot store password: encryption key not configured.",
    };
  }

  await ensureInboundEmailSettingsRow();
  const existing = await getInboundEmailSettingsRecord();

  let passwordCiphertext = existing?.passwordCiphertext ?? null;
  let passwordIv = existing?.passwordIv ?? null;
  let passwordTag = existing?.passwordTag ?? null;
  let passwordLast4 = existing?.passwordLast4 ?? null;

  if (newPassword) {
    const enc = encryptInboundPassword(newPassword);
    passwordCiphertext = enc.passwordCiphertext;
    passwordIv = enc.passwordIv;
    passwordTag = enc.passwordTag;
    passwordLast4 = enc.passwordLast4;
  }

  const wasEnabled = existing?.enabled ?? false;
  const nowEnabled = parsed.data.enabled;

  await prismaUpdateInboundSettings({
    enabled: nowEnabled,
    host: parsed.data.host,
    port: parsed.data.port,
    securityMode: parsed.data.securityMode,
    username: parsed.data.username,
    mailboxFolder: parsed.data.mailboxFolder,
    crmReplyToEmail: parsed.data.crmReplyToEmail || null,
    passwordCiphertext,
    passwordIv,
    passwordTag,
    passwordLast4,
    updatedById: user.id,
    syncActorId: user.id,
    ...(nowEnabled && !wasEnabled
      ? { syncEnabledAt: new Date() }
      : {}),
  });

  await writeAuditLog({
    actorId: user.id,
    action: nowEnabled ? "inbound_email_enabled" : "inbound_email_settings_saved",
    entityType: "InboundEmailSettings",
    entityId: "inbound",
  });

  revalidatePath("/admin/email");
  revalidatePath("/admin/settings");
  return { ok: true as const };
}

async function prismaUpdateInboundSettings(data: Record<string, unknown>) {
  const { prisma } = await import("@/lib/db");
  await prisma.inboundEmailSettings.update({
    where: { id: "inbound" },
    data,
  });
}

export async function testInboundConnectionAction() {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_settings");
  assertInboundTestRateLimit(user.id);

  const row = await getInboundEmailSettingsRecord();
  const config = row ? buildImapConfigFromRow(row) : null;
  if (!config) {
    return { ok: false as const, error: "Inbound mailbox not configured." };
  }

  const provider = createImapProvider(config);
  const result = await provider.testConnection();
  await provider.disconnect();

  const { prisma } = await import("@/lib/db");
  await prisma.inboundEmailSettings.update({
    where: { id: "inbound" },
    data: {
      lastSyncedAt: new Date(),
      lastSyncErrorSafe: result.ok ? null : result.error,
    },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "inbound_connection_tested",
    entityType: "InboundEmailSettings",
    entityId: "inbound",
    metadata: { success: result.ok },
  });

  if (!result.ok) return { ok: false as const, error: result.error };
  return { ok: true as const, message: "Inbound connection verified." };
}

export async function runInboundSyncNowAction() {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");
  const result = await runInboundEmailSync();
  await writeAuditLog({
    actorId: user.id,
    action: "inbound_sync_manual",
    entityType: "InboundEmailSettings",
    entityId: "inbound",
    metadata: {
      imported: result.imported,
      failed: result.failed,
    },
  });
  revalidatePath("/admin/crm/inbox");
  revalidatePath("/admin/crm");
  return { ok: true as const, result };
}

export async function getInboundSettingsForAdminAction() {
  await requireAdminUser("manage_settings");
  return getAdminInboundEmailSettings();
}
