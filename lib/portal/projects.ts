import { prisma } from "@/lib/db";
import { listAccessibleProjectIds } from "@/lib/portal/access";
import {
  AGENCY_DELIVERABLE_STATUS_LABELS,
  AGENCY_MILESTONE_STATUS_LABELS,
  AGENCY_PROJECT_STATUS_LABELS,
  AGENCY_REQUIREMENT_STATUS_LABELS,
} from "@/lib/agency/constants";

export async function getPortalHomeData(portalUserId: string) {
  const projectIds = await listAccessibleProjectIds(portalUserId);
  if (!projectIds.length) {
    return { projects: [], needsAttention: [] };
  }

  const projects = await prisma.agencyProject.findMany({
    where: { id: { in: projectIds }, clientVisibilityEnabled: true },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      projectNumber: true,
      name: true,
      status: true,
      health: true,
      targetDueDate: true,
      updatedAt: true,
    },
  });

  const [requirements, deliverables, milestones] = await Promise.all([
    prisma.agencyClientRequirement.findMany({
      where: {
        projectId: { in: projectIds },
        clientVisible: true,
        status: "REQUESTED",
      },
      take: 10,
      orderBy: { dueDate: "asc" },
      select: {
        id: true,
        projectId: true,
        title: true,
        status: true,
        dueDate: true,
        project: { select: { name: true, projectNumber: true } },
      },
    }),
    prisma.agencyDeliverable.findMany({
      where: {
        projectId: { in: projectIds },
        clientVisible: true,
        status: { in: ["READY_FOR_REVIEW", "CHANGES_REQUESTED"] },
      },
      take: 10,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        projectId: true,
        title: true,
        status: true,
        project: { select: { name: true, projectNumber: true } },
      },
    }),
    prisma.agencyProjectMilestone.findMany({
      where: {
        projectId: { in: projectIds },
        clientVisible: true,
        status: "CLIENT_REVIEW",
      },
      take: 10,
      orderBy: { dueDate: "asc" },
      select: {
        id: true,
        projectId: true,
        title: true,
        status: true,
        dueDate: true,
        project: { select: { name: true, projectNumber: true } },
      },
    }),
  ]);

  const needsAttention = [
    ...requirements.map((r) => ({
      kind: "requirement" as const,
      id: r.id,
      projectId: r.projectId,
      projectName: r.project.name,
      projectNumber: r.project.projectNumber,
      title: r.title,
      statusLabel: AGENCY_REQUIREMENT_STATUS_LABELS[r.status],
    })),
    ...deliverables.map((d) => ({
      kind: "deliverable" as const,
      id: d.id,
      projectId: d.projectId,
      projectName: d.project.name,
      projectNumber: d.project.projectNumber,
      title: d.title,
      statusLabel: AGENCY_DELIVERABLE_STATUS_LABELS[d.status],
    })),
    ...milestones.map((m) => ({
      kind: "milestone" as const,
      id: m.id,
      projectId: m.projectId,
      projectName: m.project.name,
      projectNumber: m.project.projectNumber,
      title: m.title,
      statusLabel: AGENCY_MILESTONE_STATUS_LABELS[m.status],
    })),
  ];

  return {
    projects: projects.map((p) => ({
      ...p,
      statusLabel: AGENCY_PROJECT_STATUS_LABELS[p.status],
    })),
    needsAttention,
  };
}

export async function getPortalProject(portalUserId: string, projectId: string) {
  const projectIds = await listAccessibleProjectIds(portalUserId);
  if (!projectIds.includes(projectId)) return null;

  return prisma.agencyProject.findFirst({
    where: { id: projectId, clientVisibilityEnabled: true },
    select: {
      id: true,
      projectNumber: true,
      name: true,
      status: true,
      health: true,
      summary: true,
      startDate: true,
      targetDueDate: true,
      milestones: {
        where: { clientVisible: true },
        orderBy: { position: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          dueDate: true,
          completedAt: true,
        },
      },
      requirements: {
        where: { clientVisible: true },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          status: true,
          dueDate: true,
        },
      },
      deliverables: {
        where: { clientVisible: true },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          status: true,
          versions: {
            orderBy: { versionNumber: "desc" },
            take: 1,
            select: {
              id: true,
              versionNumber: true,
              externalUrl: true,
              notes: true,
              submittedAt: true,
              file: { select: { id: true, filename: true, mimeType: true } },
            },
          },
          reviews: {
            orderBy: { createdAt: "desc" },
            take: 3,
            select: { decision: true, comment: true, createdAt: true },
          },
        },
      },
      updates: {
        where: { clientVisible: true },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, title: true, body: true, createdAt: true },
      },
    },
  });
}

export async function submitDeliverableReview(input: {
  portalUserId: string;
  deliverableId: string;
  decision: "APPROVED" | "CHANGES_REQUESTED";
  comment?: string | null;
}) {
  const deliverable = await prisma.agencyDeliverable.findUnique({
    where: { id: input.deliverableId },
    include: {
      project: true,
      versions: { orderBy: { versionNumber: "desc" }, take: 1 },
    },
  });
  if (!deliverable || !deliverable.clientVisible) {
    throw new Error("Deliverable not found.");
  }

  const projectIds = await listAccessibleProjectIds(input.portalUserId);
  if (!projectIds.includes(deliverable.projectId)) {
    throw new Error("You do not have access to this deliverable.");
  }

  const version = deliverable.versions[0];
  if (!version) throw new Error("No deliverable version available for review.");

  const portalUser = await prisma.clientPortalUser.findUniqueOrThrow({
    where: { id: input.portalUserId },
  });

  await prisma.$transaction(async (tx) => {
    await tx.agencyDeliverableReview.create({
      data: {
        deliverableId: deliverable.id,
        versionId: version.id,
        reviewerPortalUserId: portalUser.id,
        reviewerContactId: portalUser.contactId,
        decision: input.decision,
        comment: input.comment ?? null,
      },
    });

    await tx.agencyDeliverable.update({
      where: { id: deliverable.id },
      data: {
        status: input.decision === "APPROVED" ? "APPROVED" : "CHANGES_REQUESTED",
      },
    });

    await tx.agencyProjectActivity.create({
      data: {
        projectId: deliverable.projectId,
        type:
          input.decision === "APPROVED"
            ? "DELIVERABLE_APPROVED"
            : "DELIVERABLE_CHANGES_REQUESTED",
        summary: `Client ${input.decision === "APPROVED" ? "approved" : "requested changes on"} ${deliverable.title}`,
        actorPortalUserId: portalUser.id,
        clientVisible: true,
      },
    });
  });

  return { ok: true as const };
}
