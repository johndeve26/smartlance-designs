import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { recordContractActivity } from "@/lib/contracts/activity";
import {
  CONTRACT_CONSENT_TEXT,
  CONTRACT_CONSENT_VERSION,
} from "@/lib/contracts/constants";
import { hashClientEvidence } from "@/lib/contracts/content-hash";
import { isContractExpired } from "@/lib/contracts/display";
import { getCurrentSentVersion } from "@/lib/contracts/versions";

async function getRequestEvidence() {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ip = forwarded || h.get("x-real-ip") || "";
    const userAgent = h.get("user-agent") || "";
    return {
      ipHash: hashClientEvidence(ip),
      userAgentHash: hashClientEvidence(userAgent),
    };
  } catch {
    return {
      ipHash: hashClientEvidence("integration-test"),
      userAgentHash: hashClientEvidence("integration-test"),
    };
  }
}

async function assertClientSigner(input: {
  contractId: string;
  versionId: string;
  portalUserId: string;
  contactId: string;
}) {
  const signer = await prisma.agencyContractSigner.findFirst({
    where: {
      contractId: input.contractId,
      contractVersionId: input.versionId,
      portalUserId: input.portalUserId,
      contactId: input.contactId,
      signerType: "CLIENT",
      role: "CLIENT_SIGNATORY",
      isRequired: true,
    },
  });
  if (!signer || signer.status === "SIGNED") {
    throw new Error("You are not authorized to sign this contract.");
  }
  return signer;
}

async function assertAgencySigner(input: {
  contractId: string;
  versionId: string;
  adminUserId: string;
}) {
  const signer = await prisma.agencyContractSigner.findFirst({
    where: {
      contractId: input.contractId,
      contractVersionId: input.versionId,
      adminUserId: input.adminUserId,
      signerType: "AGENCY",
      role: "AGENCY_SIGNATORY",
      isRequired: true,
    },
  });
  if (!signer || signer.status === "SIGNED") {
    throw new Error("You are not authorized to sign this contract.");
  }
  return signer;
}

function assertSignableContract(status: string, expiresAt: Date | null) {
  if (!["SENT", "PARTIALLY_SIGNED"].includes(status)) {
    throw new Error("This contract is not open for signing.");
  }
  if (isContractExpired(expiresAt)) {
    throw new Error("This contract has expired.");
  }
}

