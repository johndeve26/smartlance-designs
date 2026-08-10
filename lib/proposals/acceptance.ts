import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { recordProposalActivity } from "@/lib/proposals/activity";
import { isProposalExpired } from "@/lib/proposals/display";
import { calculateVersionPricing } from "@/lib/proposals/pricing";
import { getCurrentSentVersion } from "@/lib/proposals/versions";

function computeScopeHash(input: {
  versionId: string;
  selectedOptionalItemIds: string[];
  totalAmount: string;
}) {
  const payload = JSON.stringify({
    versionId: input.versionId,
    selectedOptionalItemIds: [...input.selectedOptionalItemIds].sort(),
    totalAmount: input.totalAmount,
  });
  return createHash("sha256").update(payload).digest("hex");
}

async function assertDecisionMaker(input: {
  proposalId: string;
  portalUserId: string;
  contactId: string;
}) {
  const access = await prisma.agencyProposalClientAccess.findFirst({
    where: {
      proposalId: input.proposalId,
      portalUserId: input.portalUserId,
      contactId: input.contactId,
      revokedAt: null,
      role: "DECISION_MAKER",
    },
  });
  if (!access) {
    throw new Error("You are not authorized to make decisions on this proposal.");
  }
  return access;
}

export async function acceptProposal(input: {
  proposalId: string;
  portalUserId: string;
  contactId: string;
  selectedOptionalItemIds: string[];
  termsAcknowledged: boolean;
}) {
  if (!input.termsAcknowledged) {
    throw new Error("Terms acknowledgment is required.");
  }

  await assertDecisionMaker(input);

  const result = await prisma.$transaction(async (tx) => {
    const proposal = await tx.agencyProposal.findUniqueOrThrow({
      where: { id: input.proposalId },
    });

    if (proposal.status !== "SENT" && proposal.status !== "CHANGES_REQUESTED") {
      throw new Error("This proposal is not open for acceptance.");
    }
    if (isProposalExpired(proposal.expiresAt)) {
      throw new Error("This proposal has expired.");
    }

    const existing = await tx.agencyProposalAcceptance.findUnique({
      where: { proposalId: input.proposalId },
    });
    if (existing) {
      return { acceptance: existing, idempotent: true as const };
    }

    const version = await tx.agencyProposalVersion.findFirst({
      where: {
        proposalId: input.proposalId,
        publishedAt: { not: null },
      },
      orderBy: { versionNumber: "desc" },
      include: { lineItems: true },
    });

    if (!version) {
      throw new Error("No sent proposal version found.");
    }

    const optionalIds = new Set(
      version.lineItems.filter((item) => item.isOptional).map((item) => item.id),
    );
    const requiredOptionalDefaults = version.lineItems
      .filter((item) => item.isOptional && item.isSelectedByDefault)
      .map((item) => item.id);

    const selected = new Set([
      ...requiredOptionalDefaults,
      ...input.selectedOptionalItemIds,
    ]);

    for (const id of selected) {
      if (!optionalIds.has(id)) {
        throw new Error("Invalid optional item selection.");
      }
    }

    const pricing = calculateVersionPricing({
      lineItems: version.lineItems.map((item) => ({
        id: item.id,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        amount: Number(item.amount),
        isOptional: item.isOptional,
        type: item.type,
      })),
      discountAmount: version.discountAmount ? Number(version.discountAmount) : null,
      taxAmount: version.taxAmount ? Number(version.taxAmount) : null,
      selectedOptionalItemIds: [...selected],
    });

    const selectedIds = [...selected];
    const scopeHash = computeScopeHash({
      versionId: version.id,
      selectedOptionalItemIds: selectedIds,
      totalAmount: pricing.totalAmount.toString(),
    });

    const acceptance = await tx.agencyProposalAcceptance.create({
      data: {
        proposalId: input.proposalId,
        acceptedVersionId: version.id,
        portalUserId: input.portalUserId,
        contactId: input.contactId,
        acceptedTotal: pricing.totalAmount,
        currency: version.currency,
        selectedOptionalItemIds: selectedIds,
        scopeHash,
        termsAcknowledged: true,
      },
    });

    const updated = await tx.agencyProposal.updateMany({
      where: {
        id: input.proposalId,
        status: { in: ["SENT", "CHANGES_REQUESTED"] },
      },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
        acceptedVersionId: version.id,
      },
    });

    if (updated.count !== 1) {
      throw new Error("Proposal status changed concurrently.");
    }

    await recordProposalActivity(
      {
        proposalId: input.proposalId,
        type: "ACCEPTED",
        summary: "Proposal accepted by client.",
        actorPortalUserId: input.portalUserId,
        clientVisible: true,
        entityType: "AgencyProposalAcceptance",
        entityId: acceptance.id,
      },
      tx,
    );

    return { acceptance, idempotent: false as const };
  });

  return result;
}

