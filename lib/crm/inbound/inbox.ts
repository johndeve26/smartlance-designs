import { prisma } from "@/lib/db";
import { CRM_PAGE_SIZE_DEFAULT, CRM_PAGE_SIZE_MAX } from "@/lib/crm/constants";

export type InboxFilter =
  | "all"
  | "matched"
  | "unmatched"
  | "needs_review"
  | "automated"
  | "ignored";

export async function listInboxEmails(input: {
  filter?: InboxFilter;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(input.pageSize ?? CRM_PAGE_SIZE_DEFAULT, CRM_PAGE_SIZE_MAX);

  const where = {
    direction: "INBOUND" as const,
    ...(input.filter === "matched"
      ? { reviewStatus: "MATCHED" as const }
      : input.filter === "unmatched"
        ? { reviewStatus: "UNMATCHED" as const }
        : input.filter === "needs_review"
          ? { reviewStatus: "NEEDS_REVIEW" as const }
          : input.filter === "automated"
            ? { reviewStatus: "AUTOMATED" as const }
            : input.filter === "ignored"
              ? { reviewStatus: "IGNORED" as const }
              : {}),
    ...(input.search?.trim()
      ? {
          OR: [
            { subject: { contains: input.search.trim(), mode: "insensitive" as const } },
            { fromAddress: { contains: input.search.trim(), mode: "insensitive" as const } },
            {
              contact: {
                OR: [
                  { displayName: { contains: input.search.trim(), mode: "insensitive" as const } },
                  { email: { contains: input.search.trim(), mode: "insensitive" as const } },
                ],
              },
            },
          ],
        }
      : {}),
  };

  const [items, total, needsReviewCount] = await Promise.all([
    prisma.crmEmail.findMany({
      where,
      orderBy: { receivedAt: "desc" },
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
        replyToOutbound: {
          select: { id: true, subject: true, sentAt: true },
        },
      },
    }),
    prisma.crmEmail.count({ where }),
    prisma.crmEmail.count({
      where: {
        direction: "INBOUND",
        reviewStatus: { in: ["NEEDS_REVIEW", "UNMATCHED"] },
      },
    }),
  ]);

  return { items, total, page, pageSize, needsReviewCount };
}

export async function getInboxEmailById(id: string) {
  return prisma.crmEmail.findFirst({
    where: { id, direction: "INBOUND" },
    include: {
      contact: true,
      lead: true,
      deal: true,
      thread: true,
      replyToOutbound: true,
    },
  });
}

export async function getInboxCounts() {
  const [needsReview, verifiedRepliesToday, unmatched] = await Promise.all([
    prisma.crmEmail.count({
      where: {
        direction: "INBOUND",
        reviewStatus: { in: ["NEEDS_REVIEW", "UNMATCHED"] },
      },
    }),
    prisma.crmEmail.count({
      where: {
        direction: "INBOUND",
        matchConfidence: "EXACT_THREAD",
        isAutomated: false,
        receivedAt: { gte: startOfToday() },
      },
    }),
    prisma.crmEmail.count({
      where: { direction: "INBOUND", reviewStatus: "UNMATCHED" },
    }),
  ]);
  return { needsReview, verifiedRepliesToday, unmatched };
}

function startOfToday() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function listContactConversations(contactId: string) {
  const { listContactThreads } = await import("@/lib/crm/inbox/threads");
  return listContactThreads(contactId);
}