export async function signContractAsClient(input: {
  contractId: string;
  portalUserId: string;
  contactId: string;
  consentAcknowledged: boolean;
  typedSignatureName: string;
  signerTitle?: string | null;
}) {
  if (!input.consentAcknowledged) {
    throw new Error("Electronic signature consent is required.");
  }
  if (!input.typedSignatureName.trim()) {
    throw new Error("Typed signature name is required.");
  }

  const evidence = await getRequestEvidence();

  return prisma.$transaction(async (tx) => {
    const contract = await tx.agencyContract.findUniqueOrThrow({
      where: { id: input.contractId },
    });

    if (contract.voidedAt) throw new Error("This contract has been voided.");

    await tx.$executeRaw`SELECT id FROM "AgencyContract" WHERE id = ${input.contractId} FOR UPDATE`;

    const version = await tx.agencyContractVersion.findFirst({
      where: { contractId: input.contractId, publishedAt: { not: null } },
      orderBy: { versionNumber: "desc" },
    });
    if (!version || version.id !== contract.currentVersionId) {
      throw new Error("This contract version is no longer current.");
    }

    const signer = await tx.agencyContractSigner.findFirst({
      where: {
        contractId: input.contractId,
        contractVersionId: version.id,
        portalUserId: input.portalUserId,
        contactId: input.contactId,
        signerType: "CLIENT",
        role: "CLIENT_SIGNATORY",
        isRequired: true,
      },
    });
    if (!signer) {
      throw new Error("You are not authorized to sign this contract.");
    }

    const existing = await tx.agencyContractSignature.findUnique({
      where: {
        contractVersionId_signerId: {
          contractVersionId: version.id,
          signerId: signer.id,
        },
      },
    });
    if (existing) {
      return {
        signature: existing,
        idempotent: true as const,
        fullySigned: contract.status === "SIGNED",
      };
    }

    assertSignableContract(contract.status, contract.expiresAt);
    if (signer.status === "SIGNED") {
      throw new Error("You are not authorized to sign this contract.");
    }

    const contact = await tx.crmContact.findUniqueOrThrow({ where: { id: input.contactId } });

    const signature = await tx.agencyContractSignature.create({
      data: {
        contractId: input.contractId,
        contractVersionId: version.id,
        signerId: signer.id,
        signerPortalUserId: input.portalUserId,
        contactId: input.contactId,
        signerNameSnapshot: contact.displayName ?? contact.email ?? signer.nameSnapshot,
        signerEmailSnapshot: contact.email ?? signer.emailSnapshot,
        typedSignatureName: input.typedSignatureName.trim(),
        signerTitle: input.signerTitle?.trim() || null,
        consentTextSnapshot: CONTRACT_CONSENT_TEXT,
        consentVersion: CONTRACT_CONSENT_VERSION,
        contractContentHash: version.contentHash,
        ipHash: evidence.ipHash,
        userAgentHash: evidence.userAgentHash,
      },
    });

    await tx.agencyContractSigner.update({
      where: { id: signer.id },
      data: { status: "SIGNED", signedAt: new Date() },
    });

    const requiredSigners = await tx.agencyContractSigner.findMany({
      where: {
        contractId: input.contractId,
        contractVersionId: version.id,
        isRequired: true,
      },
    });

    const allSigned = requiredSigners.every(
      (s) => s.id === signer.id || s.status === "SIGNED",
    );

    if (allSigned) {
      await tx.agencyContract.updateMany({
        where: { id: input.contractId, status: { in: ["SENT", "PARTIALLY_SIGNED"] } },
        data: {
          status: "SIGNED",
          fullySignedAt: new Date(),
          signedVersionId: version.id,
        },
      });
    } else {
      await tx.agencyContract.updateMany({
        where: { id: input.contractId, status: "SENT" },
        data: { status: "PARTIALLY_SIGNED" },
      });
    }

    await recordContractActivity(
      {
        contractId: input.contractId,
        type: "SIGNATURE_COMPLETED",
        summary: `${signer.nameSnapshot} signed the contract.`,
        actorPortalUserId: input.portalUserId,
        clientVisible: true,
        entityType: "AgencyContractSignature",
        entityId: signature.id,
      },
      tx,
    );

    if (allSigned) {
      await recordContractActivity(
        {
          contractId: input.contractId,
          type: "CONTRACT_FULLY_SIGNED",
          summary: "Contract fully signed.",
          actorPortalUserId: input.portalUserId,
          clientVisible: true,
        },
        tx,
      );
    }

    return { signature, idempotent: false as const, fullySigned: allSigned };
  });
}

export async function signContractAsAdmin(input: {
  contractId: string;
  adminUserId: string;
  consentAcknowledged: boolean;
  typedSignatureName: string;
  signerTitle?: string | null;
}) {
  if (!input.consentAcknowledged) throw new Error("Consent is required.");

  const evidence = await getRequestEvidence();

  return prisma.$transaction(async (tx) => {
    const contract = await tx.agencyContract.findUniqueOrThrow({
      where: { id: input.contractId },
    });
    assertSignableContract(contract.status, contract.expiresAt);
    if (contract.voidedAt) throw new Error("Contract voided.");

    const version = await tx.agencyContractVersion.findFirst({
      where: { contractId: input.contractId, publishedAt: { not: null } },
      orderBy: { versionNumber: "desc" },
    });
    if (!version || version.id !== contract.currentVersionId) {
      throw new Error("Contract version superseded.");
    }

    const signer = await assertAgencySigner({
      contractId: input.contractId,
      versionId: version.id,
      adminUserId: input.adminUserId,
    });

    const existing = await tx.agencyContractSignature.findUnique({
      where: {
        contractVersionId_signerId: { contractVersionId: version.id, signerId: signer.id },
      },
    });
    if (existing) return { signature: existing, idempotent: true as const, fullySigned: contract.status === "SIGNED" };

    const admin = await tx.adminUser.findUniqueOrThrow({ where: { id: input.adminUserId } });

    const signature = await tx.agencyContractSignature.create({
      data: {
        contractId: input.contractId,
        contractVersionId: version.id,
        signerId: signer.id,
        signerAdminUserId: input.adminUserId,
        signerNameSnapshot: admin.name,
        signerEmailSnapshot: admin.email,
        typedSignatureName: input.typedSignatureName.trim(),
        signerTitle: input.signerTitle?.trim() || null,
        consentTextSnapshot: CONTRACT_CONSENT_TEXT,
        consentVersion: CONTRACT_CONSENT_VERSION,
        contractContentHash: version.contentHash,
        ipHash: evidence.ipHash,
        userAgentHash: evidence.userAgentHash,
      },
    });

    await tx.agencyContractSigner.update({
      where: { id: signer.id },
      data: { status: "SIGNED", signedAt: new Date() },
    });

    const requiredSigners = await tx.agencyContractSigner.findMany({
      where: { contractId: input.contractId, contractVersionId: version.id, isRequired: true },
    });
    const allSigned = requiredSigners.every(
      (s) => s.id === signer.id || s.status === "SIGNED",
    );

    if (allSigned) {
      await tx.agencyContract.updateMany({
        where: { id: input.contractId, status: { in: ["SENT", "PARTIALLY_SIGNED"] } },
        data: { status: "SIGNED", fullySignedAt: new Date(), signedVersionId: version.id },
      });
    } else {
      await tx.agencyContract.updateMany({
        where: { id: input.contractId, status: "SENT" },
        data: { status: "PARTIALLY_SIGNED" },
      });
    }

    await recordContractActivity(
      {
        contractId: input.contractId,
        type: "SIGNATURE_COMPLETED",
        summary: `${admin.name} signed the contract.`,
        actorUserId: input.adminUserId,
        entityType: "AgencyContractSignature",
        entityId: signature.id,
      },
      tx,
    );

    return { signature, idempotent: false as const, fullySigned: allSigned };
  });
}

