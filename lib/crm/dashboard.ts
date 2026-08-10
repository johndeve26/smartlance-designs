import { prisma } from "@/lib/db";
import { listRecentActivities } from "@/lib/crm/activities";
import { INACTIVE_LEAD_STATUSES } from "@/lib/crm/constants";
import { getPipelineSummary } from "@/lib/crm/deals";
import { getInboxCounts } from "@/lib/crm/inbound/inbox";
import { countOverdueTasks, countTasksDueToday, listTasks } from "@/lib/crm/tasks";

export async function getCrmDashboardMetrics() {
  const now = new Date();
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );

  const [
    openLeads,
    warmHotLeads,
    openDeals,
    pipelineAgg,
    tasksDueToday,
    overdueTasks,
    uncontactedNewLeads,
    pipeline,
    recentActivity,
    todayTasks,
    overdueTaskItems,
    emailsSentToday,
    manualEmailsSentToday,
    sequenceEmailsSentToday,
    tasksCompletedToday,
    activeEnrollments,
    sequencesNeedingAttention,
    inboxCounts,
    replyReviewTasks,
  ] = await Promise.all([
    prisma.crmLead.count({
      where: { status: { notIn: INACTIVE_LEAD_STATUSES } },
    }),
    prisma.crmLead.count({
      where: {
        status: { notIn: INACTIVE_LEAD_STATUSES },
        temperature: { in: ["WARM", "HOT"] },
      },
    }),
    prisma.crmDeal.count({
      where: {
        isArchived: false,
        stage: { notIn: ["WON", "LOST"] },
      },
    }),
    prisma.crmDeal.aggregate({
      where: {
        isArchived: false,
        stage: { notIn: ["WON", "LOST"] },
        amount: { not: null },
      },
      _sum: { amount: true },
    }),
    countTasksDueToday(),
    countOverdueTasks(),
    prisma.crmLead.count({
      where: {
        status: "NEW",
        contact: { lastContactedAt: null },
      },
    }),
    getPipelineSummary(),
    listRecentActivities(15),
    listTasks({ view: "today", pageSize: 10 }),
    listTasks({ view: "overdue", pageSize: 10 }),
    prisma.crmEmail.count({
      where: { deliveryStatus: "SENT", sentAt: { gte: todayStart } },
    }),
    prisma.crmEmail.count({
      where: {
        origin: "MANUAL",
        deliveryStatus: "SENT",
        sentAt: { gte: todayStart },
      },
    }),
    prisma.crmEmail.count({
      where: {
        origin: "SEQUENCE",
        deliveryStatus: "SENT",
        sentAt: { gte: todayStart },
      },
    }),
    prisma.crmTask.count({
      where: { status: "COMPLETED", completedAt: { gte: todayStart } },
    }),
    prisma.crmSequenceEnrollment.count({ where: { status: "ACTIVE" } }),
    prisma.crmSequenceEnrollment.count({
      where: { status: "FAILED" },
    }),
    getInboxCounts(),
    prisma.crmTask.count({
      where: {
        status: "OPEN",
        title: { startsWith: "Review reply from" },
      },
    }),
  ]);

  const leadsWithFollowUp = await prisma.crmLead.findMany({
    where: {
      status: { notIn: INACTIVE_LEAD_STATUSES },
      nextFollowUpAt: { gte: todayStart, lte: now },
    },
    take: 10,
    include: {
      contact: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          displayName: true,
        },
      },
    },
  });

  const dealsNeedingAction = await prisma.crmDeal.findMany({
    where: {
      isArchived: false,
      stage: { in: ["PROPOSAL", "NEGOTIATION"] },
    },
    orderBy: { updatedAt: "asc" },
    take: 10,
    include: {
      contact: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          displayName: true,
        },
      },
    },
  });

  return {
    cards: {
      openLeads,
      warmHotLeads,
      openDeals,
      pipelineValue: Number(pipelineAgg._sum.amount ?? 0),
      tasksDueToday,
      overdueTasks,
      uncontactedNewLeads,
      emailsSentToday,
      manualEmailsSentToday,
      sequenceEmailsSentToday,
      tasksCompletedToday,
      activeEnrollments,
      sequencesNeedingAttention,
      inboxNeedsReview: inboxCounts.needsReview,
      verifiedRepliesToday: inboxCounts.verifiedRepliesToday,
      unmatchedInbound: inboxCounts.unmatched,
      replyReviewTasks,
    },
    pipeline,
    recentActivity,
    today: {
      overdueTasks: overdueTaskItems.items,
      tasksDueToday: todayTasks.items,
      leadsWithFollowUp,
      dealsNeedingAction,
    },
  };
}
