import { prisma } from "@/lib/db";
import { expireProposalIfNeeded } from "@/lib/proposals/status";
import { toClientProposalDto } from "@/lib/proposals/portal-dto";
import {
  assertProposalAccess,
  getProposalAccessRole,
  listAccessibleProposals,
  recordProposalView,
} from "@/lib/proposals/portal-access";
import { PROPOSAL_CLIENT_DECISION_STATUSES } from "@/lib/proposals/constants";

export async function getPortalProposalsHome(portalUserId: string) {
  const proposals = await listAccessibleProposals(portalUserId);

  const needsAttention = proposals.filter(
    (p) =>
      p.proposal.status === "SENT" || p.proposal.status === "CHANGES_REQUESTED",
  );

  return { proposals, needsAttention };
}

export async function getPortalProposalDetail(input: {
  proposalId: string;
  portalUserId: string;
  contactId: string;
  versionId?: string;
}) {
  await assertProposalAccess(input);
  await expireProposalIfNeeded(input.proposalId);

  const access = await getProposalAccessRole({
    proposalId: input.proposalId,
    portalUserId: input.portalUserId,
  });
  if (!access) {
    throw new Error("You do not have access to this proposal.");
  }

  const proposal = await prisma.agencyProposal.findUniqueOrThrow({
    where: { id: input.proposalId },
    include: { company: { select: { name: true } } },
  });

  const latestSent = await prisma.agencyProposalVersion.findFirst({
    where: { proposalId: input.proposalId, publishedAt: { not: null } },
    orderBy: { versionNumber: "desc" },
    select: { id: true },
  });

  const version = await prisma.agencyProposalVersion.findFirst({
    where: input.versionId
      ? { id: input.versionId, proposalId: input.proposalId }
      : { proposalId: input.proposalId, publishedAt: { not: null } },
    orderBy: { versionNumber: "desc" },
    include: {
      sections: { orderBy: { position: "asc" } },
      scopeItems: { orderBy: { position: "asc" } },
      deliverables: { orderBy: { position: "asc" } },
      lineItems: { orderBy: { position: "asc" } },
    },
  });

  await recordProposalView({
    proposalId: input.proposalId,
    portalUserId: input.portalUserId,
  });

  return toClientProposalDto({
    proposal,
    version,
    latestSentVersionId: latestSent?.id ?? null,
    role: access.role,
    statusAllowsDecision: PROPOSAL_CLIENT_DECISION_STATUSES.has(proposal.status),
  });
}
