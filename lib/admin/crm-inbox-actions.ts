"use server";

import { revalidatePath } from "next/cache";
import { assertSameOrigin, requireAdminUser } from "@/lib/admin/session";
import { assertCan } from "@/lib/admin/rbac";
import { writeAuditLog } from "@/lib/repositories/auditRepository";
import { prisma } from "@/lib/db";
import { recordCrmActivity } from "@/lib/crm/activities";
import { normalizeCrmEmail } from "@/lib/crm/normalize";

export async function markInboxReviewedAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");
  const id = String(formData.get("id") || "");
  if (!id) return { ok: false as const, error: "Missing email id." };

  await prisma.crmEmail.update({
    where: { id },
    data: { reviewStatus: "REVIEWED" },
  });

  revalidatePath("/admin/crm/inbox");
  return { ok: true as const };
}

export async function ignoreInboxEmailAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");
  const id = String(formData.get("id") || "");
  if (!id) return { ok: false as const, error: "Missing email id." };

  await prisma.crmEmail.update({
    where: { id },
    data: { reviewStatus: "IGNORED" },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "inbound_email_ignored",
    entityType: "CrmEmail",
    entityId: id,
  });

  revalidatePath("/admin/crm/inbox");
  return { ok: true as const };
}

export async function linkInboxToContactAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");
  const emailId = String(formData.get("emailId") || "");
  const contactId = String(formData.get("contactId") || "");
  if (!emailId || !contactId) {
    return { ok: false as const, error: "Missing email or contact." };
  }

  const email = await prisma.crmEmail.findUniqueOrThrow({ where: { id: emailId } });
  await prisma.crmEmail.update({
    where: { id: emailId },
    data: {
      contactId,
      reviewStatus: "MATCHED",
      matchConfidence: "EXACT_EMAIL",
    },
  });

  await recordCrmActivity({
    contactId,
    type: "EMAIL_RECEIVED",
    subject: `Inbound linked: ${email.subject}`,
    metadata: { emailId, linkedManually: true },
    createdById: user.id,
  });

  await writeAuditLog({
    actorId: user.id,
    action: "inbound_email_linked",
    entityType: "CrmEmail",
    entityId: emailId,
    metadata: { contactId },
  });

  revalidatePath("/admin/crm/inbox");
  revalidatePath(`/admin/crm/contacts/${contactId}`);
  return { ok: true as const };
}

export async function createContactFromInboxAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");
  const emailId = String(formData.get("emailId") || "");
  if (!emailId) return { ok: false as const, error: "Missing email id." };

  const email = await prisma.crmEmail.findUniqueOrThrow({ where: { id: emailId } });
  if (!email.fromAddress) {
    return { ok: false as const, error: "No sender address." };
  }

  const contact = await prisma.crmContact.create({
    data: {
      email: email.fromAddress,
      emailNormalized: normalizeCrmEmail(email.fromAddress),
      displayName: email.fromAddress.split("@")[0],
      lifecycleStage: "PROSPECT",
      source: "INBOUND_EMAIL",
      sourceDetail: "Created from CRM Inbox",
      createdById: user.id,
    },
  });

  await prisma.crmEmail.update({
    where: { id: emailId },
    data: {
      contactId: contact.id,
      reviewStatus: "MATCHED",
      matchConfidence: "EXACT_EMAIL",
    },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "inbound_contact_created",
    entityType: "CrmContact",
    entityId: contact.id,
    metadata: { emailId },
  });

  revalidatePath("/admin/crm/inbox");
  return { ok: true as const, contactId: contact.id };
}

function revalidateThread(threadId: string) {
  revalidatePath("/admin/crm/inbox");
  revalidatePath(`/admin/crm/inbox/threads/${threadId}`);
}

export async function sendThreadReplyAction(input: {
  threadId: string;
  body: string;
  clientRequestId?: string;
  sendingProfileId?: string | null;
}) {
  await assertSameOrigin();
  const user = await requireAdminUser("send_crm_email");
  if (!input.body.trim()) return { ok: false as const, error: "Message body required." };
  if (input.sendingProfileId) {
    assertCan(user.role, "choose_email_sender");
  }

  try {
    const { sendThreadReply } = await import("@/lib/crm/inbox/reply");
    await sendThreadReply({
      threadId: input.threadId,
      body: input.body,
      actorId: user.id,
      actorName: user.name,
      clientRequestId: input.clientRequestId,
      sendingProfileId: input.sendingProfileId,
    });
    revalidateThread(input.threadId);
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Send failed." };
  }
}

export async function saveThreadDraftAction(input: {
  threadId: string;
  body: string;
  subject?: string;
}) {
  await assertSameOrigin();
  const user = await requireAdminUser("send_crm_email");
  const { saveThreadReplyDraft } = await import("@/lib/crm/inbox/reply");
  await saveThreadReplyDraft({
    threadId: input.threadId,
    body: input.body,
    subject: input.subject,
    actorId: user.id,
  });
  revalidateThread(input.threadId);
  return { ok: true as const };
}

