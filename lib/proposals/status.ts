import type { AgencyProposalStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { recordProposalActivity } from "@/lib/proposals/activity";
import { getProposalById } from "@/lib/proposals/proposals";
import { isProposalExpired } from "@/lib/proposals/display";

const ALLOWED: Record<AgencyProposalStatus, AgencyProposalStatus[]> = {
  DRAFT: ["INTERNAL_REVIEW", "SENT", "ARCHIVED"],
  INTERNAL_REVIEW: ["DRAFT", "SENT", "ARCHIVED"],
  SENT: ["CHANGES_REQUESTED", "ACCEPTED", "DECLINED", "EXPIRED", "ARCHIVED"],
  CHANGES_REQUESTED: ["DRAFT", "SENT", "DECLINED", "EXPIRED", "ARCHIVED"],
  ACCEPTED: ["ARCHIVED"],
  DECLINED: ["ARCHIVED", "DRAFT"],
  EXPIRED: ["ARCHIVED", "DRAFT"],
  ARCHIVED: [],
};

async function transitionStatus(input: {
  proposalId: string;
  to: AgencyProposalStatus;
  actorUserId?: string;
  actorPortalUserId?: string;
  activitySummary: string;
  extra?: {
    sentAt?: Date;
    acceptedAt?: Date;
    declinedAt?: Date;
    acceptedVersionId?: string;
  };
}) {
  const proposal = await prisma.agencyProposal.findUniqueOrThrow({
    where: { id: input.proposalId },
  });

  const allowed = ALLOWED[proposal.status];
  if (!allowed.includes(input.to)) {
    throw new Error(`Cannot transition proposal from ${proposal.status} to ${input.to}.`);
  }

  if (input.to === "ACCEPTED" && isProposalExpired(proposal.expiresAt)) {
    throw new Error("This proposal has expired.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.agencyProposal.update({
      where: { id: input.proposalId },
      data: {
        status: input.to,
        sentAt: input.extra?.sentAt ?? proposal.sentAt,
        acceptedAt: input.extra?.acceptedAt ?? proposal.acceptedAt,
        declinedAt: input.extra?.declinedAt ?? proposal.declinedAt,
        acceptedVersionId: input.extra?.acceptedVersionId ?? proposal.acceptedVersionId,
      },
    });

    await recordProposalActivity(
      {
        proposalId: input.proposalId,
        type:
          input.to === "SENT"
            ? "SENT"
            : input.to === "ACCEPTED"
              ? "ACCEPTED"
              : input.to === "DECLINED"
                ? "DECLINED"
                : input.to === "CHANGES_REQUESTED"
                  ? "CHANGES_REQUESTED"
                  : "PROPOSAL_CREATED",
        summary: input.activitySummary,
        actorUserId: input.actorUserId,
        actorPortalUserId: input.actorPortalUserId,
        clientVisible: ["SENT", "ACCEPTED", "DECLINED", "CHANGES_REQUESTED"].includes(input.to),
      },
      tx,
    );
  });

  return getProposalById(input.proposalId);
}

export async function submitForInternalReview(proposalId: string, actorUserId: string) {
  return transitionStatus({
    proposalId,
    to: "INTERNAL_REVIEW",
    actorUserId,
    activitySummary: "Submitted for internal review.",
  });
}

export async function returnProposalToDraft(proposalId: string, actorUserId: string) {
  return transitionStatus({
    proposalId,
    to: "DRAFT",
    actorUserId,
    activitySummary: "Returned to draft.",
  });
}

export async function markProposalSent(input: {
  proposalId: string;
  actorUserId: string;
  versionId: string;
}) {
  return transitionStatus({
    proposalId: input.proposalId,
    to: "SENT",
    actorUserId: input.actorUserId,
    activitySummary: "Proposal sent to client.",
    extra: {
      sentAt: new Date(),
      acceptedVersionId: undefined,
    },
  });
}

export async function markChangesRequested(input: {
  proposalId: string;
  actorPortalUserId: string;
}) {
  return transitionStatus({
    proposalId: input.proposalId,
    to: "CHANGES_REQUESTED",
    actorPortalUserId: input.actorPortalUserId,
    activitySummary: "Client requested changes.",
  });
}

export async function markProposalAccepted(input: {
  proposalId: string;
  actorPortalUserId: string;
  versionId: string;
}) {
  return transitionStatus({
    proposalId: input.proposalId,
    to: "ACCEPTED",
    actorPortalUserId: input.actorPortalUserId,
    activitySummary: "Proposal accepted by client.",
    extra: {
      acceptedAt: new Date(),
      acceptedVersionId: input.versionId,
    },
  });
}

export async function markProposalDeclined(input: {
  proposalId: string;
  actorPortalUserId: string;
}) {
  return transitionStatus({
    proposalId: input.proposalId,
    to: "DECLINED",
    actorPortalUserId: input.actorPortalUserId,
    activitySummary: "Proposal declined by client.",
    extra: { declinedAt: new Date() },
  });
}

export async function archiveProposal(proposalId: string, actorUserId: string) {
  return transitionStatus({
    proposalId,
    to: "ARCHIVED",
    actorUserId,
    activitySummary: "Proposal archived.",
  });
}

export async function expireProposalIfNeeded(proposalId: string) {
  const proposal = await prisma.agencyProposal.findUniqueOrThrow({
    where: { id: proposalId },
  });
  if (proposal.status !== "SENT" && proposal.status !== "CHANGES_REQUESTED") {
    return proposal;
  }
  if (!isProposalExpired(proposal.expiresAt)) return proposal;

  await prisma.agencyProposal.update({
    where: { id: proposalId },
    data: { status: "EXPIRED" },
  });

  return getProposalById(proposalId);
}
