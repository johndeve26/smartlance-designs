import { prisma } from "@/lib/db";
import { recordCrmActivity, touchLastContactedAt } from "@/lib/crm/activities";
import { assertContactEmailSendable } from "@/lib/crm/email";
import { normalizeOutboundMessageId } from "@/lib/crm/inbound/matching";
import { markThreadWaitingOnContact, markThreadDeliveryUncertain } from "@/lib/crm/inbox/workflow";
import { normalizeReplySubject, snippetFromBody } from "@/lib/crm/inbox/subject";
import { renderOutreachEmail } from "@/lib/crm/outreach/personalization";
import { prepareTrackedOutreachEmail } from "@/lib/crm/outreach/engagement/prepare";
import { resolveActiveEmailTransport } from "@/lib/email/config";
import { escapeHeaderFragment } from "@/lib/email/send";
import { sendSmartlanceEmail } from "@/lib/email/send-smartlance";
import { resolveEmailSendingProfile } from "@/lib/email/routing/resolve-profile";
import {
  extractMessageIdsFromReferences,
  normalizeMessageId,
} from "@/lib/email/inbound/threading";

function buildReferencesHeader(existing: string | null | undefined, inReplyTo: string | null): string {
  const ids: string[] = [];
  if (inReplyTo) ids.push(`<${inReplyTo}>`);
  for (const ref of extractMessageIdsFromReferences(existing)) {
    const wrapped = `<${ref}>`;
    if (!ids.includes(wrapped)) ids.push(wrapped);
  }
  return ids.slice(-20).join(" ");
}

function generateCrmMessageId(fromEmail: string): string {
  const domain = fromEmail.split("@")[1]?.trim() || "smartlance.local";
  const token = crypto.randomUUID().replace(/-/g, "");
  return `<crm-${token}@${domain}>`;
}