export async function assignThreadAction(input: {
  threadId: string;
  assignedToId: string | null;
}) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");
  const { assignThread } = await import("@/lib/crm/inbox/workflow");
  await assignThread({
    threadId: input.threadId,
    assignedToId: input.assignedToId,
    actorId: user.id,
  });
  revalidateThread(input.threadId);
  return { ok: true as const };
}

export async function snoozeThreadAction(input: {
  threadId: string;
  snoozedUntil: string;
}) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");
  const until = new Date(input.snoozedUntil);
  if (Number.isNaN(until.getTime())) {
    return { ok: false as const, error: "Invalid snooze date." };
  }
  if (until.getTime() <= Date.now()) {
    return { ok: false as const, error: "Snooze date must be in the future." };
  }
  const { snoozeThread } = await import("@/lib/crm/inbox/workflow");
  await snoozeThread({ threadId: input.threadId, snoozedUntil: until, actorId: user.id });
  revalidateThread(input.threadId);
  return { ok: true as const };
}

export async function closeThreadAction(input: { threadId: string }) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");
  const { closeThread } = await import("@/lib/crm/inbox/workflow");
  await closeThread({ threadId: input.threadId, actorId: user.id });
  revalidateThread(input.threadId);
  return { ok: true as const };
}

export async function reopenThreadAction(input: {
  threadId: string;
  status?: "NEEDS_REPLY" | "WAITING_ON_CONTACT";
}) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");
  const { reopenThread } = await import("@/lib/crm/inbox/workflow");
  await reopenThread({
    threadId: input.threadId,
    actorId: user.id,
    status: input.status,
  });
  revalidateThread(input.threadId);
  return { ok: true as const };
}

export async function markThreadReadAction(input: { threadId: string }) {
  await assertSameOrigin();
  const user = await requireAdminUser("view_crm");
  const { markThreadRead } = await import("@/lib/crm/inbox/workflow");
  await markThreadRead({ threadId: input.threadId, userId: user.id });
  revalidateThread(input.threadId);
  return { ok: true as const };
}

export async function listCrmOwnersAction() {
  await requireAdminUser("view_crm");
  return prisma.adminUser.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function renderThreadReplyTemplateAction(input: {
  threadId: string;
  templateId: string;
}) {
  await assertSameOrigin();
  const user = await requireAdminUser("send_crm_email");
  const thread = await prisma.crmEmailThread.findUniqueOrThrow({
    where: { id: input.threadId },
    include: { contact: { include: { company: true } } },
  });
  if (!thread.contact) {
    return { ok: false as const, error: "Thread has no linked contact." };
  }
  const template = await prisma.crmEmailTemplate.findUnique({
    where: { id: input.templateId },
  });
  if (!template) return { ok: false as const, error: "Template not found." };

  const { renderOutreachEmail } = await import("@/lib/crm/outreach/personalization");
  const rendered = renderOutreachEmail({
    subject: template.subject,
    body: template.body,
    contact: thread.contact,
    senderName: user.name,
  });

  return {
    ok: true as const,
    body: rendered.body,
    hasUnresolved: rendered.hasUnresolved,
  };
}

export async function createThreadFollowUpTaskAction(input: {
  threadId: string;
  title?: string;
  description?: string;
  dueAt: string;
  assignedToId?: string;
  priority?: "LOW" | "NORMAL" | "HIGH";
}) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");
  const dueAt = new Date(input.dueAt);
  if (Number.isNaN(dueAt.getTime())) {
    return { ok: false as const, error: "Invalid due date." };
  }

  try {
    const { createThreadFollowUpTask } = await import("@/lib/crm/inbox/follow-up-tasks");
    await createThreadFollowUpTask({
      threadId: input.threadId,
      title: input.title,
      description: input.description,
      dueAt,
      assignedToId: input.assignedToId,
      priority: input.priority,
      actorId: user.id,
    });
    revalidateThread(input.threadId);
    revalidatePath("/admin/crm/tasks");
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not create follow-up task.",
    };
  }
}

export async function resolveAmbiguousThreadReplyAction(input: { emailId: string }) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");

  try {
    const { resolveAmbiguousThreadReply } = await import("@/lib/crm/inbox/reply-delivery");
    const email = await resolveAmbiguousThreadReply({
      emailId: input.emailId,
      actorId: user.id,
    });
    if (email.threadId) revalidateThread(email.threadId);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Resolution failed.",
    };
  }
}

export async function getThreadFollowUpDefaultsAction(threadId: string) {
  await requireAdminUser("view_crm");
  const thread = await prisma.crmEmailThread.findUniqueOrThrow({
    where: { id: threadId },
    include: { contact: { select: { firstName: true, lastName: true, displayName: true, email: true, ownerId: true } } },
  });
  const { defaultThreadAssigneeId } = await import("@/lib/crm/inbox/workflow");
  const { contactDisplayName } = await import("@/lib/crm/normalize");
  const assigneeId = (await defaultThreadAssigneeId(prisma, thread)) ?? thread.contact?.ownerId ?? null;
  return {
    title: thread.contact ? `Follow up with ${contactDisplayName(thread.contact)}` : "Follow up",
    assigneeId,
  };
}
