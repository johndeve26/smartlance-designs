import { prisma } from "@/lib/db";
import { inferServiceType } from "@/lib/agency/deal-conversion";
import { createProject } from "@/lib/agency/projects";
import { recordProposalActivity } from "@/lib/proposals/activity";

export async function convertAcceptedProposalToProject(input: {
  proposalId: string;
  actorUserId: string;
  name?: string;
  templateId?: string | null;
  grantProjectAccessContactIds?: string[];
}) {
  const existing = await prisma.agencyProject.findUnique({
    where: { sourceProposalId: input.proposalId },
  });
  if (existing) {
    return { project: existing, created: false as const };
  }

  const proposal = await prisma.agencyProposal.findUniqueOrThrow({
    where: { id: input.proposalId },
    include: {
      acceptance: true,
      deal: true,
      primaryContact: true,
    },
  });

  if (proposal.status !== "ACCEPTED" || !proposal.acceptance) {
    throw new Error("Only accepted proposals can be converted to projects.");
  }

  const acceptedVersion = await prisma.agencyProposalVersion.findUnique({
    where: { id: proposal.acceptance.acceptedVersionId },
  });
  if (!acceptedVersion) {
    throw new Error("Accepted proposal version not found.");
  }

  const deliverableItems = await prisma.agencyProposalDeliverableItem.findMany({
    where: { proposalVersionId: acceptedVersion.id },
    orderBy: { position: "asc" },
  });

  const serviceType = proposal.deal
    ? inferServiceType(proposal.deal)
    : "OTHER";

  const name =
    input.name?.trim() ||
    proposal.title.trim() ||
    `Project — ${proposal.proposalNumber}`;

  const created = await createProject({
    name,
    primaryContactId: proposal.primaryContactId,
    clientCompanyId: proposal.companyId,
    serviceType,
    ownerId: proposal.ownerId,
    createdById: input.actorUserId,
    budgetSnapshot: Number(proposal.acceptance.acceptedTotal),
    currency: proposal.acceptance.currency,
    summary:
      acceptedVersion.scopeSummary?.trim() ||
      proposal.summary?.trim() ||
      null,
    targetDueDate: acceptedVersion.estimatedStart,
    templateId: input.templateId ?? null,
  });

  if (!created) {
    throw new Error("Failed to create project from proposal.");
  }

  try {
    const project = await prisma.agencyProject.update({
      where: { id: created.id },
      data: {
        sourceProposalId: proposal.id,
        sourceProposalAcceptanceId: proposal.acceptance.id,
        ...(proposal.dealId && !(await prisma.agencyProject.findUnique({ where: { sourceDealId: proposal.dealId } }))
          ? { sourceDealId: proposal.dealId }
          : {}),
      },
    });

    if (input.grantProjectAccessContactIds?.length) {
      for (const contactId of input.grantProjectAccessContactIds) {
        const portalUser = await prisma.clientPortalUser.findUnique({
          where: { contactId },
        });
        await prisma.agencyProjectClientAccess.upsert({
          where: {
            projectId_contactId: {
              projectId: project.id,
              contactId,
            },
          },
          create: {
            projectId: project.id,
            contactId,
            portalUserId: portalUser?.id ?? null,
            role: "CLIENT_MEMBER",
            grantedById: input.actorUserId,
          },
          update: {
            revokedAt: null,
            portalUserId: portalUser?.id ?? null,
          },
        });
      }
    }

    if (deliverableItems.length) {
      await prisma.agencyDeliverable.createMany({
        data: deliverableItems.map((item) => ({
          projectId: project.id,
          title: item.title,
          description: item.description,
          type: "OTHER" as const,
          status: "DRAFT" as const,
          createdById: input.actorUserId,
        })),
      });
    }

    await recordProposalActivity({
      proposalId: proposal.id,
      type: "PROJECT_CREATED",
      summary: `Project ${project.projectNumber} created from accepted proposal.`,
      actorUserId: input.actorUserId,
      entityType: "AgencyProject",
      entityId: project.id,
      clientVisible: true,
    });

    return { project, created: true as const };
  } catch (err) {
    const raced = await prisma.agencyProject.findUnique({
      where: { sourceProposalId: input.proposalId },
    });
    if (raced) {
      return { project: raced, created: false as const };
    }
    throw err;
  }
}

export async function getProjectByProposalId(proposalId: string) {
  return prisma.agencyProject.findUnique({
    where: { sourceProposalId: proposalId },
    select: { id: true, name: true, projectNumber: true, status: true },
  });
}
