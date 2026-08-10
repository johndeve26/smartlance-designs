import { prisma } from "@/lib/db";
import { getEngagementAnalytics } from "@/lib/crm/outreach/engagement/analytics";

export async function getOutreachAnalytics() {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const [
    activeEnrollments,
    sequenceEmailsSent,
    manualEmailsSent,
    sequenceEmailsFailed,
    ambiguousEmails,
    tasksCompletedToday,
    overdueTasks,
    manualReplies,
    enrollmentsStopped,
  ] = await Promise.all([
    prisma.crmSequenceEnrollment.count({ where: { status: "ACTIVE" } }),
    prisma.crmEmail.count({
      where: {
        origin: "SEQUENCE",
        deliveryStatus: "SENT",
      },
    }),
    prisma.crmEmail.count({
      where: { origin: "MANUAL", deliveryStatus: "SENT" },
    }),
    prisma.crmEmail.count({
      where: { origin: "SEQUENCE", deliveryStatus: "FAILED" },
    }),
    prisma.crmEmail.count({
      where: {
        origin: "SEQUENCE",
        deliveryStatus: "SENT_UNCONFIRMED",
      },
    }),
    prisma.crmTask.count({
      where: {
        status: "COMPLETED",
        completedAt: { gte: todayStart },
      },
    }),
    prisma.crmTask.count({
      where: {
        status: "OPEN",
        dueAt: { lt: todayStart },
      },
    }),
    prisma.crmContact.count({
      where: { manualRepliedAt: { not: null } },
    }),
    prisma.crmSequenceEnrollment.count({
      where: { status: "STOPPED" },
    }),
  ]);

  const emailsSentToday = await prisma.crmEmail.count({
    where: {
      deliveryStatus: "SENT",
      sentAt: { gte: todayStart },
    },
  });

  const sequencePerformance = await prisma.crmSequence.findMany({
    where: { status: { in: ["ACTIVE", "PAUSED"] } },
    include: {
      _count: {
        select: {
          enrollments: true,
          steps: true,
        },
      },
      enrollments: {
        select: { status: true },
      },
    },
    take: 20,
  });

  const sequences = sequencePerformance.map((s) => ({
    id: s.id,
    name: s.name,
    status: s.status,
    totalEnrollments: s._count.enrollments,
    activeEnrollments: s.enrollments.filter((e) => e.status === "ACTIVE").length,
    completedEnrollments: s.enrollments.filter((e) => e.status === "COMPLETED").length,
    stepCount: s._count.steps,
  }));

  return {
    activeEnrollments,
    sequenceEmailsSent,
    manualEmailsSent,
    sequenceEmailsFailed,
    ambiguousEmails,
    emailsSentToday,
    tasksCompletedToday,
    overdueTasks,
    manualRepliesRecorded: manualReplies,
    enrollmentsStopped,
    verifiedRepliesTotal: await prisma.crmEmail.count({
      where: {
        direction: "INBOUND",
        matchConfidence: "EXACT_THREAD",
        isAutomated: false,
      },
    }),
    engagement: await getEngagementAnalytics(),
    sequences,
    notImplemented: {},
  };
}

export async function listContactEmailHistory(contactId: string, page = 1) {
  const pageSize = 25;
  const [items, total] = await Promise.all([
    prisma.crmEmail.findMany({
      where: { contactId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        origin: true,
        direction: true,
        subject: true,
        deliveryStatus: true,
        sentAt: true,
        failedAt: true,
        createdAt: true,
        enrollmentId: true,
        openDetectedCount: true,
        clickDetectedCount: true,
        firstOpenDetectedAt: true,
        firstClickDetectedAt: true,
      },
    }),
    prisma.crmEmail.count({ where: { contactId } }),
  ]);
  return { items, total, page, pageSize };
}
