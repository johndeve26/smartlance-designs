import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import { recordCrmActivity } from "@/lib/crm/activities";
import { snippetFromBody } from "@/lib/crm/inbox/subject";
import {
  compareMeaningfulMessages,
  isConfirmedHumanOutbound,
  isHumanInbound,
  isUncertainHumanOutbound,
  meaningfulMessageAt,
} from "@/lib/crm/inbox/message-order";
import {
  upsertReplyRequiredTask,
  completeReplyRequiredTask,
  noteReplyTaskDeliveryUncertain,
} from "@/lib/crm/inbox/reply-tasks";

type Db = Pick<
  PrismaClient,
  "crmEmailThread" | "crmContact" | "crmTask" | "crmActivity" | "crmEmail"
>;

const ACTIONABLE_CUTOFF_DAYS = 90;

function isRecent(d: Date) {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - ACTIONABLE_CUTOFF_DAYS);
  return d >= cutoff;
}

export async function defaultThreadAssigneeId(
  db: Db,
  thread: { contactId: string | null; assignedToId: string | null },
): Promise<string | null> {
  if (thread.assignedToId) return thread.assignedToId;
  if (!thread.contactId) return null;
  const contact = await db.crmContact.findUnique({
    where: { id: thread.contactId },
    select: { ownerId: true },
  });
  return contact?.ownerId ?? null;
}

export async function markThreadNeedsReply(input: {
  db?: Db;
  threadId: string;
  inboundAt: Date;
  snippet?: string;
  actorId: string;
  contactId?: string | null;
  leadId?: string | null;
  dealId?: string | null;
  inboundEmailId?: string;
}) {
  const db = input.db ?? prisma;
  const now = input.inboundAt;

  const thread = await db.crmEmailThread.update({
    where: { id: input.threadId },
    data: {
      workflowStatus: "NEEDS_REPLY",
      snoozedUntil: null,
      closedAt: null,
      lastInboundAt: now,
      lastActivityAt: now,
      lastMessageAt: now,
      needsReplySince: now,
      ...(input.snippet ? { snippet: input.snippet.slice(0, 280) } : {}),
    },
  });

  const assignee = await defaultThreadAssigneeId(db, thread);
  if (assignee && !thread.assignedToId) {
    await db.crmEmailThread.update({
      where: { id: thread.id },
      data: { assignedToId: assignee },
    });
  }

  if (thread.contactId) {
    await upsertReplyRequiredTask({
      db,
      threadId: thread.id,
      contactId: thread.contactId,
      leadId: input.leadId ?? thread.leadId,
      dealId: input.dealId ?? thread.dealId,
      actorId: input.actorId,
      assigneeId: assignee ?? input.actorId,
      inboundEmailId: input.inboundEmailId,
    });
  }

  return thread;
}

export async function markThreadWaitingOnContact(input: {
  db?: Db;
  threadId: string;
  outboundAt: Date;
  snippet?: string;
  actorId: string;
}) {
  const db = input.db ?? prisma;
  const thread = await db.crmEmailThread.update({
    where: { id: input.threadId },
    data: {
      workflowStatus: "WAITING_ON_CONTACT",
      snoozedUntil: null,
      closedAt: null,
      lastOutboundAt: input.outboundAt,
      lastActivityAt: input.outboundAt,
      lastMessageAt: input.outboundAt,
      needsReplySince: null,
      ...(input.snippet ? { snippet: input.snippet.slice(0, 280) } : {}),
    },
  });

  await completeReplyRequiredTask({ db, threadId: input.threadId, actorId: input.actorId });
  return thread;
}

/** Ambiguous thread reply delivery — do not treat as confirmed sent. */
export async function markThreadDeliveryUncertain(input: {
  db?: Db;
  threadId: string;
  outboundAt: Date;
  emailId: string;
  snippet?: string;
  actorId: string;
}) {
  const db = input.db ?? prisma;
  const thread = await db.crmEmailThread.update({
    where: { id: input.threadId },
    data: {
      workflowStatus: "NEEDS_REVIEW",
      snoozedUntil: null,
      closedAt: null,
      lastOutboundAt: input.outboundAt,
      lastActivityAt: input.outboundAt,
      lastMessageAt: input.outboundAt,
      ...(input.snippet ? { snippet: input.snippet.slice(0, 280) } : {}),
    },
  });

  await noteReplyTaskDeliveryUncertain({
    db,
    threadId: input.threadId,
    emailId: input.emailId,
  });

  return thread;
}

/**
 * Derive workflow from latest meaningful human messages (race recovery).
 * Uses receivedAt/sentAt — not thread.updatedAt.
 * Tie-break: createdAt desc, then id desc.
 */
export async function recomputeThreadWorkflowFromMessages(input: {
  db?: Db;
  threadId: string;
  actorId: string;
}) {
  const db = input.db ?? prisma;
  const thread = await db.crmEmailThread.findUniqueOrThrow({
    where: { id: input.threadId },
  });

  const now = new Date();
  if (thread.workflowStatus === "SNOOZED" && thread.snoozedUntil && thread.snoozedUntil > now) {
    return thread;
  }

  const emails = await db.crmEmail.findMany({
    where: {
      threadId: input.threadId,
      deliveryStatus: { not: "DRAFT" },
    },
    orderBy: [{ createdAt: "desc" }],
    take: 50,
  });

  const meaningful = emails.filter(
    (e) => isHumanInbound(e) || isConfirmedHumanOutbound(e) || isUncertainHumanOutbound(e),
  );
  if (!meaningful.length) return thread;

  meaningful.sort(compareMeaningfulMessages);
  const latest = meaningful[0]!;

  if (isUncertainHumanOutbound(latest)) {
    return markThreadDeliveryUncertain({
      db,
      threadId: input.threadId,
      outboundAt: meaningfulMessageAt(latest),
      emailId: latest.id,
      snippet: latest.bodyText ? snippetFromBody(latest.bodyText) : undefined,
      actorId: input.actorId,
    });
  }

  if (isHumanInbound(latest)) {
    return markThreadNeedsReply({
      db,
      threadId: input.threadId,
      inboundAt: meaningfulMessageAt(latest),
      snippet: latest.bodyText ? snippetFromBody(latest.bodyText) : undefined,
      actorId: input.actorId,
      inboundEmailId: latest.id,
    });
  }

  if (isConfirmedHumanOutbound(latest)) {
    return markThreadWaitingOnContact({
      db,
      threadId: input.threadId,
      outboundAt: meaningfulMessageAt(latest),
      snippet: latest.bodyText ? snippetFromBody(latest.bodyText) : undefined,
      actorId: input.actorId,
    });
  }

  return thread;
}

