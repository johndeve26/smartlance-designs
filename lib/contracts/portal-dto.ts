import type { AgencyContractSignerStatus } from "@prisma/client";

export type ClientContractDto = {
  id: string;
  contractNumber: string;
  title: string;
  status: string;
  sentAt: Date | null;
  expiresAt: Date | null;
  fullySignedAt: Date | null;
  companyName: string | null;
  isSuperseded: boolean;
  canSign: boolean;
  canDecline: boolean;
  canRequestCorrection: boolean;
  signerStatus: AgencyContractSignerStatus | null;
  version: {
    id: string;
    versionNumber: number;
    title: string;
    content: string;
    contentHash: string;
    publishedAt: Date | null;
  } | null;
  signers: Array<{
    id: string;
    nameSnapshot: string;
    emailSnapshot: string;
    role: string;
    signerType: string;
    status: AgencyContractSignerStatus;
    isRequired: boolean;
    signedAt: Date | null;
  }>;
  signatures: Array<{
    id: string;
    typedSignatureName: string;
    signerTitle: string | null;
    signerNameSnapshot: string;
    signedAt: Date;
    contractContentHash: string;
  }>;
};

export function toClientContractDto(input: {
  contract: {
    id: string;
    contractNumber: string;
    title: string;
    status: string;
    sentAt: Date | null;
    expiresAt: Date | null;
    fullySignedAt: Date | null;
    currentVersionId: string | null;
    company?: { name: string } | null;
  };
  version: {
    id: string;
    versionNumber: number;
    title: string;
    content: string;
    contentHash: string;
    publishedAt: Date | null;
  } | null;
  latestSentVersionId: string | null;
  signers: ClientContractDto["signers"];
  signatures: ClientContractDto["signatures"];
  portalSigner: { status: AgencyContractSignerStatus; role: string } | null;
  statusAllowsSign: boolean;
}): ClientContractDto {
  const isSuperseded = Boolean(
    input.version &&
      input.latestSentVersionId &&
      input.version.id !== input.latestSentVersionId,
  );

  const isClientSignatory =
    input.portalSigner?.role === "CLIENT_SIGNATORY" &&
    input.portalSigner.status !== "SIGNED";

  const canSign =
    isClientSignatory &&
    input.statusAllowsSign &&
    !isSuperseded &&
    Boolean(input.version) &&
    input.contract.status !== "SIGNED";

  return {
    id: input.contract.id,
    contractNumber: input.contract.contractNumber,
    title: input.contract.title,
    status: input.contract.status,
    sentAt: input.contract.sentAt,
    expiresAt: input.contract.expiresAt,
    fullySignedAt: input.contract.fullySignedAt,
    companyName: input.contract.company?.name ?? null,
    isSuperseded,
    canSign,
    canDecline: canSign,
    canRequestCorrection: canSign,
    signerStatus: input.portalSigner?.status ?? null,
    version: input.version,
    signers: input.signers.map((s) => ({
      id: s.id,
      nameSnapshot: s.nameSnapshot,
      emailSnapshot: s.emailSnapshot,
      role: s.role,
      signerType: s.signerType,
      status: s.status,
      isRequired: s.isRequired,
      signedAt: s.signedAt,
    })),
    signatures: input.signatures,
  };
}
