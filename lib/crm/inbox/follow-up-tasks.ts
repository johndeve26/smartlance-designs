import { prisma } from "@/lib/db";
import { createTask } from "@/lib/crm/tasks";
import { contactDisplayName } from "@/lib/crm/normalize";
import { defaultThreadAssigneeId } from "@/lib/crm/inbox/workflow";
import type { CrmTaskPriority } from "@prisma/client";

export async function createThreadFollowUpTask(input: {
  threadId: string;
  title?: string;
  description?: string | null;
  dueAt: Date;
  assignedToId?: string | null;
  priority?: CrmTaskPriority;
  actorId: string;
}) {
  const thread = await prisma.crmEmailThread.findUniqueOrThrow({
    where: { id: input.threadId },
    include: { contact: { select: { id: true, companyId: true, ownerId: true, firstName: true, lastName: true, displayName: true, email: true } } },
  });

  if (!thread.contactId || !thread.contact) {
    throw new Error("Thread must be linked to a contact.");
  }

  if (input.dueAt.getTime() <= Date.now()) {
    throw new Error("Follow-up due date must be in the future.");
  }

  const defaultAssignee = await defaultThreadAssigneeId(prisma, thread);
  const assignedToId =
    input.assignedToId ?? defaultAssignee ?? thread.contact.ownerId ?? input.actorId;

  const title =
    input.title?.trim() ||
    `Follow up with ${contactDisplayName(thread.contact)}`;

  return createTask({
    title,
    description: input.description?.trim() || null,
    contactId: thread.contactId,
    companyId: thread.contact.companyId,
    leadId: thread.leadId,
    dealId: thread.dealId,
    emailThreadId: thread.id,
    taskType: "FOLLOW_UP",
    assignedToId,
    dueAt: input.dueAt,
    priority: input.priority ?? "NORMAL",
    createdById: input.actorId,
  });
}

export async function getNextThreadFollowUpTask(threadId: string) {
  return prisma.crmTask.findFirst({
    where: {
      emailThreadId: threadId,
      taskType: "FOLLOW_UP",
      status: "OPEN",
    },
    orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
    include: { assignedTo: { select: { id: true, name: true } } },
  });
}
