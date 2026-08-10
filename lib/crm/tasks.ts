import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import { recordCrmActivity } from "@/lib/crm/activities";
import {
  CRM_PAGE_SIZE_DEFAULT,
  CRM_PAGE_SIZE_MAX,
} from "@/lib/crm/constants";
import type { CrmTaskFilters } from "@/lib/crm/schema";

function boundedPage(input?: { page?: number; pageSize?: number }) {
  const page = Math.max(1, input?.page ?? 1);
  const pageSize = Math.min(
    input?.pageSize ?? CRM_PAGE_SIZE_DEFAULT,
    CRM_PAGE_SIZE_MAX,
  );
  return { page, pageSize };
}

function startOfUtcDay(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function endOfUtcDay(d = new Date()) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999),
  );
}

export async function syncContactNextActivityAt(contactId: string) {
  const earliest = await prisma.crmTask.findFirst({
    where: { contactId, status: "OPEN", dueAt: { not: null } },
    orderBy: { dueAt: "asc" },
    select: { dueAt: true },
  });

  await prisma.crmContact.update({
    where: { id: contactId },
    data: { nextActivityAt: earliest?.dueAt ?? null },
  });
}

export async function createTask(
  input: {
    title: string;
    description?: string | null;
    contactId?: string | null;
    companyId?: string | null;
    leadId?: string | null;
    dealId?: string | null;
    emailThreadId?: string | null;
    taskType?: Prisma.CrmTaskCreateInput["taskType"];
    assignedToId?: string | null;
    priority?: Prisma.CrmTaskCreateInput["priority"];
    dueAt?: Date | null;
    createdById: string;
  },
  db: Pick<PrismaClient, "crmTask" | "crmActivity" | "crmContact"> = prisma,
) {
  const task = await db.crmTask.create({
    data: {
      title: input.title.trim(),
      description: input.description?.trim() || null,
      contactId: input.contactId || null,
      companyId: input.companyId || null,
      leadId: input.leadId || null,
      dealId: input.dealId || null,
      emailThreadId: input.emailThreadId || null,
      taskType: input.taskType ?? "GENERAL",
      assignedToId: input.assignedToId || input.createdById,
      priority: input.priority ?? "NORMAL",
      dueAt: input.dueAt ?? null,
      createdById: input.createdById,
    },
    include: {
      contact: true,
      assignedTo: { select: { id: true, name: true } },
    },
  });

  if (task.contactId) {
    await recordCrmActivity({
      contactId: task.contactId,
      companyId: task.companyId,
      leadId: task.leadId,
      dealId: task.dealId,
      type: "TASK_CREATED",
      subject: task.title,
      createdById: input.createdById,
    }, db);
    if (db === prisma) {
      await syncContactNextActivityAt(task.contactId);
    }
  }

  return task;
}

export async function completeTask(input: {
  taskId: string;
  actorId: string;
}) {
  const task = await prisma.crmTask.update({
    where: { id: input.taskId, status: "OPEN" },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });

  if (task.contactId) {
    await recordCrmActivity({
      contactId: task.contactId,
      companyId: task.companyId,
      leadId: task.leadId,
      dealId: task.dealId,
      type: "TASK_COMPLETED",
      subject: task.title,
      createdById: input.actorId,
    });
    await syncContactNextActivityAt(task.contactId);
    const { advanceEnrollmentAfterTask } = await import("@/lib/crm/sequences/scheduler");
    await advanceEnrollmentAfterTask(task.id);
  }

  return task;
}

export async function cancelTask(input: { taskId: string; actorId: string }) {
  const task = await prisma.crmTask.update({
    where: { id: input.taskId },
    data: { status: "CANCELLED" },
  });
  if (task.contactId) {
    await syncContactNextActivityAt(task.contactId);
  }
  return task;
}

export async function listTasks(filters: CrmTaskFilters = {}) {
  const { page, pageSize } = boundedPage(filters);
  const where: Prisma.CrmTaskWhereInput = {};
  const now = new Date();
  const todayStart = startOfUtcDay(now);
  const todayEnd = endOfUtcDay(now);

  switch (filters.view) {
    case "today":
      where.status = "OPEN";
      where.dueAt = { gte: todayStart, lte: todayEnd };
      break;
    case "upcoming":
      where.status = "OPEN";
      where.dueAt = { gt: todayEnd };
      break;
    case "overdue":
      where.status = "OPEN";
      where.dueAt = { lt: todayStart };
      break;
    case "completed":
      where.status = "COMPLETED";
      break;
    case "mine":
      where.status = "OPEN";
      if (filters.assignedToId) where.assignedToId = filters.assignedToId;
      break;
    case "all":
    default:
      where.status = "OPEN";
      break;
  }

  if (filters.assignedToId && filters.view !== "mine") {
    where.assignedToId = filters.assignedToId;
  }

  const [items, total] = await Promise.all([
    prisma.crmTask.findMany({
      where,
      orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            email: true,
          },
        },
        assignedTo: { select: { id: true, name: true } },
        lead: { select: { id: true, status: true } },
        deal: { select: { id: true, title: true, stage: true } },
      },
    }),
    prisma.crmTask.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function countTasksDueToday() {
  const now = new Date();
  return prisma.crmTask.count({
    where: {
      status: "OPEN",
      dueAt: { gte: startOfUtcDay(now), lte: endOfUtcDay(now) },
    },
  });
}

export async function countOverdueTasks() {
  return prisma.crmTask.count({
    where: {
      status: "OPEN",
      dueAt: { lt: startOfUtcDay(new Date()) },
    },
  });
}

export async function addNote(input: {
  contactId: string;
  subject?: string | null;
  body: string;
  leadId?: string | null;
  dealId?: string | null;
  actorId: string;
}) {
  return recordCrmActivity({
    contactId: input.contactId,
    leadId: input.leadId,
    dealId: input.dealId,
    type: "NOTE",
    subject: input.subject?.trim() || "Note",
    body: input.body.trim(),
    createdById: input.actorId,
  });
}
