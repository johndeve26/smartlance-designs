import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import { recordCrmActivity } from "@/lib/crm/activities";
import { stopActiveEnrollmentsForContact } from "@/lib/crm/outreach/suppression";
import { handleInboundThreadWorkflow } from "@/lib/crm/inbox/workflow";

type Db = Pick<
  PrismaClient,
  "crmSequenceEnrollment" | "crmTask" | "crmContact" | "crmActivity" | "crmEmailThread" | "crmEmail"
>;

export async function handleVerifiedInboundReply(input: {
  db?: Db;
  contactId: string;
  leadId?: string | null;
  dealId?: string | null;
  threadId?: string | null;
  inboundEmailId: string;
  subject: string;
  bodyText?: string;
  receivedAt?: Date;
  actorId: string;
  isAutomated: boolean;
  exactThread: boolean;
}) {
  const db = input.db ?? prisma;

  if (input.isAutomated) {
    await db.crmSequenceEnrollment.updateMany({
      where: { contactId: input.contactId, status: "ACTIVE" },
      data: {
        status: "PAUSED",
        pausedAt: new Date(),
        stopReason: "AUTOMATED_REPLY",
        stopNote: "Automated response detected — review before continuing outreach.",
        nextRunAt: null,
      },
    });
  } else if (input.exactThread) {
    await stopActiveEnrollmentsForContact(
      {
        contactId: input.contactId,
        reason: "REPLY_RECEIVED",
        note: "Verified inbound reply received",
        actorId: input.actorId,
      },
      db,
    );
  }

  if (input.threadId && input.exactThread && !input.isAutomated) {
    await handleInboundThreadWorkflow({
      db,
      threadId: input.threadId,
      contactId: input.contactId,
      leadId: input.leadId,
      dealId: input.dealId,
      inboundEmailId: input.inboundEmailId,
      bodyText: input.bodyText ?? "",
      receivedAt: input.receivedAt ?? new Date(),
      actorId: input.actorId,
      isAutomated: input.isAutomated,
      exactThread: input.exactThread,
    });
  }

  await recordCrmActivity(
    {
      contactId: input.contactId,
      leadId: input.leadId,
      dealId: input.dealId,
      type: "EMAIL_RECEIVED",
      subject: input.subject,
      metadata: {
        emailId: input.inboundEmailId,
        verified: input.exactThread,
        automated: input.isAutomated,
        threadId: input.threadId ?? null,
      },
      createdById: input.actorId,
    },
    db,
  );
}