export async function sendThreadReply(input: {
  threadId: string;
  body: string;
  subject?: string;
  actorId: string;
  actorName: string;
  clientRequestId?: string;
  sendingProfileId?: string | null;
}) {
  if (input.clientRequestId) {
    const existing = await prisma.crmEmail.findUnique({
      where: { clientRequestId: input.clientRequestId },
    });
    if (existing) return existing;
  }

  const transport = await resolveActiveEmailTransport();
  if (transport.kind === "none") {
    throw new Error("Email delivery is not configured.");
  }

  const thread = await prisma.crmEmailThread.findUniqueOrThrow({
    where: { id: input.threadId },
    include: {
      contact: { include: { company: true } },
      emails: {
        orderBy: [{ receivedAt: "desc" }, { sentAt: "desc" }],
        take: 30,
      },
    },
  });

  if (!thread.contactId || !thread.contact) {
    throw new Error("Thread must be linked to a contact before replying.");
  }

  assertContactEmailSendable(thread.contact);

  const latestInbound = thread.emails.find((e) => e.direction === "INBOUND" && e.internetMessageId);
  const inReplyToRaw = latestInbound?.internetMessageId ?? null;
  const inReplyTo = normalizeMessageId(inReplyToRaw);
  const references = buildReferencesHeader(latestInbound?.referencesHeader, inReplyTo);

  const baseSubject = input.subject?.trim() || thread.subjectNormalized || latestInbound?.subject || "Conversation";
  const replySubject = normalizeReplySubject(baseSubject);

  const rendered = renderOutreachEmail({
    subject: replySubject,
    body: input.body,
    contact: thread.contact,
    senderName: input.actorName,
  });

  if (rendered.hasUnresolved) {
    throw new Error("Email contains unresolved template variables.");
  }

  const profile = await resolveEmailSendingProfile({
    category: "CRM_INBOUND_REPLY",
    sendingProfileId: input.sendingProfileId,
  });

  const fromDomain = profile.fromEmail.split("@")[1]?.trim() || "smartlance.local";
  const internetMessageId = normalizeMessageId(generateCrmMessageId(fromDomain));

  const emailRecord = await prisma.crmEmail.create({
    data: {
      contactId: thread.contactId,
      leadId: thread.leadId,
      dealId: thread.dealId,
      threadId: thread.id,
      replyToOutboundId: latestInbound?.replyToOutboundId ?? undefined,
      origin: "THREAD_REPLY",
      direction: "OUTBOUND",
      subject: rendered.subject,
      bodyText: rendered.body,
      deliveryStatus: "PENDING",
      inReplyToMessageId: inReplyToRaw,
      referencesHeader: references || null,
      internetMessageId,
      createdById: input.actorId,
      clientRequestId: input.clientRequestId || null,
    },
  });

  const tracked = await prepareTrackedOutreachEmail({
    emailId: emailRecord.id,
    contactId: thread.contactId,
    bodyText: rendered.body,
  });

  const result = await sendSmartlanceEmail({
    category: "CRM_INBOUND_REPLY",
    sendingProfileId: input.sendingProfileId,
    snapshotTarget: { crmEmailId: emailRecord.id },
    to: thread.contact.email!,
    subject: rendered.subject,
    text: tracked.text,
    html: tracked.html ?? undefined,
    inReplyTo: inReplyTo ? `<${inReplyTo}>` : undefined,
    references: references || undefined,
    messageId: internetMessageId ? `<${internetMessageId}>` : undefined,
  });

  if (!result.success) {
    await prisma.crmEmail.update({
      where: { id: emailRecord.id },
      data: {
        deliveryStatus: "FAILED",
        failedAt: new Date(),
        safeFailureCode: result.errorCode ?? "DELIVERY_FAILED",
      },
    });
    throw new Error(result.errorMessage ?? "Email delivery failed.");
  }

  const sentAt = new Date();

  if (result.ambiguous) {
    const updated = await prisma.crmEmail.update({
      where: { id: emailRecord.id },
      data: {
        deliveryStatus: "SENT_UNCONFIRMED",
        sentAt,
        providerMessageId: result.messageId ?? emailRecord.internetMessageId,
        internetMessageId:
          normalizeOutboundMessageId(result.messageId) ?? emailRecord.internetMessageId,
        safeFailureCode: result.ambiguousCode ?? "NETWORK_TIMEOUT_AMBIGUOUS",
      },
    });

    await markThreadDeliveryUncertain({
      threadId: thread.id,
      outboundAt: sentAt,
      emailId: updated.id,
      snippet: snippetFromBody(rendered.body),
      actorId: input.actorId,
    });

    return updated;
  }

  const deliveryStatus = "SENT";

  const updated = await prisma.crmEmail.update({
    where: { id: emailRecord.id },
    data: {
      deliveryStatus,
      sentAt,
      providerMessageId: result.messageId ?? emailRecord.internetMessageId,
      internetMessageId: normalizeOutboundMessageId(result.messageId) ?? emailRecord.internetMessageId,
    },
  });

  await markThreadWaitingOnContact({
    threadId: thread.id,
    outboundAt: sentAt,
    snippet: snippetFromBody(rendered.body),
    actorId: input.actorId,
  });

  await recordCrmActivity({
    contactId: thread.contactId,
    leadId: thread.leadId,
    dealId: thread.dealId,
    type: "EMAIL_SENT",
    subject: rendered.subject,
    metadata: { emailId: updated.id, threadId: thread.id, origin: "THREAD_REPLY" },
    createdById: input.actorId,
  });

  await touchLastContactedAt(thread.contactId);

  return updated;
}

export async function saveThreadReplyDraft(input: {
  threadId: string;
  body: string;
  subject?: string;
  actorId: string;
}) {
  const thread = await prisma.crmEmailThread.findUniqueOrThrow({
    where: { id: input.threadId },
    include: { contact: true },
  });
  if (!thread.contactId) throw new Error("Thread must be linked to a contact.");

  const existing = await prisma.crmEmail.findFirst({
    where: {
      threadId: thread.id,
      createdById: input.actorId,
      deliveryStatus: "DRAFT",
      direction: "OUTBOUND",
    },
  });

  const subject = escapeHeaderFragment(
    input.subject?.trim() || thread.subjectNormalized || "Re: Conversation",
  );

  if (existing) {
    return prisma.crmEmail.update({
      where: { id: existing.id },
      data: { bodyText: input.body, subject },
    });
  }

  return prisma.crmEmail.create({
    data: {
      threadId: thread.id,
      contactId: thread.contactId,
      leadId: thread.leadId,
      dealId: thread.dealId,
      origin: "THREAD_REPLY",
      direction: "OUTBOUND",
      subject,
      bodyText: input.body,
      deliveryStatus: "DRAFT",
      createdById: input.actorId,
    },
  });
}

export async function getThreadReplyDraft(threadId: string, actorId: string) {
  return prisma.crmEmail.findFirst({
    where: {
      threadId,
      createdById: actorId,
      deliveryStatus: "DRAFT",
      direction: "OUTBOUND",
    },
  });
}
