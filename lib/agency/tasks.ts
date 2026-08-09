import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { recordAgencyProjectActivity } from "@/lib/agency/activity";
import {
  AGENCY_PAGE_SIZE_DEFAULT,
  AGENCY_PAGE_SIZE_MAX,
} from "@/lib/agency/constants";

function boundedPage(input?: { page?: number; pageSize?: number }) {
  const page = Math.max(1, input?.page ?? 1);
  const pageSize = Math.min(
    input?.pageSize ?? AGENCY_PAGE_SIZE_DEFAULT,
    AGENCY_PAGE_SIZE_MAX,
  );
  return { page, pageSize };
}

export async function createTask(input: {
  projectId: string;
  milestoneId?: string | null;
  title: string;
  description?: string | null;
  priority?: Prisma.AgencyProjectTaskCreateInput["priority"];
  assigneeId?: string | null;
  startDate?: Date | null;
  dueDate?: Date | null;
  clientVisible?: boolean;
  createdById: string;
}) {
  const maxPosition = await prisma.agencyProjectTask.aggregate({
    where: { projectId: input.projectId },
    _max: { position: true },
  });

  return prisma.agencyProjectTask.create({
    data: {
      projectId: input.projectId,
      milestoneId: input.milestoneId || null,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      priority: (input.priority ?? "NORMAL") as never,
      assigneeId: input.assigneeId || null,
      startDate: input.startDate ?? null,
      dueDate: input.dueDate ?? null,
      clientVisible: input.clientVisible ?? false,
      position: (maxPosition._max.position ?? -1) + 1,
      createdById: input.createdById,
    },
    include: {
      assignee: { select: { id: true, name: true } },
      milestone: { select: { id: true, title: true } },
    },
  });
}

export async function updateTask(input: {
  taskId: string;
  title?: string;
  description?: string | null;
  status?: Prisma.AgencyProjectTaskUpdateInput["status"];
  priority?: Prisma.AgencyProjectTaskUpdateInput["priority"];
  assigneeId?: string | null;
  milestoneId?: string | null;
  startDate?: Date | null;
  dueDate?: Date | null;
  clientVisible?: boolean;
  blockedReason?: string | null;
  actorUserId: string;
}) {
  const before = await prisma.agencyProjectTask.findUniqueOrThrow({
    where: { id: input.taskId },
  });

  const data: Prisma.AgencyProjectTaskUpdateInput = {};
  if (input.title !== undefined) data.title = input.title.trim();
  if (input.description !== undefined) {
    data.description = input.description?.trim() || null;
  }
  if (input.status !== undefined) {
    data.status = input.status as never;
    if (input.status === "DONE") {
      data.completedAt = new Date();
    } else if (before.status === "DONE") {
      data.completedAt = null;
    }
  }
  if (input.priority !== undefined) data.priority = input.priority as never;
  if (input.assigneeId !== undefined) {
    data.assignee = input.assigneeId
      ? { connect: { id: input.assigneeId } }
      : { disconnect: true };
  }
  if (input.milestoneId !== undefined) {
    data.milestone = input.milestoneId
      ? { connect: { id: input.milestoneId } }
      : { disconnect: true };
  }
  if (input.startDate !== undefined) data.startDate = input.startDate;
  if (input.dueDate !== undefined) data.dueDate = input.dueDate;
  if (input.clientVisible !== undefined) data.clientVisible = input.clientVisible;
  if (input.blockedReason !== undefined) {
    data.blockedReason = input.blockedReason?.trim() || null;
  }

  const task = await prisma.agencyProjectTask.update({
    where: { id: input.taskId },
    data,
    include: {
      assignee: { select: { id: true, name: true } },
      milestone: { select: { id: true, title: true } },
    },
  });

  if (input.status === "DONE" && before.status !== "DONE") {
    await recordAgencyProjectActivity({
      projectId: task.projectId,
      type: "TASK_COMPLETED",
      summary: `Task completed: ${task.title}.`,
      actorUserId: input.actorUserId,
      entityType: "AgencyProjectTask",
      entityId: task.id,
      clientVisible: task.clientVisible,
    });
  }

  return task;
}

export async function completeTask(input: {
  taskId: string;
  actorUserId: string;
}) {
  return updateTask({
    taskId: input.taskId,
    status: "DONE",
    actorUserId: input.actorUserId,
  });
}

export function isTaskOverdue(task: {
  status: string;
  dueDate: Date | null;
}, now = new Date()) {
  if (task.status === "DONE") return false;
  if (!task.dueDate) return false;
  return task.dueDate.getTime() < now.getTime();
}

export async function countOverdueTasks(projectId?: string) {
  const now = new Date();
  return prisma.agencyProjectTask.count({
    where: {
      ...(projectId ? { projectId } : {}),
      status: { not: "DONE" },
      dueDate: { lt: now },
      project: {
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
    },
  });
}

export async function listOverdueTasks(input?: {
  projectId?: string;
  page?: number;
  pageSize?: number;
}) {
  const { page, pageSize } = boundedPage(input);
  const now = new Date();
  const where: Prisma.AgencyProjectTaskWhereInput = {
    ...(input?.projectId ? { projectId: input.projectId } : {}),
    status: { not: "DONE" },
    dueDate: { lt: now },
    project: {
      status: { notIn: ["COMPLETED", "CANCELLED"] },
    },
  };

  const [items, total] = await Promise.all([
    prisma.agencyProjectTask.findMany({
      where,
      orderBy: [{ dueDate: "asc" }, { id: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        project: { select: { id: true, name: true, projectNumber: true } },
        assignee: { select: { id: true, name: true } },
      },
    }),
    prisma.agencyProjectTask.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function listProjectTasks(input: {
  projectId: string;
  status?: Prisma.AgencyProjectTaskWhereInput["status"];
  page?: number;
  pageSize?: number;
}) {
  const { page, pageSize } = boundedPage(input);
  const where: Prisma.AgencyProjectTaskWhereInput = {
    projectId: input.projectId,
    ...(input.status ? { status: input.status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.agencyProjectTask.findMany({
      where,
      orderBy: [{ position: "asc" }, { dueDate: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        assignee: { select: { id: true, name: true } },
        milestone: { select: { id: true, title: true } },
      },
    }),
    prisma.agencyProjectTask.count({ where }),
  ]);

  return { items, total, page, pageSize };
}
