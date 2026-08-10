import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createTask } from "@/lib/crm/tasks";
import { contactDisplayName } from "@/lib/crm/normalize";

type Db = Pick<PrismaClient, "crmTask" | "crmContact" | "crmActivity" | "crmEmailThread">;

export async function upsertReplyRequiredTask(input: {
  db?: Db;
  threadId: string;
  contactId: string;
  leadId?: string | null;
  dealId?: string | null;
  actorId: string;
  assigneeId: string;
  inboundEmailId?: string;
}) {
  const db = input.db ?? prisma;

  const existing = await db.crmTask.findFirst({
    where: {
      emailThreadId: input.threadId,
      taskType: "REPLY_REQUIRED",
      status: "OPEN",
    },
  });

  if (existing) {
    return db.crmTask.update({
      where: { id: existing.id },
      data: {
        dueAt: new Date(),
        priority: "HIGH",
        description: input.inboundEmailId
          ? `Latest inbound email: ${input.inboundEmailId}`
          : existing.description,
      },
    });
  }

  const contact = await db.crmContact.findUnique({
    where: { id: input.contactId },
    select: { firstName: true, lastName: true, displayName: true, email: true },
  });

  return createTask(
    {
      title: `Reply to ${contact ? contactDisplayName(contact) : "conversation"}`,
      description: input.inboundEmailId
        ? `Reply required for thread ${input.threadId}. Latest inbound: ${input.inboundEmailId}.`
        : `Reply required for thread ${input.threadId}.`,
      contactId: input.contactId,
      leadId: input.leadId ?? undefined,
      dealId: input.dealId ?? undefined,
      emailThreadId: input.threadId,
      taskType: "REPLY_REQUIRED",
      createdById: input.actorId,
      assignedToId: input.assigneeId,
      dueAt: new Date(),
      priority: "HIGH",
    },
    db,
  );
}

export async function completeReplyRequiredTask(input: {
  db?: Db;
  threadId: string;
  actorId: string;
}) {
  const db = input.db ?? prisma;
  const open = await db.crmTask.findFirst({
    where: {
      emailThreadId: input.threadId,
      taskType: "REPLY_REQUIRED",
      status: "OPEN",
    },
  });
  if (!open) return null;

  return db.crmTask.update({
    where: { id: open.id },
    data: { status: "COMPLETED", completedAt: new Date() },
  });
}

export async function noteReplyTaskDeliveryUncertain(input: {
  db?: Db;
  threadId: string;
  emailId: string;
}) {
  const db = input.db ?? prisma;
  const open = await db.crmTask.findFirst({
    where: {
      emailThreadId: input.threadId,
      taskType: "REPLY_REQUIRED",
      status: "OPEN",
    },
  });
  if (!open) return null;

  return db.crmTask.update({
    where: { id: open.id },
    data: {
      priority: "HIGH",
      description: `Delivery unconfirmed for outbound ${input.emailId}. Review before treating as sent.`,
    },
  });
}
