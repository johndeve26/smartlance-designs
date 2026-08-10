"use server";

import type { EmailRouteCategory } from "@prisma/client";
import { assertSameOrigin, requireAdminUser } from "@/lib/admin/session";
import { assertCan } from "@/lib/admin/rbac";
import { writeAuditLog } from "@/lib/repositories/auditRepository";
import { isFormRateLimited } from "@/lib/forms";
import { canEncryptDedicatedSecrets } from "@/lib/secrets/dedicated";
import { prisma } from "@/lib/db";
import { normalizeSmtpError } from "@/lib/email/errors";
import { verifySmtpConnection } from "@/lib/email/smtp";
import { sendSmartlanceEmail } from "@/lib/email/send-smartlance";
import { profileTestEmailContent } from "@/lib/email/templates";
import { invalidateSmtpTransportCache } from "@/lib/email/transport/cache";
import {
  emailSendingProfileSchema,
  slugifyProfileName,
} from "@/lib/email/sending-profile-schema";
import { isEmailRouteCategory } from "@/lib/email/routing/categories";
import {
  encryptProfileSmtpPassword,
  getEmailSendingProfileRecord,
  resolveCustomSmtpConfig,
  setDefaultEmailSendingProfile,
  updateProfileTestMetadata,
} from "@/lib/repositories/emailSendingProfileRepository";
import { getEmailSettingsRecord } from "@/lib/repositories/emailSettingsRepository";
import {
  deleteEmailRoutingRule,
  upsertEmailRoutingRule,
} from "@/lib/repositories/emailRoutingRepository";
import { revalidatePath } from "next/cache";

type ActionResult =
  | { ok: true; message?: string; id?: string }
  | { ok: false; error: string };

function parseBool(raw: FormDataEntryValue | null) {
  return String(raw) === "on" || String(raw) === "true";
}

function checkProfileTestRateLimit(userId: string): ActionResult | null {
  if (isFormRateLimited(`profile-test:${userId}`, 5, 15 * 60 * 1000)) {
    return { ok: false, error: "Too many profile test requests. Try again later." };
  }
  return null;
}

