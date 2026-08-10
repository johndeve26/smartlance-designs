import { prisma } from "@/lib/db";
import { recordContractActivity } from "@/lib/contracts/activity";
import { computeContractContentHash } from "@/lib/contracts/content-hash";
import { CONTRACT_MAX_CONTENT_LENGTH } from "@/lib/contracts/constants";

export function isVersionMutable(version: { publishedAt: Date | null }) {
  return version.publishedAt == null;
}

export async function saveDraftVersion(input: {
  contractId: string;
  versionId: string;
  title: string;
  content: string;
  actorUserId: string;
}) {
  if (input.content.length > CONTRACT_MAX_CONTENT_LENGTH) {
    throw new Error("Contract content is too large.");
  }

  const version = await prisma.agencyContractVersion.findUniqueOrThrow({
    where: { id: input.versionId },
    include: { contract: true },
  });

  if (version.contractId !== input.contractId) {
    throw new Error("Version does not belong to this contract.");
  }
  if (!isVersionMutable(version)) {
    throw new Error("Published contract versions cannot be edited.");
  }
  if (version.contract.status === "SIGNED") {
    throw new Error("Signed contracts cannot be edited.");
  }

  const contentHash = computeContractContentHash({
    contractId: input.contractId,
    versionNumber: version.versionNumber,
    content: input.content,
    proposalAcceptanceId: version.proposalAcceptanceId,
    proposalScopeHash: version.proposalScopeHash,
    resolvedVariables: (version.resolvedVariables as Record<string, string>) ?? {},
  });

  await prisma.agencyContractVersion.update({
    where: { id: input.versionId },
    data: {
      title: input.title.trim(),
      content: input.content,
      contentHash,
    },
  });

  await prisma.agencyContract.update({
    where: { id: input.contractId },
    data: { currentVersionId: input.versionId },
  });

  return prisma.agencyContractVersion.findUniqueOrThrow({ where: { id: input.versionId } });
}

export async function createContractVersion(input: {
  contractId: string;
  createdById: string;
  sourceVersionId?: string;
}) {
  const source = await prisma.agencyContractVersion.findFirst({
    where: input.sourceVersionId
      ? { id: input.sourceVersionId, contractId: input.contractId }
      : { contractId: input.contractId },
    orderBy: { versionNumber: "desc" },
  });
  if (!source) throw new Error("No source version found.");

  const contract = await prisma.agencyContract.findUniqueOrThrow({
    where: { id: input.contractId },
  });

  const maxAttempts = 5;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const latest = await prisma.agencyContractVersion.findFirst({
      where: { contractId: input.contractId },
      orderBy: { versionNumber: "desc" },
    });
    const versionNumber = (latest?.versionNumber ?? 0) + 1;

    try {
      const contentHash = computeContractContentHash({
        contractId: input.contractId,
        versionNumber,
        content: source.content,
        proposalAcceptanceId: source.proposalAcceptanceId,
        proposalScopeHash: source.proposalScopeHash,
        resolvedVariables: (source.resolvedVariables as Record<string, string>) ?? {},
      });

      const version = await prisma.agencyContractVersion.create({
        data: {
          contractId: input.contractId,
          versionNumber,
          title: source.title,
          content: source.content,
          resolvedVariables: source.resolvedVariables ?? undefined,
          sourceTemplateId: source.sourceTemplateId,
          sourceTemplateVersionId: source.sourceTemplateVersionId,
          proposalAcceptanceId: source.proposalAcceptanceId,
          proposalScopeHash: source.proposalScopeHash,
          contentHash,
          createdById: input.createdById,
        },
      });

      const signers = await prisma.agencyContractSigner.findMany({
        where: { contractId: input.contractId, contractVersionId: source.id },
      });

      for (const signer of signers) {
        await prisma.agencyContractSigner.create({
          data: {
            contractId: input.contractId,
            contractVersionId: version.id,
            signerType: signer.signerType,
            portalUserId: signer.portalUserId,
            adminUserId: signer.adminUserId,
            contactId: signer.contactId,
            nameSnapshot: signer.nameSnapshot,
            emailSnapshot: signer.emailSnapshot,
            companySnapshot: signer.companySnapshot,
            role: signer.role,
            signingOrder: signer.signingOrder,
            isRequired: signer.isRequired,
            status: "PENDING",
          },
        });
      }

      await prisma.agencyContract.update({
        where: { id: input.contractId },
        data: {
          currentVersionId: version.id,
          status:
            ["SENT", "PARTIALLY_SIGNED", "CORRECTION_REQUESTED", "DECLINED"].includes(
              contract.status,
            )
              ? "DRAFT"
              : contract.status,
        },
      });

      await recordContractActivity({
        contractId: input.contractId,
        type: "VERSION_CREATED",
        summary: `Contract version ${versionNumber} created.`,
        actorUserId: input.createdById,
        entityType: "AgencyContractVersion",
        entityId: version.id,
      });

      return version;
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "P2002" && attempt < maxAttempts - 1) continue;
      throw err;
    }
  }

  throw new Error("Failed to create contract version.");
}

export async function publishContractVersion(input: {
  contractId: string;
  versionId: string;
  actorUserId: string;
}) {
  const version = await prisma.agencyContractVersion.findUniqueOrThrow({
    where: { id: input.versionId },
    include: { contract: true },
  });

  if (version.contractId !== input.contractId) {
    throw new Error("Version does not belong to this contract.");
  }
  if (version.publishedAt) return version;
  if (!version.content.trim()) throw new Error("Contract content is required.");

  const now = new Date();
  return prisma.agencyContractVersion.update({
    where: { id: input.versionId },
    data: { publishedAt: now },
  });
}

export async function getCurrentSentVersion(contractId: string) {
  return prisma.agencyContractVersion.findFirst({
    where: { contractId, publishedAt: { not: null } },
    orderBy: { versionNumber: "desc" },
    include: {
      signers: true,
      signatures: true,
    },
  });
}
