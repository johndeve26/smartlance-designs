import { prisma } from "@/lib/db";
import { ACTIVE_AGENCY_PROJECT_STATUSES } from "@/lib/agency/constants";
import { countAwaitingApprovalDeliverables } from "@/lib/agency/deliverables";
import { countAwaitingClientRequirements } from "@/lib/agency/requirements";
import { countOverdueTasks, listOverdueTasks } from "@/lib/agency/tasks";

export async function getAgencyDashboardMetrics() {
  const [
    activeProjects,
    overdueTasks,
    awaitingClient,
    awaitingApproval,
    onHoldProjects,
    clientReviewProjects,
    overdueTaskItems,
    recentProjects,
  ] = await Promise.all([
    prisma.agencyProject.count({
      where: { status: { in: ACTIVE_AGENCY_PROJECT_STATUSES } },
    }),
    countOverdueTasks(),
    countAwaitingClientRequirements(),
    countAwaitingApprovalDeliverables(),
    prisma.agencyProject.count({ where: { status: "ON_HOLD" } }),
    prisma.agencyProject.count({ where: { status: "CLIENT_REVIEW" } }),
    listOverdueTasks({ pageSize: 10 }),
    prisma.agencyProject.findMany({
      where: { status: { in: ACTIVE_AGENCY_PROJECT_STATUSES } },
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: {
        owner: { select: { id: true, name: true } },
        primaryContact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            deliverables: true,
            requirements: true,
          },
        },
      },
    }),
  ]);

  return {
    cards: {
      activeProjects,
      overdueTasks,
      awaitingClient,
      awaitingApproval,
      onHoldProjects,
      clientReviewProjects,
    },
    overdueTaskItems: overdueTaskItems.items,
    recentProjects,
  };
}