export async function saveEmailSendingProfileAction(
  formData: FormData,
): Promise<ActionResult> {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_settings");
  assertCan(user.role, "manage_email_profiles");

  const parsed = emailSendingProfileSchema.safeParse({
    id: String(formData.get("id") || "") || undefined,
    name: formData.get("name"),
    slug: String(formData.get("slug") || "") || slugifyProfileName(String(formData.get("name") || "")),
    description: formData.get("description"),
    fromName: formData.get("fromName"),
    fromEmail: formData.get("fromEmail"),
    replyToName: formData.get("replyToName"),
    replyToEmail: formData.get("replyToEmail"),
    transportType: formData.get("transportType"),
    smtpHost: formData.get("smtpHost"),
    smtpPort: formData.get("smtpPort") || undefined,
    smtpSecurityMode: formData.get("smtpSecurityMode") || "STARTTLS",
    smtpUsername: formData.get("smtpUsername"),
    isActive: parseBool(formData.get("isActive")),
    isDefault: parseBool(formData.get("isDefault")),
    sortOrder: formData.get("sortOrder") || 0,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid profile." };
  }

  const data = parsed.data;
  const newPassword = String(formData.get("newPassword") || "").trim();
  const clearPassword = String(formData.get("clearPassword")) === "1";
  const canEditCustomSmtp = user.role === "SUPER_ADMIN";

  if (data.transportType === "CUSTOM_SMTP" && !canEditCustomSmtp) {
    return { ok: false, error: "Only Super Admin can configure custom SMTP credentials." };
  }

  if (data.transportType === "CUSTOM_SMTP" && (!data.smtpHost || !data.smtpPort)) {
    return { ok: false, error: "Custom SMTP requires host and port." };
  }

  let passwordFields: {
    smtpPasswordCiphertext?: string | null;
    smtpPasswordIv?: string | null;
    smtpPasswordTag?: string | null;
    smtpPasswordLast4?: string | null;
  } = {};

  const existing = data.id
    ? await prisma.emailSendingProfile.findUnique({ where: { id: data.id } })
    : null;

  if (existing) {
    passwordFields = {
      smtpPasswordCiphertext: existing.smtpPasswordCiphertext,
      smtpPasswordIv: existing.smtpPasswordIv,
      smtpPasswordTag: existing.smtpPasswordTag,
      smtpPasswordLast4: existing.smtpPasswordLast4,
    };
  }

  if (clearPassword) {
    passwordFields = {
      smtpPasswordCiphertext: null,
      smtpPasswordIv: null,
      smtpPasswordTag: null,
      smtpPasswordLast4: null,
    };
  } else if (newPassword) {
    if (!canEncryptDedicatedSecrets()) {
      return {
        ok: false,
        error: "Cannot store SMTP password: encryption key not configured.",
      };
    }
    passwordFields = encryptProfileSmtpPassword(newPassword);
  }

  if (
    data.transportType === "CUSTOM_SMTP" &&
    data.smtpUsername &&
    !passwordFields.smtpPasswordCiphertext &&
    !newPassword
  ) {
    return { ok: false, error: "SMTP password is required when a username is configured." };
  }

  const profileId = data.id;
  let savedId: string;

  if (profileId) {
    await prisma.emailSendingProfile.update({
      where: { id: profileId },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        fromName: data.fromName,
        fromEmail: data.fromEmail.toLowerCase(),
        replyToName: data.replyToName || null,
        replyToEmail: data.replyToEmail?.toLowerCase() || null,
        transportType: data.transportType,
        smtpHost: data.transportType === "CUSTOM_SMTP" ? data.smtpHost || null : null,
        smtpPort: data.transportType === "CUSTOM_SMTP" ? data.smtpPort ?? null : null,
        smtpSecurityMode:
          data.transportType === "CUSTOM_SMTP" ? data.smtpSecurityMode ?? "STARTTLS" : null,
        smtpUsername: data.transportType === "CUSTOM_SMTP" ? data.smtpUsername || null : null,
        ...passwordFields,
        isActive: data.isActive,
        isDefault: data.isDefault,
        sortOrder: data.sortOrder ?? 0,
        updatedById: user.id,
      },
    });
    savedId = profileId;
    invalidateSmtpTransportCache(profileId);
  } else {
    const created = await prisma.emailSendingProfile.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        fromName: data.fromName,
        fromEmail: data.fromEmail.toLowerCase(),
        replyToName: data.replyToName || null,
        replyToEmail: data.replyToEmail?.toLowerCase() || null,
        transportType: data.transportType,
        smtpHost: data.transportType === "CUSTOM_SMTP" ? data.smtpHost || null : null,
        smtpPort: data.transportType === "CUSTOM_SMTP" ? data.smtpPort ?? null : null,
        smtpSecurityMode:
          data.transportType === "CUSTOM_SMTP" ? data.smtpSecurityMode ?? "STARTTLS" : null,
        smtpUsername: data.transportType === "CUSTOM_SMTP" ? data.smtpUsername || null : null,
        ...passwordFields,
        isActive: data.isActive,
        isDefault: false,
        sortOrder: data.sortOrder ?? 0,
        createdById: user.id,
        updatedById: user.id,
      },
    });
    savedId = created.id;
  }

  if (data.isDefault) {
    await setDefaultEmailSendingProfile(savedId, user.id);
  } else if (existing?.isDefault && !data.isDefault) {
    return {
      ok: false,
      error: "Choose another default profile before removing default from this profile.",
    };
  }

  await writeAuditLog({
    actorId: user.id,
    action: profileId ? "email_profile.updated" : "email_profile.created",
    entityType: "EmailSendingProfile",
    entityId: savedId,
    metadata: { name: data.name, transportType: data.transportType, isActive: data.isActive },
  });

  revalidatePath("/admin/email");
  return { ok: true, message: "Sending profile saved.", id: savedId };
}

export async function deactivateEmailSendingProfileAction(
  profileId: string,
): Promise<ActionResult> {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_settings");
  assertCan(user.role, "manage_email_profiles");

  const profile = await getEmailSendingProfileRecord(profileId);
  if (!profile) return { ok: false, error: "Profile not found." };
  if (profile.isDefault) {
    return { ok: false, error: "Set another default profile before deactivating this one." };
  }

  await prisma.emailSendingProfile.update({
    where: { id: profileId },
    data: { isActive: false, updatedById: user.id },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "email_profile.deactivated",
    entityType: "EmailSendingProfile",
    entityId: profileId,
  });

  revalidatePath("/admin/email");
  return { ok: true, message: "Profile deactivated." };
}

export async function testProfileConnectionAction(
  profileId: string,
): Promise<ActionResult> {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_settings");
  assertCan(user.role, "manage_email_profiles");
  const limited = checkProfileTestRateLimit(user.id);
  if (limited) return limited;

  const profile = await getEmailSendingProfileRecord(profileId);
  if (!profile) return { ok: false, error: "Profile not found." };
  if (profile.transportType !== "CUSTOM_SMTP") {
    return { ok: false, error: "Connection test applies to custom SMTP profiles only." };
  }

  const resolved = resolveCustomSmtpConfig(profile);
  if (!resolved.ok) return { ok: false, error: resolved.error };

  try {
    await verifySmtpConnection(resolved.config);
    await updateProfileTestMetadata(profileId, { success: true });
    return { ok: true, message: "SMTP connection verified." };
  } catch (error) {
    const normalized = normalizeSmtpError(error);
    await updateProfileTestMetadata(profileId, {
      success: false,
      errorCode: normalized.code,
    });
    return { ok: false, error: normalized.message };
  }
}