export async function declineContractAsClient(input: {
  contractId: string;
  portalUserId: string;
  contactId: string;
  comment?: string | null;
}) {
  const version = await getCurrentSentVersion(input.contractId);
  if (!version) throw new Error("No sent contract version.");

  await assertClientSigner({
    contractId: input.contractId,
    versionId: version.id,
    portalUserId: input.portalUserId,
    contactId: input.contactId,
  });

  await prisma.$transaction(async (tx) => {
    await tx.agencyContractResponse.create({
      data: {
        contractId: input.contractId,
        versionId: version.id,
        portalUserId: input.portalUserId,
        contactId: input.contactId,
        responseType: "DECLINED",
        comment: input.comment?.trim() || null,
      },
    });

    await tx.agencyContractSigner.updateMany({
      where: {
        contractId: input.contractId,
        contractVersionId: version.id,
        portalUserId: input.portalUserId,
      },
      data: { status: "DECLINED", declinedAt: new Date() },
    });

    await tx.agencyContract.updateMany({
      where: {
        id: input.contractId,
        status: { in: ["SENT", "PARTIALLY_SIGNED", "CORRECTION_REQUESTED"] },
      },
      data: { status: "DECLINED", declinedAt: new Date() },
    });

    await recordContractActivity(
      {
        contractId: input.contractId,
        type: "CONTRACT_DECLINED",
        summary: "Contract declined by signer.",
        actorPortalUserId: input.portalUserId,
        clientVisible: true,
      },
      tx,
    );
  });

  return { ok: true as const };
}

export async function requestContractCorrection(input: {
  contractId: string;
  portalUserId: string;
  contactId: string;
  comment: string;
}) {
  const version = await getCurrentSentVersion(input.contractId);
  if (!version) throw new Error("No sent contract version.");

  await assertClientSigner({
    contractId: input.contractId,
    versionId: version.id,
    portalUserId: input.portalUserId,
    contactId: input.contactId,
  });

  await prisma.$transaction(async (tx) => {
    await tx.agencyContractResponse.create({
      data: {
        contractId: input.contractId,
        versionId: version.id,
        portalUserId: input.portalUserId,
        contactId: input.contactId,
        responseType: "CORRECTION_REQUESTED",
        comment: input.comment.trim(),
      },
    });

    await tx.agencyContract.updateMany({
      where: {
        id: input.contractId,
        status: { in: ["SENT", "PARTIALLY_SIGNED"] },
      },
      data: { status: "CORRECTION_REQUESTED" },
    });

    await recordContractActivity(
      {
        contractId: input.contractId,
        type: "CORRECTION_REQUESTED",
        summary: "Signer requested correction.",
        actorPortalUserId: input.portalUserId,
        clientVisible: true,
      },
      tx,
    );
  });

  return { ok: true as const };
}
