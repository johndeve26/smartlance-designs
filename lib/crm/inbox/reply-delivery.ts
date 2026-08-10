import { prisma } from "@/lib/db";
import { markThreadWaitingOnContact } from "@/lib/crm/inbox/workflow";
import { writeAuditLog } from "@/lib/repositories/auditRepository";

/** Operator marks ambiguous thread reply as definitively sent (no resend). */
export async function resolveAmbiguousThreadReply(input: {
  emailId: string;
  actorId: string;
}) {
  const email = await prisma.crmEmail.findUniqueOrThrow({
    where: { id: input.emailId },
  });

  if (email.deliveryStatus !== "SENT_UNCONFIRMED") {
    throw new Error("Email is not in SENT_UNCONFIRMED state.");
  }
  if (!email.threadId) {
    throw new Error("Email is not linked to a thread.");
  }
  if (email.origin !== "THREAD_REPLY") {
    throw new Error("Only thread reply emails can be resolved here.");
  }

  const sentAt = email.sentAt ?? new Date();

  await prisma.crmEmail.update({
    where: { id: email.id },
    data: {
      deliveryStatus: "SENT",
      sentAt,
    },
  });

  await markThreadWaitingOnContact({
    threadId: email.threadId,
    outboundAt: sentAt,
    snippet: email.bodyText?.slice(0, 280),
    actorId: input.actorId,
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "crm_thread_reply_marked_sent",
    entityType: "CrmEmail",
    entityId: email.id,
    metadata: { threadId: email.threadId, manualResolution: true },
  });

  return email;
}