export async function sendProfileTestEmailAction(
  formData: FormData,
): Promise<ActionResult> {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_settings");
  assertCan(user.role, "manage_email_profiles");
  const limited = checkProfileTestRateLimit(user.id);
  if (limited) return limited;

  const profileId = String(formData.get("profileId") || "").trim();
  const recipient = String(formData.get("recipient") || user.email || "").trim();
  if (!profileId) return { ok: false, error: "Profile is required." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    return { ok: false, error: "A valid test recipient is required." };
  }

  const profile = await getEmailSendingProfileRecord(profileId);
  if (!profile?.isActive) return { ok: false, error: "Profile must be active." };

  const sentAt = new Date().toISOString();
  const content = profileTestEmailContent({
    profileName: profile.name,
    fromEmail: profile.fromEmail,
    transportLabel:
      profile.transportType === "CUSTOM_SMTP" ? "Custom SMTP" : "System SMTP",
    sentAt,
  });

  const result = await sendSmartlanceEmail({
    category: "GENERAL_SYSTEM",
    sendingProfileId: profileId,
    to: recipient,
    subject: content.subject,
    text: content.text,
    html: content.html,
  });

  if (!result.success) {
    await updateProfileTestMetadata(profileId, {
      success: false,
      errorCode: result.errorCode ?? "DELIVERY_FAILED",
    });
    return { ok: false, error: result.errorMessage ?? "Test email failed." };
  }

  await updateProfileTestMetadata(profileId, { success: true });
  await writeAuditLog({
    actorId: user.id,
    action: "email_profile.test_sent",
    entityType: "EmailSendingProfile",
    entityId: profileId,
    metadata: { recipientDomain: recipient.split("@")[1] ?? "unknown" },
  });

  return { ok: true, message: `Test email sent to ${recipient}.` };
}

export async function saveEmailRoutingAction(
  formData: FormData,
): Promise<ActionResult> {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_settings");
  assertCan(user.role, "manage_email_routing");

  const category = String(formData.get("category") || "").trim();
  const profileId = String(formData.get("sendingProfileId") || "").trim();
  const useDefault = String(formData.get("useDefault")) === "1";

  if (!isEmailRouteCategory(category)) {
    return { ok: false, error: "Invalid routing category." };
  }

  if (useDefault || !profileId) {
    await deleteEmailRoutingRule(category as EmailRouteCategory);
  } else {
    const profile = await getEmailSendingProfileRecord(profileId);
    if (!profile?.isActive) {
      return { ok: false, error: "Selected profile is not active." };
    }
    await upsertEmailRoutingRule({
      category: category as EmailRouteCategory,
      sendingProfileId: profileId,
      updatedById: user.id,
    });
  }

  await writeAuditLog({
    actorId: user.id,
    action: "email_routing.updated",
    entityType: "EmailRoutingRule",
    entityId: category,
    metadata: { sendingProfileId: useDefault ? null : profileId },
  });

  revalidatePath("/admin/email");
  return { ok: true, message: "Routing saved." };
}

export async function bootstrapDefaultProfileFromSystemAction(): Promise<ActionResult> {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_settings");
  assertCan(user.role, "manage_email_profiles");

  const existingDefault = await prisma.emailSendingProfile.findFirst({
    where: { isDefault: true },
  });
  if (existingDefault) {
    return { ok: false, error: "A default sending profile already exists." };
  }

  const settings = await getEmailSettingsRecord();
  const fromEmail = settings?.fromEmail?.trim();
  if (!fromEmail) {
    return {
      ok: false,
      error: "Configure system SMTP From address before bootstrapping a profile.",
    };
  }

  const created = await prisma.emailSendingProfile.create({
    data: {
      name: "General",
      slug: "general",
      fromName: settings?.fromName?.trim() || "Smartlance Designs",
      fromEmail: fromEmail.toLowerCase(),
      replyToEmail: settings?.replyToEmail?.toLowerCase() || null,
      transportType: "SYSTEM_SMTP",
      isActive: true,
      isDefault: true,
      sortOrder: 0,
      createdById: user.id,
      updatedById: user.id,
    },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "email_profile.bootstrapped",
    entityType: "EmailSendingProfile",
    entityId: created.id,
  });

  revalidatePath("/admin/email");
  return { ok: true, message: "Default profile created from system sender.", id: created.id };
}
