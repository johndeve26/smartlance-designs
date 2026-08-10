import { getPortalProposalsHome } from "@/lib/portal/proposals";
import { getPortalContractsHome } from "@/lib/portal/contracts";
import { formatMinorAmount } from "@/lib/money/format";
import {
  PORTAL_CONTRACT_STATUS,
  PORTAL_PROPOSAL_STATUS,
  formatPortalDate,
} from "@/lib/portal/status-labels";
import { decimalToMinorUnits } from "@/lib/money/minor-units";

export type PortalDocumentProposal = {
  id: string;
  proposalNumber: string;
  title: string;
  status: string;
  statusLabel: string;
  amountLabel: string | null;
  dateLabel: string | null;
  href: string;
  needsDecision: boolean;
};

export type PortalDocumentContract = {
  id: string;
  contractNumber: string;
  title: string;
  status: string;
  statusLabel: string;
  signedLabel: string | null;
  href: string;
  needsSignature: boolean;
};

export async function getPortalDocuments(portalUserId: string) {
  const [proposalsHome, contractsHome] = await Promise.all([
    getPortalProposalsHome(portalUserId),
    getPortalContractsHome(portalUserId),
  ]);

  const proposals: PortalDocumentProposal[] = proposalsHome.proposals.map((row) => {
    const p = row.proposal;
    const version = p.currentVersion;
    const needsDecision =
      row.role === "DECISION_MAKER" &&
      (p.status === "SENT" || p.status === "CHANGES_REQUESTED");
    return {
      id: p.id,
      proposalNumber: p.proposalNumber,
      title: p.title,
      status: p.status,
      statusLabel: PORTAL_PROPOSAL_STATUS[p.status] ?? p.status,
      amountLabel:
        version?.currency && version.totalAmount
          ? formatMinorAmount(
              decimalToMinorUnits(version.totalAmount, version.currency),
              version.currency,
            )
          : null,
      dateLabel: formatPortalDate(p.sentAt ?? version?.publishedAt ?? null),
      href: `/portal/proposals/${p.id}`,
      needsDecision,
    };
  });

  proposals.sort((a, b) => Number(b.needsDecision) - Number(a.needsDecision));

  const contracts: PortalDocumentContract[] = contractsHome.contracts.map((row) => {
    const c = row.contract;
    const needsSignature =
      row.role === "CLIENT_SIGNATORY" &&
      ["SENT", "PARTIALLY_SIGNED"].includes(c.status);
    return {
      id: c.id,
      contractNumber: c.contractNumber,
      title: c.title,
      status: c.status,
      statusLabel: PORTAL_CONTRACT_STATUS[c.status] ?? c.status,
      signedLabel: c.fullySignedAt ? formatPortalDate(c.fullySignedAt) : null,
      href: `/portal/contracts/${c.id}`,
      needsSignature,
    };
  });

  contracts.sort((a, b) => Number(b.needsSignature) - Number(a.needsSignature));

  return { proposals, contracts };
}
