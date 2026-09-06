import { prisma } from "@/lib/db";
import {
  recordCrmActivity,
  touchLastContactedAt,
} from "@/lib/crm/activities";
import { BLOCKED_EMAIL_STATUSES } from "@/lib/crm/constants";
import { contactDisplayName } from "@/lib/crm/normalize";
import { resolveActiveEmailTransport } from "@/lib/email/config";
import { sendSmartlanceEmail } from "@/lib/email/send-smartlance";
import { createTask } from "@/lib/crm/tasks";

import { renderOutreachEmail } from "@/lib/crm/outreach/personalization";
import { prepareTrackedOutreachEmail } from "@/lib/crm/outreach/engagement/prepare";
import { normalizeOutboundMessageId } from "@/lib/crm/inbound/matching";

export function assertContactEmailSendable(contact: {
  email: string | null;
  emailStatus: string;
}) {
  if (!contact.email?.trim()) {
    throw new Error("Contact has no email address.");
  }
  if (
    BLOCKED_EMAIL_STATUSES.includes(
      contact.emailStatus as (typeof BLOCKED_EMAIL_STATUSES)[number],
    )
  ) {
    throw new Error(`Email blocked: contact status is ${contact.emailStatus}.`);
  }
}

export async function sendCrmEmail(input: {
  contactId: string;
  dealId?: string | null;
  subject: string;
  body: string;
  actorId: string;
  actorName: string;
  createFollowUpDays?: number;
  sendingProfileId?: string | null;
  clientRequestId?: string | null;
}) {
  if (input.clientRequestId) {
    const existing = await prisma.crmEmail.findUnique({
      where: { clientRequestId: input.clientRequestId },
    });
    if (existing) {
      return existing;
    }
  }

  const transport = await resolveActiveEmailTransport();
  if (transport.kind === "none") {
    throw new Error("Email delivery is not configured.");
  }

  const contact = await prisma.crmContact.findUniqueOrThrow({
    where: { id: input.contactId },
    include: {
      company: true,
      leads: {
        where: { status: { notIn: ["UNQUALIFIED", "CLOSED"] } },
        take: 1,
      },
    },
  });

  assertContactEmailSendable(contact);

  const rendered = renderOutreachEmail({
    subject: input.subject,
    body: input.body,
    contact,
    senderName: input.actorName,
  });

  if (rendered.hasUnresolved) {
    throw new Error("Email contains unresolved template variables.");
  }

  const renderedSubject = rendered.subject;
  const renderedBody = rendered.body;

  const emailRecord = await prisma.crmEmail.create({
    data: {
      contactId: contact.id,
      dealId: input.dealId || null,
      origin: "MANUAL",
      subject: renderedSubject,
      bodyText: renderedBody,
      deliveryStatus: "PENDING",
      createdById: input.actorId,
      clientRequestId: input.clientRequestId || null,
    },
  });

  const tracked = await prepareTrackedOutreachEmail({
    emailId: emailRecord.id,
    contactId: contact.id,
    bodyText: renderedBody,
  });

  const result = await sendSmartlanceEmail({
    category: "CRM_MANUAL",
    sendingProfileId: input.sendingProfileId,
    snapshotTarget: { crmEmailId: emailRecord.id },
    to: contact.email!,
    subject: renderedSubject,
    text: tracked.text,
    html: tracked.html ?? undefined,
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

  const sent = await prisma.crmEmail.update({
    where: { id: emailRecord.id },
    data: {
      deliveryStatus: "SENT",
      sentAt: new Date(),
      providerMessageId: result.messageId ?? null,
      internetMessageId: normalizeOutboundMessageId(result.messageId),
    },
  });

  await recordCrmActivity({
    contactId: contact.id,
    dealId: input.dealId,
    type: "EMAIL_SENT",
    subject: renderedSubject,
    metadata: {
      emailId: emailRecord.id,
      messageId: result.messageId ?? null,
    },
    createdById: input.actorId,
  });

  await touchLastContactedAt(contact.id);

  if (input.createFollowUpDays) {
    const dueAt = new Date();
    dueAt.setUTCDate(dueAt.getUTCDate() + input.createFollowUpDays);
    await createTask({
      title: `Follow up with ${contactDisplayName(contact)}`,
      contactId: contact.id,
      dealId: input.dealId,
      dueAt,
      createdById: input.actorId,
      assignedToId: input.actorId,
    });
  }

  return sent;
}

export async function listEmailTemplates(activeOnly = true) {
  return prisma.crmEmailTemplate.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: { name: "asc" },
  });
}

