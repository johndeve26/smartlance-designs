import type { AgencyContractStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { recordContractActivity } from "@/lib/contracts/activity";
import { getContractById } from "@/lib/contracts/contracts";
import { isContractExpired } from "@/lib/contracts/display";

const ALLOWED: Record<AgencyContractStatus, AgencyContractStatus[]> = {
  DRAFT: ["READY_FOR_REVIEW", "SENT", "ARCHIVED"],
  READY_FOR_REVIEW: ["DRAFT", "SENT", "ARCHIVED"],
  SENT: ["PARTIALLY_SIGNED", "SIGNED", "CORRECTION_REQUESTED", "DECLINED", "EXPIRED", "VOIDED", "ARCHIVED"],
  PARTIALLY_SIGNED: ["SIGNED", "CORRECTION_REQUESTED", "DECLINED", "EXPIRED", "VOIDED", "ARCHIVED"],
  SIGNED: ["ARCHIVED"],
  CORRECTION_REQUESTED: ["DRAFT", "SENT", "DECLINED", "EXPIRED", "VOIDED", "ARCHIVED"],
  DECLINED: ["ARCHIVED", "DRAFT"],
  EXPIRED: ["ARCHIVED", "DRAFT"],
  VOIDED: ["ARCHIVED"],
  ARCHIVED: [],
};

async function transition(input: {
  contractId: string;
  to: AgencyContractStatus;
  actorUserId?: string;
  actorPortalUserId?: string;
  summary: string;
  activityType: Parameters<typeof recordContractActivity>[0]["type"];
  extra?: Partial<{
    sentAt: Date;
    fullySignedAt: Date;
    declinedAt: Date;
    voidedAt: Date;
    voidReason: string;
    signedVersionId: string;
  }>;
}) {
  const contract = await prisma.agencyContract.findUniqueOrThrow({
    where: { id: input.contractId },
  });

  const allowed = ALLOWED[contract.status];
  if (!allowed.includes(input.to)) {
    throw new Error(`Cannot transition contract from ${contract.status} to ${input.to}.`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.agencyContract.update({
      where: { id: input.contractId },
      data: {
        status: input.to,
        sentAt: input.extra?.sentAt ?? contract.sentAt,
        fullySignedAt: input.extra?.fullySignedAt ?? contract.fullySignedAt,
        declinedAt: input.extra?.declinedAt ?? contract.declinedAt,
        voidedAt: input.extra?.voidedAt ?? contract.voidedAt,
        voidReason: input.extra?.voidReason ?? contract.voidReason,
        signedVersionId: input.extra?.signedVersionId ?? contract.signedVersionId,
      },
    });

    await recordContractActivity(
      {
        contractId: input.contractId,
        type: input.activityType,
        summary: input.summary,
        actorUserId: input.actorUserId,
        actorPortalUserId: input.actorPortalUserId,
        clientVisible: true,
      },
      tx,
    );
  });

  return getContractById(input.contractId);
}

export async function submitContractForReview(contractId: string, actorUserId: string) {
  return transition({
    contractId,
    to: "READY_FOR_REVIEW",
    actorUserId,
    summary: "Submitted for review.",
    activityType: "CONTRACT_CREATED",
  });
}

export async function returnContractToDraft(contractId: string, actorUserId: string) {
  return transition({
    contractId,
    to: "DRAFT",
    actorUserId,
    summary: "Returned to draft.",
    activityType: "CONTRACT_CREATED",
  });
}

export async function markContractSent(input: {
  contractId: string;
  actorUserId: string;
  versionId: string;
}) {
  return transition({
    contractId: input.contractId,
    to: "SENT",
    actorUserId: input.actorUserId,
    summary: "Contract sent to signers.",
    activityType: "CONTRACT_SENT",
    extra: { sentAt: new Date() },
  });
}

export async function markPartiallySigned(contractId: string) {
  const contract = await prisma.agencyContract.findUniqueOrThrow({ where: { id: contractId } });
  if (contract.status === "PARTIALLY_SIGNED") return contract;
  if (contract.status !== "SENT") {
    throw new Error("Contract is not in a signable state.");
  }
  return transition({
    contractId,
    to: "PARTIALLY_SIGNED",
    summary: "Additional signature recorded.",
    activityType: "SIGNATURE_COMPLETED",
  });
}

export async function markContractFullySigned(input: {
  contractId: string;
  versionId: string;
  actorPortalUserId?: string;
  actorUserId?: string;
}) {
  return transition({
    contractId: input.contractId,
    to: "SIGNED",
    actorPortalUserId: input.actorPortalUserId,
    actorUserId: input.actorUserId,
    summary: "Contract fully signed.",
    activityType: "CONTRACT_FULLY_SIGNED",
    extra: { fullySignedAt: new Date(), signedVersionId: input.versionId },
  });
}

export async function markCorrectionRequested(input: {
  contractId: string;
  actorPortalUserId: string;
}) {
  return transition({
    contractId: input.contractId,
    to: "CORRECTION_REQUESTED",
    actorPortalUserId: input.actorPortalUserId,
    summary: "Signer requested correction.",
    activityType: "CORRECTION_REQUESTED",
  });
}

export async function markContractDeclined(input: {
  contractId: string;
  actorPortalUserId?: string;
  actorUserId?: string;
}) {
  return transition({
    contractId: input.contractId,
    to: "DECLINED",
    actorPortalUserId: input.actorPortalUserId,
    actorUserId: input.actorUserId,
    summary: "Contract declined.",
    activityType: "CONTRACT_DECLINED",
    extra: { declinedAt: new Date() },
  });
}

export async function voidContract(input: {
  contractId: string;
  actorUserId: string;
  reason: string;
}) {
  const contract = await prisma.agencyContract.findUniqueOrThrow({ where: { id: input.contractId } });
  if (contract.status === "SIGNED") {
    throw new Error("Fully signed contracts cannot be voided. Use administrative notes or a new agreement.");
  }

  return transition({
    contractId: input.contractId,
    to: "VOIDED",
    actorUserId: input.actorUserId,
    summary: "Contract voided.",
    activityType: "CONTRACT_VOIDED",
    extra: { voidedAt: new Date(), voidReason: input.reason.trim() },
  });
}

export async function archiveContract(contractId: string, actorUserId: string) {
  return transition({
    contractId,
    to: "ARCHIVED",
    actorUserId,
    summary: "Contract archived.",
    activityType: "CONTRACT_ARCHIVED",
  });
}

export async function expireContractIfNeeded(contractId: string) {
  const contract = await prisma.agencyContract.findUniqueOrThrow({ where: { id: contractId } });
  if (!["SENT", "PARTIALLY_SIGNED", "CORRECTION_REQUESTED"].includes(contract.status)) {
    return contract;
  }
  if (!isContractExpired(contract.expiresAt)) return contract;

  await prisma.agencyContract.update({
    where: { id: contractId },
    data: { status: "EXPIRED" },
  });

  return getContractById(contractId);
}

export { isContractExpired };
