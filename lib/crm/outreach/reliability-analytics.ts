import { prisma } from "@/lib/db";

export async function getReliabilityAttentionItems() {
  const [failedExecutions, ambiguousExecutions, ambiguousEmails, pausedEnrollments, failedEnrollments] =
    await Promise.all([
      prisma.crmSequenceExecution.findMany({
        where: { status: "FAILED" },
        orderBy: { updatedAt: "desc" },
        take: 20,
        select: {
          id: true,
          failureCode: true,
          failureCategory: true,
          updatedAt: true,
          enrollment: {
            select: {
              id: true,
              contactId: true,
              sequence: { select: { name: true } },
              contact: {
                select: {
                  id: true,
                  displayName: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      }),
      prisma.crmSequenceExecution.findMany({
        where: { status: "AMBIGUOUS" },
        orderBy: { updatedAt: "desc" },
        take: 20,
        select: {
          id: true,
          failureCode: true,
          updatedAt: true,
          enrollment: {
            select: {
              id: true,
              contactId: true,
              sequence: { select: { name: true } },
            },
          },
        },
      }),
      prisma.crmEmail.findMany({
        where: { deliveryStatus: "SENT_UNCONFIRMED" },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          subject: true,
          providerMessageId: true,
          createdAt: true,
          contactId: true,
          executionId: true,
        },
      }),
      prisma.crmSequenceEnrollment.count({ where: { status: "PAUSED" } }),
      prisma.crmSequenceEnrollment.count({ where: { status: "FAILED" } }),
    ]);

  return {
    failedExecutions,
    ambiguousExecutions,
    ambiguousEmails,
    pausedEnrollments,
    failedEnrollments,
    needsAttention:
      failedExecutions.length +
      ambiguousExecutions.length +
      ambiguousEmails.length,
  };
}
