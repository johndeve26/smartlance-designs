import type { AgencyProposal, AgencyProposalVersion } from "@prisma/client";
import { decimalToNumber } from "@/lib/proposals/pricing";

type VersionWithRelations = AgencyProposalVersion & {
  sections: Array<{ sectionType: string; title: string; body: string | null; position: number }>;
  scopeItems: Array<{
    id: string;
    title: string;
    description: string | null;
    position: number;
    included: boolean;
    clientVisible: boolean;
  }>;
  deliverables: Array<{
    id: string;
    title: string;
    description: string | null;
    quantity: number;
    position: number;
  }>;
  lineItems: Array<{
    id: string;
    name: string;
    description: string | null;
    quantity: unknown;
    unitPrice: unknown;
    amount: unknown;
    position: number;
    type: string;
    isOptional: boolean;
    isSelectedByDefault: boolean;
  }>;
};

export type ClientProposalDto = {
  id: string;
  proposalNumber: string;
  title: string;
  status: string;
  currency: string;
  sentAt: Date | null;
  expiresAt: Date | null;
  acceptedAt: Date | null;
  companyName: string | null;
  isSuperseded: boolean;
  canDecide: boolean;
  version: {
    id: string;
    versionNumber: number;
    title: string;
    intro: string | null;
    scopeSummary: string | null;
    timelineSummary: string | null;
    estimatedStart: Date | null;
    estimatedDuration: string | null;
    assumptionsText: string | null;
    exclusionsText: string | null;
    revisionPolicy: string | null;
    validUntil: Date | null;
    pricingSubtotal: number;
    discountAmount: number | null;
    taxAmount: number | null;
    totalAmount: number;
    sections: VersionWithRelations["sections"];
    scopeItems: VersionWithRelations["scopeItems"];
    deliverables: VersionWithRelations["deliverables"];
    lineItems: Array<{
      id: string;
      name: string;
      description: string | null;
      quantity: number;
      unitPrice: number;
      amount: number;
      type: string;
      isOptional: boolean;
      isSelectedByDefault: boolean;
    }>;
  } | null;
};

export function toClientProposalDto(input: {
  proposal: AgencyProposal & {
    company?: { name: string } | null;
  };
  version: VersionWithRelations | null;
  latestSentVersionId: string | null;
  role: "VIEWER" | "DECISION_MAKER";
  statusAllowsDecision: boolean;
}): ClientProposalDto {
  const isSuperseded = Boolean(
    input.version &&
      input.latestSentVersionId &&
      input.version.id !== input.latestSentVersionId,
  );

  const canDecide =
    input.role === "DECISION_MAKER" &&
    input.statusAllowsDecision &&
    !isSuperseded &&
    Boolean(input.version);

  return {
    id: input.proposal.id,
    proposalNumber: input.proposal.proposalNumber,
    title: input.proposal.title,
    status: input.proposal.status,
    currency: input.proposal.currency,
    sentAt: input.proposal.sentAt,
    expiresAt: input.proposal.expiresAt,
    acceptedAt: input.proposal.acceptedAt,
    companyName: input.proposal.company?.name ?? null,
    isSuperseded,
    canDecide,
    version: input.version
      ? {
          id: input.version.id,
          versionNumber: input.version.versionNumber,
          title: input.version.title,
          intro: input.version.intro,
          scopeSummary: input.version.scopeSummary,
          timelineSummary: input.version.timelineSummary,
          estimatedStart: input.version.estimatedStart,
          estimatedDuration: input.version.estimatedDuration,
          assumptionsText: input.version.assumptionsText,
          exclusionsText: input.version.exclusionsText,
          revisionPolicy: input.version.revisionPolicy,
          validUntil: input.version.validUntil,
          pricingSubtotal: decimalToNumber(input.version.pricingSubtotal) ?? 0,
          discountAmount: decimalToNumber(input.version.discountAmount),
          taxAmount: decimalToNumber(input.version.taxAmount),
          totalAmount: decimalToNumber(input.version.totalAmount) ?? 0,
          sections: input.version.sections,
          scopeItems: input.version.scopeItems.filter((item) => item.clientVisible),
          deliverables: input.version.deliverables,
          lineItems: input.version.lineItems.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            quantity: decimalToNumber(item.quantity as never) ?? 0,
            unitPrice: decimalToNumber(item.unitPrice as never) ?? 0,
            amount: decimalToNumber(item.amount as never) ?? 0,
            type: item.type,
            isOptional: item.isOptional,
            isSelectedByDefault: item.isSelectedByDefault,
          })),
        }
      : null,
  };
}
