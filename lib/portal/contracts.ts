import { prisma } from "@/lib/db";
import { CONTRACT_SIGNABLE_STATUSES } from "@/lib/contracts/constants";
import { isContractExpired } from "@/lib/contracts/display";
import {
  assertContractAccess,
  getSignerForPortalUser,
  listAccessibleContracts,
  recordContractView,
} from "@/lib/contracts/portal-access";
import { toClientContractDto } from "@/lib/contracts/portal-dto";
import { expireContractIfNeeded } from "@/lib/contracts/status";

export async function getPortalContractsHome(portalUserId: string) {
  const contracts = await listAccessibleContracts(portalUserId);

  const needsSignature = contracts.filter(
    (row) =>
      CONTRACT_SIGNABLE_STATUSES.has(row.contract.status as never) &&
      !isContractExpired(row.contract.expiresAt),
  );

  return { contracts, needsSignature };
}

export async function getPortalContractDetail(input: {
  contractId: string;
  portalUserId: string;
  contactId: string;
  versionId?: string;
}) {
  await assertContractAccess(input);
  await expireContractIfNeeded(input.contractId);

  const contract = await prisma.agencyContract.findUniqueOrThrow({
    where: { id: input.contractId },
    include: { company: { select: { name: true } } },
  });

  const latestSent = await prisma.agencyContractVersion.findFirst({
    where: { contractId: input.contractId, publishedAt: { not: null } },
    orderBy: { versionNumber: "desc" },
    select: { id: true },
  });

  const version = await prisma.agencyContractVersion.findFirst({
    where: input.versionId
      ? { id: input.versionId, contractId: input.contractId }
      : { contractId: input.contractId, publishedAt: { not: null } },
    orderBy: { versionNumber: "desc" },
  });

  const signers = version
    ? await prisma.agencyContractSigner.findMany({
        where: { contractId: input.contractId, contractVersionId: version.id },
        orderBy: [{ signingOrder: "asc" }, { createdAt: "asc" }],
      })
    : [];

  const signatures = version
    ? await prisma.agencyContractSignature.findMany({
        where: { contractVersionId: version.id },
        orderBy: { signedAt: "asc" },
      })
    : [];

  const portalSigner = version
    ? await getSignerForPortalUser({
        contractId: input.contractId,
        versionId: version.id,
        portalUserId: input.portalUserId,
      })
    : null;

  await recordContractView({
    contractId: input.contractId,
    portalUserId: input.portalUserId,
  });

  const statusAllowsSign =
    CONTRACT_SIGNABLE_STATUSES.has(contract.status as never) &&
    !isContractExpired(contract.expiresAt) &&
    !contract.voidedAt;

  return toClientContractDto({
    contract,
    version,
    latestSentVersionId: latestSent?.id ?? null,
    signers: signers.map((s) => ({
      id: s.id,
      nameSnapshot: s.nameSnapshot,
      emailSnapshot: s.emailSnapshot,
      role: s.role,
      signerType: s.signerType,
      status: s.status,
      isRequired: s.isRequired,
      signedAt: s.signedAt,
    })),
    signatures: signatures.map((sig) => ({
      id: sig.id,
      typedSignatureName: sig.typedSignatureName,
      signerTitle: sig.signerTitle,
      signerNameSnapshot: sig.signerNameSnapshot,
      signedAt: sig.signedAt,
      contractContentHash: sig.contractContentHash,
    })),
    portalSigner: portalSigner
      ? { status: portalSigner.status, role: portalSigner.role }
      : null,
    statusAllowsSign,
  });
}