export async function snoozeThread(input: {
  threadId: string;
  snoozedUntil: Date;
  actorId: string;
}) {
  const thread = await prisma.crmEmailThread.update({
    where: { id: input.threadId },
    data: {
      workflowStatus: "SNOOZED",
      snoozedUntil: input.snoozedUntil,
      closedAt: null,
    },
  });

  if (thread.contactId) {
    await recordCrmActivity({
      contactId: thread.contactId,
      leadId: thread.leadId,
      dealId: thread.dealId,
      type: "NOTE",
      subject: "Conversation snoozed",
      body: `Snoozed until ${input.snoozedUntil.toISOString()}`,
      createdById: input.actorId,
    });
  }

  return thread;
}

export async function closeThread(input: { threadId: string; actorId: string }) {
  const now = new Date();
  return prisma.crmEmailThread.update({
    where: { id: input.threadId },
    data: {
      workflowStatus: "CLOSED",
      closedAt: now,
      snoozedUntil: null,
      needsReplySince: null,
    },
  });
}

export async function reopenThread(input: {
  threadId: string;
  actorId: string;
  status?: "NEEDS_REPLY" | "WAITING_ON_CONTACT";
}) {
  const thread = await prisma.crmEmailThread.findUniqueOrThrow({
    where: { id: input.threadId },
  });
  const derived = input.status ?? deriveWorkflowFromTimestamps(thread);
  const now = new Date();
  return prisma.crmEmailThread.update({
    where: { id: input.threadId },
    data: {
      workflowStatus: derived,
      closedAt: null,
      snoozedUntil: null,
      needsReplySince: derived === "NEEDS_REPLY" ? thread.needsReplySince ?? thread.lastInboundAt ?? now : null,
    },
  });
}

export async function assignThread(input: {
  threadId: string;
  assignedToId: string | null;
  actorId: string;
}) {
  return prisma.crmEmailThread.update({
    where: { id: input.threadId },
    data: { assignedToId: input.assignedToId },
  });
}

export function deriveWorkflowFromTimestamps(thread: {
  lastInboundAt: Date | null;
  lastOutboundAt: Date | null;
  lastActivityAt?: Date | null;
}): "NEEDS_REPLY" | "WAITING_ON_CONTACT" | "CLOSED" {
  const lastActivity = thread.lastActivityAt ?? thread.lastInboundAt ?? thread.lastOutboundAt;
  if (!lastActivity || !isRecent(lastActivity)) return "CLOSED";
  if (
    thread.lastInboundAt &&
    (!thread.lastOutboundAt || thread.lastInboundAt > thread.lastOutboundAt)
  ) {
    return "NEEDS_REPLY";
  }
  if (thread.lastOutboundAt) return "WAITING_ON_CONTACT";
  return "CLOSED";
}

/** Wake expired snoozes lazily during inbox queries. */
export async function normalizeExpiredSnoozes(db: Pick<PrismaClient, "crmEmailThread"> = prisma) {
  const now = new Date();
  const expired = await db.crmEmailThread.findMany({
    where: { workflowStatus: "SNOOZED", snoozedUntil: { lte: now } },
    take: 100,
  });

  for (const thread of expired) {
    const next = deriveWorkflowFromTimestamps(thread);
    await db.crmEmailThread.update({
      where: { id: thread.id },
      data: {
        workflowStatus: next,
        snoozedUntil: null,
        needsReplySince: next === "NEEDS_REPLY" ? thread.needsReplySince ?? thread.lastInboundAt : null,
        closedAt: next === "CLOSED" ? now : null,
      },
    });
  }
}

export async function handleInboundThreadWorkflow(input: {
  db?: Db;
  threadId: string;
  contactId: string;
  leadId?: string | null;
  dealId?: string | null;
  inboundEmailId: string;
  bodyText: string;
  receivedAt: Date;
  actorId: string;
  isAutomated: boolean;
  exactThread: boolean;
}) {
  if (input.isAutomated || !input.exactThread) return null;

  return markThreadNeedsReply({
    db: input.db,
    threadId: input.threadId,
    inboundAt: input.receivedAt,
    snippet: snippetFromBody(input.bodyText),
    actorId: input.actorId,
    contactId: input.contactId,
    leadId: input.leadId,
    dealId: input.dealId,
    inboundEmailId: input.inboundEmailId,
  });
}

export async function markThreadRead(input: { threadId: string; userId: string }) {
  return prisma.crmEmailThreadUserState.upsert({
    where: { threadId_userId: { threadId: input.threadId, userId: input.userId } },
    create: { threadId: input.threadId, userId: input.userId, lastReadAt: new Date() },
    update: { lastReadAt: new Date() },
  });
}

export type ThreadWorkflowUpdate = Prisma.CrmEmailThreadUpdateInput;
