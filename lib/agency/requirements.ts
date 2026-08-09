import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { recordAgencyProjectActivity } from "@/lib/agency/activity";

export async function createRequirement(input: {
  projectId: string;
  milestoneId?: string | null;
  title: string;
  description?: string | null;
  type?: Prisma.AgencyClientRequirementCreateInput["type"];
  dueDate?: Date | null;
  clientVisible?: boolean;
}) {
  return prisma.agencyClientRequirement.create({
    data: {
      projectId: input.projectId,
      milestoneId: input.milestoneId || null,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      type: (input.type ?? "OTHER") as never,
      dueDate: input.dueDate ?? null,
      clientVisible: input.clientVisible ?? true,
    },
  });
}

export async function markRequirementReceived(input: {
  requirementId: string;
  actorUserId?: string | null;
  actorPortalUserId?: string | null;
}) {
  const requirement = await prisma.agencyClientRequirement.update({
    where: { id: input.requirementId },
    data: {
      status: "RECEIVED",
      fulfilledAt: new Date(),
    },
  });

  await recordAgencyProjectActivity({
    projectId: requirement.projectId,
    type: "REQUIREMENT_RECEIVED",
    summary: `Requirement received: ${requirement.title}.`,
    actorUserId: input.actorUserId ?? null,
    actorPortalUserId: input.actorPortalUserId ?? null,
    entityType: "AgencyClientRequirement",
    entityId: requirement.id,
    clientVisible: requirement.clientVisible,
  });

  return requirement;
}

export async function listProjectRequirements(input: {
  projectId: string;
  status?: Prisma.AgencyClientRequirementWhereInput["status"];
  clientVisibleOnly?: boolean;
}) {
  return prisma.agencyClientRequirement.findMany({
    where: {
      projectId: input.projectId,
      ...(input.status ? { status: input.status } : {}),
      ...(input.clientVisibleOnly ? { clientVisible: true } : {}),
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
    include: {
      milestone: { select: { id: true, title: true } },
    },
  });
}

export async function countAwaitingClientRequirements(projectId?: string) {
  return prisma.agencyClientRequirement.count({
    where: {
      ...(projectId ? { projectId } : {}),
      status: "REQUESTED",
      clientVisible: true,
      project: {
        status: { notIn: ["COMPLETED", "CANCELLED"] },
        clientVisibilityEnabled: true,
      },
    },
  });
}