export async function createEmailTemplate(input: {
  name: string;
  subject: string;
  body: string;
  category?: string | null;
  isActive?: boolean;
  createdById: string;
}) {
  return prisma.crmEmailTemplate.create({
    data: {
      name: input.name.trim(),
      subject: input.subject.trim(),
      body: input.body.trim(),
      category: input.category?.trim() || null,
      isActive: input.isActive ?? true,
      createdById: input.createdById,
    },
  });
}

export async function updateEmailTemplate(input: {
  id: string;
  name: string;
  subject: string;
  body: string;
  category?: string | null;
  isActive?: boolean;
  updatedById: string;
}) {
  return prisma.crmEmailTemplate.update({
    where: { id: input.id },
    data: {
      name: input.name.trim(),
      subject: input.subject.trim(),
      body: input.body.trim(),
      category: input.category?.trim() || null,
      isActive: input.isActive ?? true,
      updatedById: input.updatedById,
    },
  });
}

export async function seedDefaultEmailTemplates(actorId: string) {
  const existing = await prisma.crmEmailTemplate.count();
  if (existing > 0) return;

  const templates = [
    {
      name: "Initial outreach",
      subject: "Quick intro — Smartlance Designs",
      body: "Hi {{firstName}},\n\nI wanted to reach out from Smartlance Designs. We help businesses with thoughtful web design and development.\n\nWould you be open to a brief conversation?\n\nBest,\n{{senderName}}",
      category: "outreach",
    },
    {
      name: "Follow-up",
      subject: "Following up",
      body: "Hi {{firstName}},\n\nJust following up on my previous note. Happy to share examples relevant to {{companyName}} if helpful.\n\nBest,\n{{senderName}}",
      category: "follow-up",
    },
    {
      name: "Website review follow-up",
      subject: "Your website review request",
      body: "Hi {{firstName}},\n\nThanks for requesting a website review. We've received your submission and will be in touch shortly.\n\nBest,\n{{senderName}}",
      category: "follow-up",
    },
    {
      name: "Proposal follow-up",
      subject: "Proposal follow-up",
      body: "Hi {{firstName}},\n\nI wanted to check whether you had a chance to review our proposal for {{companyName}}.\n\nHappy to answer any questions.\n\nBest,\n{{senderName}}",
      category: "follow-up",
    },
    {
      name: "General check-in",
      subject: "Checking in",
      body: "Hi {{firstName}},\n\nHope you're doing well. Just checking in to see if there's anything we can help with.\n\nBest,\n{{senderName}}",
      category: "general",
    },
  ];

  for (const t of templates) {
    await createEmailTemplate({ ...t, createdById: actorId });
  }
}

/** Sync marketing unsubscribe status to CRM email eligibility (marketing only). */
export async function syncSubscriberStatusToContact(email: string) {
  const normalized = email.trim().toLowerCase();
  const subscriber = await prisma.subscriber.findUnique({
    where: { emailNormalized: normalized },
  });
  if (!subscriber) return;

  const contact = await prisma.crmContact.findUnique({
    where: { emailNormalized: normalized },
  });
  if (!contact) return;

  let emailStatus = contact.emailStatus;
  if (subscriber.status === "UNSUBSCRIBED") {
    emailStatus = "UNSUBSCRIBED";
  } else if (subscriber.status === "BOUNCED") {
    emailStatus = "BOUNCED";
  } else if (subscriber.status === "COMPLAINED") {
    emailStatus = "COMPLAINED";
  }

  if (emailStatus !== contact.emailStatus) {
    await prisma.crmContact.update({
      where: { id: contact.id },
      data: { emailStatus },
    });
  }
}