export async function declineProposal(input: {
  proposalId: string;
  portalUserId: string;
  contactId: string;
  comment?: string | null;
}) {
  await assertDecisionMaker(input);

  const version = await getCurrentSentVersion(input.proposalId);
  if (!version) throw new Error("No sent proposal version found.");

  await prisma.$transaction(async (tx) => {
    const proposal = await tx.agencyProposal.findUniqueOrThrow({
      where: { id: input.proposalId },
    });
    if (proposal.status !== "SENT" && proposal.status !== "CHANGES_REQUESTED") {
      throw new Error("This proposal is not open for decline.");
    }

    await tx.agencyProposalClientResponse.create({
      data: {
        proposalId: input.proposalId,
        versionId: version.id,
        portalUserId: input.portalUserId,
        contactId: input.contactId,
        responseType: "DECLINED",
        comment: input.comment?.trim() || null,
      },
    });

    const updated = await tx.agencyProposal.updateMany({
      where: {
        id: input.proposalId,
        status: { in: ["SENT", "CHANGES_REQUESTED"] },
      },
      data: { status: "DECLINED", declinedAt: new Date() },
    });
    if (updated.count !== 1) {
      throw new Error("Proposal status changed concurrently.");
    }

    await recordProposalActivity(
      {
        proposalId: input.proposalId,
        type: "DECLINED",
        summary: "Proposal declined by client.",
        actorPortalUserId: input.portalUserId,
        clientVisible: true,
      },
      tx,
    );
  });

  return { ok: true as const };
}

export async function requestProposalChanges(input: {
  proposalId: string;
  portalUserId: string;
  contactId: string;
  comment: string;
}) {
  await assertDecisionMaker(input);

  const version = await getCurrentSentVersion(input.proposalId);
  if (!version) throw new Error("No sent proposal version found.");

  await prisma.$transaction(async (tx) => {
    const proposal = await tx.agencyProposal.findUniqueOrThrow({
      where: { id: input.proposalId },
    });
    if (proposal.status !== "SENT" && proposal.status !== "CHANGES_REQUESTED") {
      throw new Error("This proposal is not open for change requests.");
    }

    await tx.agencyProposalClientResponse.create({
      data: {
        proposalId: input.proposalId,
        versionId: version.id,
        portalUserId: input.portalUserId,
        contactId: input.contactId,
        responseType: "CHANGES_REQUESTED",
        comment: input.comment.trim(),
      },
    });

    const updated = await tx.agencyProposal.updateMany({
      where: {
        id: input.proposalId,
        status: { in: ["SENT", "CHANGES_REQUESTED"] },
      },
      data: { status: "CHANGES_REQUESTED" },
    });
    if (updated.count !== 1) {
      throw new Error("Proposal status changed concurrently.");
    }

    await recordProposalActivity(
      {
        proposalId: input.proposalId,
        type: "CHANGES_REQUESTED",
        summary: "Client requested changes.",
        actorPortalUserId: input.portalUserId,
        clientVisible: true,
      },
      tx,
    );
  });

  return { ok: true as const };
}
