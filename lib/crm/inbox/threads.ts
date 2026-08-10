import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { CRM_PAGE_SIZE_DEFAULT, CRM_PAGE_SIZE_MAX } from "@/lib/crm/constants";
import { normalizeExpiredSnoozes } from "@/lib/crm/inbox/workflow";

export type SalesInboxView =
  | "needs_reply"
  | "waiting"
  | "snoozed"
  | "closed"
  | "needs_review"
  | "all";

export async function listSalesInboxThreads(input: {
  view?: SalesInboxView;
  search?: string;
  assignedToId?: string;
  unassigned?: boolean;
  page?: number;
  pageSize?: number;
  userId?: string;
}) {
  await normalizeExpiredSnoozes();

  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(input.pageSize ?? CRM_PAGE_SIZE_DEFAULT, CRM_PAGE_SIZE_MAX);
  const view = input.view ?? "needs_reply";
  const now = new Date();

  const where: Prisma.CrmEmailThreadWhereInput = {
    contactId: { not: null },
  };

  switch (view) {
    case "needs_reply":
      where.workflowStatus = "NEEDS_REPLY";
      where.OR = [{ snoozedUntil: null }, { snoozedUntil: { lte: now } }];
      break;
    case "waiting":
      where.workflowStatus = "WAITING_ON_CONTACT";
      break;
    case "snoozed":
      where.workflowStatus = "SNOOZED";
      where.snoozedUntil = { gt: now };
      break;
    case "closed":
      where.workflowStatus = "CLOSED";
      break;
    case "needs_review":
      where.workflowStatus = "NEEDS_REVIEW";
      break;
    case "all":
    default:
      break;
  }

  if (input.unassigned) where.assignedToId = null;
  else if (input.assignedToId) where.assignedToId = input.assignedToId;

  if (input.search?.trim()) {
    const q = input.search.trim();
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      {
        OR: [
          { subjectNormalized: { contains: q, mode: "insensitive" } },
          { snippet: { contains: q, mode: "insensitive" } },
          {
            contact: {
              OR: [
                { displayName: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { firstName: { contains: q, mode: "insensitive" } },
                { lastName: { contains: q, mode: "insensitive" } },
                { company: { name: { contains: q, mode: "insensitive" } } },
              ],
            },
          },
        ],
      },
    ];
  }

  const orderBy: Prisma.CrmEmailThreadOrderByWithRelationInput[] =
    view === "needs_reply"
      ? [{ needsReplySince: "asc" }, { lastActivityAt: "asc" }]
      : [{ lastActivityAt: "desc" }];

  const [items, total, counts] = await Promise.all([
    prisma.crmEmailThread.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        contact: {
          include: {
            company: { select: { id: true, name: true } },
            leads: {
              where: { status: { notIn: ["UNQUALIFIED", "CLOSED"] } },
              take: 1,
              select: { id: true, status: true, temperature: true },
            },
          },
        },
        assignedTo: { select: { id: true, name: true } },
        emails: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            direction: true,
            openDetectedCount: true,
            clickDetectedCount: true,
            matchConfidence: true,
            isAutomated: true,
          },
        },
        ...(input.userId
          ? {
              userStates: {
                where: { userId: input.userId },
                take: 1,
              },
            }
          : {}),
      },
    }),
    prisma.crmEmailThread.count({ where }),
    getSalesInboxCounts(),
  ]);

  return { items, total, page, pageSize, counts };
}

export async function getSalesInboxCounts() {
  await normalizeExpiredSnoozes();
  const now = new Date();

  const [needsReply, waiting, snoozed, needsReview, unmatched, unassigned] = await Promise.all([
    prisma.crmEmailThread.count({
      where: {
        workflowStatus: "NEEDS_REPLY",
        contactId: { not: null },
        OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: now } }],
      },
    }),
    prisma.crmEmailThread.count({
      where: { workflowStatus: "WAITING_ON_CONTACT", contactId: { not: null } },
    }),
    prisma.crmEmailThread.count({
      where: { workflowStatus: "SNOOZED", snoozedUntil: { gt: now } },
    }),
    prisma.crmEmailThread.count({
      where: { workflowStatus: "NEEDS_REVIEW" },
    }),
    prisma.crmEmail.count({
      where: { direction: "INBOUND", reviewStatus: { in: ["NEEDS_REVIEW", "UNMATCHED"] } },
    }),
    prisma.crmEmailThread.count({
      where: {
        contactId: { not: null },
        assignedToId: null,
        workflowStatus: { in: ["NEEDS_REPLY", "WAITING_ON_CONTACT"] },
      },
    }),
  ]);

  return {
    needsReply,
    waiting,
    snoozed,
    needsReview: needsReview + unmatched,
    inboxBadge: needsReply + unmatched,
    unassigned,
  };
}

export async function getThreadDetail(threadId: string, userId?: string) {
  const [thread, nextFollowUp, uncertainOutbound] = await Promise.all([
    prisma.crmEmailThread.findUnique({
      where: { id: threadId },
      include: {
        contact: { include: { company: true, leads: { where: { status: { notIn: ["UNQUALIFIED", "CLOSED"] } }, take: 1 } } },
        lead: true,
        deal: true,
        assignedTo: { select: { id: true, name: true } },
        emails: {
          orderBy: [{ receivedAt: "asc" }, { sentAt: "asc" }, { createdAt: "asc" }],
          take: 200,
        },
        tasks: {
          where: { status: "OPEN" },
          orderBy: { dueAt: "asc" },
          take: 20,
        },
        ...(userId
          ? { userStates: { where: { userId }, take: 1 } }
          : {}),
      },
    }),
    prisma.crmTask.findFirst({
      where: { emailThreadId: threadId, taskType: "FOLLOW_UP", status: "OPEN" },
      orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
      include: { assignedTo: { select: { id: true, name: true } } },
    }),
    prisma.crmEmail.findFirst({
      where: {
        threadId,
        direction: "OUTBOUND",
        origin: "THREAD_REPLY",
        deliveryStatus: "SENT_UNCONFIRMED",
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!thread) return null;
  return { ...thread, nextFollowUp, uncertainOutbound };
}

export async function listContactThreads(contactId: string) {
  return prisma.crmEmailThread.findMany({
    where: { contactId },
    orderBy: { lastActivityAt: "desc" },
    take: 20,
    select: {
      id: true,
      subjectNormalized: true,
      workflowStatus: true,
      snippet: true,
      lastActivityAt: true,
      assignedTo: { select: { id: true, name: true } },
    },
  });
}
