import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { recordAgencyProjectActivity } from "@/lib/agency/activity";
import { AGENCY_MILESTONE_STATUS_LABELS } from "@/lib/agency/constants";

export async function updateMilestone(input: {
  milestoneId: string;
  status?: Prisma.AgencyProjectMilestoneUpdateInput["status"];
  title?: string;
  description?: string | null;
  startDate?: Date | null;
  dueDate?: Date | null;
  clientVisible?: boolean;
  actorUserId: string;
}) {
  const before = await prisma.agencyProjectMilestone.findUniqueOrThrow({
    where: { id: input.milestoneId },
  });

  const data: Prisma.AgencyProjectMilestoneUpdateInput = {};
  if (input.status !== undefined) {
    data.status = input.status as never;
    if (input.status === "COMPLETED") {
      data.completedAt = new Date();
    } else if (before.status === "COMPLETED") {
      data.completedAt = null;
    }
  }
  if (input.title !== undefined) data.title = input.title.trim();
  if (input.description !== undefined) {
    data.description = input.description?.trim() || null;
  }
  if (input.startDate !== undefined) data.startDate = input.startDate;
  if (input.dueDate !== undefined) data.dueDate = input.dueDate;
  if (input.clientVisible !== undefined) data.clientVisible = input.clientVisible;

  const milestone = await prisma.agencyProjectMilestone.update({
    where: { id: input.milestoneId },
    data,
  });

  if (input.status && input.status !== before.status) {
    if (input.status === "COMPLETED") {
      await recordAgencyProjectActivity({
        projectId: milestone.projectId,
        type: "MILESTONE_COMPLETED",
        summary: `Milestone completed: ${milestone.title}.`,
        actorUserId: input.actorUserId,
        entityType: "AgencyProjectMilestone",
        entityId: milestone.id,
        clientVisible: milestone.clientVisible,
      });
    } else {
      await recordAgencyProjectActivity({
        projectId: milestone.projectId,
        type: "STATUS_CHANGED",
        summary: `Milestone "${milestone.title}" status changed to ${AGENCY_MILESTONE_STATUS_LABELS[input.status as keyof typeof AGENCY_MILESTONE_STATUS_LABELS] ?? input.status}.`,
        actorUserId: input.actorUserId,
        entityType: "AgencyProjectMilestone",
        entityId: milestone.id,
        metadata: { from: before.status, to: input.status },
      });
    }
  }

  return milestone;
}

export async function reorderMilestones(input: {
  projectId: string;
  milestoneIds: string[];
}) {
  const milestones = await prisma.agencyProjectMilestone.findMany({
    where: { projectId: input.projectId },
    select: { id: true },
  });

  const validIds = new Set(milestones.map((m) => m.id));
  if (input.milestoneIds.some((id) => !validIds.has(id))) {
    throw new Error("One or more milestones do not belong to this project.");
  }
  if (input.milestoneIds.length !== milestones.length) {
    throw new Error("Provide all milestone IDs when reordering.");
  }

  await prisma.$transaction(
    input.milestoneIds.map((id, position) =>
      prisma.agencyProjectMilestone.update({
        where: { id },
        data: { position },
      }),
    ),
  );

  return prisma.agencyProjectMilestone.findMany({
    where: { projectId: input.projectId },
    orderBy: { position: "asc" },
  });
}
