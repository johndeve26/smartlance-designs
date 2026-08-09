import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { recordAgencyProjectActivity } from "@/lib/agency/activity";

export async function createDeliverable(input: {
  projectId: string;
  milestoneId?: string | null;
  title: string;
  description?: string | null;
  type?: Prisma.AgencyDeliverableCreateInput["type"];
  clientVisible?: boolean;
  createdById: string;
}) {
  return prisma.agencyDeliverable.create({
    data: {
      projectId: input.projectId,
      milestoneId: input.milestoneId || null,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      type: (input.type ?? "OTHER") as never,
      clientVisible: input.clientVisible ?? true,
      createdById: input.createdById,
    },
  });
}

export async function addDeliverableVersion(input: {
  deliverableId: string;
  externalUrl?: string | null;
  notes?: string | null;
  createdById: string;
}) {
  const deliverable = await prisma.agencyDeliverable.findUniqueOrThrow({
    where: { id: input.deliverableId },
  });

  const latest = await prisma.agencyDeliverableVersion.aggregate({
    where: { deliverableId: input.deliverableId },
    _max: { versionNumber: true },
  });

  return prisma.agencyDeliverableVersion.create({
    data: {
      deliverableId: input.deliverableId,
      versionNumber: (latest._max.versionNumber ?? 0) + 1,
      externalUrl: input.externalUrl?.trim() || null,
      notes: input.notes?.trim() || null,
      createdById: input.createdById,
    },
  });
}

export async function submitDeliverableForReview(input: {
  deliverableId: string;
  versionId: string;
  actorUserId: string;
}) {
  const [deliverable, version] = await Promise.all([
    prisma.agencyDeliverable.findUniqueOrThrow({
      where: { id: input.deliverableId },
    }),
    prisma.agencyDeliverableVersion.findUniqueOrThrow({
      where: { id: input.versionId },
    }),
  ]);

  if (version.deliverableId !== deliverable.id) {
    throw new Error("Version does not belong to this deliverable.");
  }

  const [updatedDeliverable, updatedVersion] = await prisma.$transaction([
    prisma.agencyDeliverable.update({
      where: { id: deliverable.id },
      data: { status: "READY_FOR_REVIEW" },
    }),
    prisma.agencyDeliverableVersion.update({
      where: { id: version.id },
      data: { submittedAt: new Date() },
    }),
  ]);

  await recordAgencyProjectActivity({
    projectId: deliverable.projectId,
    type: "DELIVERABLE_SUBMITTED",
    summary: `Deliverable submitted for review: ${deliverable.title} (v${version.versionNumber}).`,
    actorUserId: input.actorUserId,
    entityType: "AgencyDeliverable",
    entityId: deliverable.id,
    metadata: { versionId: version.id, versionNumber: version.versionNumber },
    clientVisible: deliverable.clientVisible,
  });

  return { deliverable: updatedDeliverable, version: updatedVersion };
}

export async function adminOverrideApproveDeliverable(input: {
  deliverableId: string;
  versionId: string;
  actorUserId: string;
  comment?: string | null;
}) {
  const deliverable = await prisma.agencyDeliverable.findUniqueOrThrow({
    where: { id: input.deliverableId },
  });
  const version = await prisma.agencyDeliverableVersion.findUniqueOrThrow({
    where: { id: input.versionId },
  });

  if (version.deliverableId !== deliverable.id) {
    throw new Error("Version does not belong to this deliverable.");
  }

  const [updatedDeliverable, review] = await prisma.$transaction([
    prisma.agencyDeliverable.update({
      where: { id: deliverable.id },
      data: { status: "APPROVED" },
    }),
    prisma.agencyDeliverableReview.create({
      data: {
        deliverableId: deliverable.id,
        versionId: version.id,
        decision: "APPROVED",
        comment: input.comment?.trim() || null,
        isAdminOverride: true,
      },
    }),
  ]);

  await recordAgencyProjectActivity({
    projectId: deliverable.projectId,
    type: "DELIVERABLE_APPROVED",
    summary: `Deliverable approved (admin override): ${deliverable.title} (v${version.versionNumber}).`,
    actorUserId: input.actorUserId,
    entityType: "AgencyDeliverable",
    entityId: deliverable.id,
    metadata: { versionId: version.id, adminOverride: true },
    clientVisible: deliverable.clientVisible,
  });

  return { deliverable: updatedDeliverable, review };
}

export async function approveDeliverableByClient(input: {
  deliverableId: string;
  versionId: string;
  reviewerContactId: string;
  reviewerPortalUserId: string;
  comment?: string | null;
}) {
  const deliverable = await prisma.agencyDeliverable.findUniqueOrThrow({
    where: { id: input.deliverableId },
  });
  const version = await prisma.agencyDeliverableVersion.findUniqueOrThrow({
    where: { id: input.versionId },
  });

  if (version.deliverableId !== deliverable.id) {
    throw new Error("Version does not belong to this deliverable.");
  }
  if (deliverable.status !== "READY_FOR_REVIEW" && deliverable.status !== "CHANGES_REQUESTED") {
    throw new Error("Deliverable is not awaiting client review.");
  }

  const [updatedDeliverable, review] = await prisma.$transaction([
    prisma.agencyDeliverable.update({
      where: { id: deliverable.id },
      data: { status: "APPROVED" },
    }),
    prisma.agencyDeliverableReview.create({
      data: {
        deliverableId: deliverable.id,
        versionId: version.id,
        reviewerContactId: input.reviewerContactId,
        reviewerPortalUserId: input.reviewerPortalUserId,
        decision: "APPROVED",
        comment: input.comment?.trim() || null,
      },
    }),
  ]);

  await recordAgencyProjectActivity({
    projectId: deliverable.projectId,
    type: "DELIVERABLE_APPROVED",
    summary: `Deliverable approved: ${deliverable.title} (v${version.versionNumber}).`,
    actorPortalUserId: input.reviewerPortalUserId,
    entityType: "AgencyDeliverable",
    entityId: deliverable.id,
    metadata: { versionId: version.id },
    clientVisible: true,
  });

  return { deliverable: updatedDeliverable, review };
}

export async function requestDeliverableChanges(input: {
  deliverableId: string;
  versionId: string;
  reviewerContactId: string;
  reviewerPortalUserId: string;
  comment?: string | null;
}) {
  const deliverable = await prisma.agencyDeliverable.findUniqueOrThrow({
    where: { id: input.deliverableId },
  });
  const version = await prisma.agencyDeliverableVersion.findUniqueOrThrow({
    where: { id: input.versionId },
  });

  if (version.deliverableId !== deliverable.id) {
    throw new Error("Version does not belong to this deliverable.");
  }

  const [updatedDeliverable, review] = await prisma.$transaction([
    prisma.agencyDeliverable.update({
      where: { id: deliverable.id },
      data: { status: "CHANGES_REQUESTED" },
    }),
    prisma.agencyDeliverableReview.create({
      data: {
        deliverableId: deliverable.id,
        versionId: version.id,
        reviewerContactId: input.reviewerContactId,
        reviewerPortalUserId: input.reviewerPortalUserId,
        decision: "CHANGES_REQUESTED",
        comment: input.comment?.trim() || null,
      },
    }),
  ]);

  await recordAgencyProjectActivity({
    projectId: deliverable.projectId,
    type: "DELIVERABLE_CHANGES_REQUESTED",
    summary: `Changes requested on ${deliverable.title} (v${version.versionNumber}).`,
    actorPortalUserId: input.reviewerPortalUserId,
    entityType: "AgencyDeliverable",
    entityId: deliverable.id,
    metadata: { versionId: version.id, comment: input.comment ?? null },
    clientVisible: true,
  });

  return { deliverable: updatedDeliverable, review };
}

export async function countAwaitingApprovalDeliverables(projectId?: string) {
  return prisma.agencyDeliverable.count({
    where: {
      ...(projectId ? { projectId } : {}),
      status: "READY_FOR_REVIEW",
      clientVisible: true,
      project: {
        status: { notIn: ["COMPLETED", "CANCELLED"] },
        clientVisibilityEnabled: true,
      },
    },
  });
}

export async function getDeliverableById(deliverableId: string) {
  return prisma.agencyDeliverable.findUnique({
    where: { id: deliverableId },
    include: {
      versions: { orderBy: { versionNumber: "desc" } },
      reviews: { orderBy: { createdAt: "desc" } },
      milestone: { select: { id: true, title: true } },
    },
  });
}
