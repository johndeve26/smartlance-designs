import Link from "next/link";
import type { PortalDocumentContract, PortalDocumentProposal } from "@/lib/portal/documents";
import {
  PortalCard,
  PortalPrimaryButton,
  PortalSecondaryButton,
} from "@/components/portal/PortalShell";

export function PortalDocumentsView({
  proposals,
  contracts,
}: {
  proposals: PortalDocumentProposal[];
  contracts: PortalDocumentContract[];
}) {
  const pendingProposals = proposals.filter((p) => p.needsDecision);
  const pendingContracts = contracts.filter((c) => c.needsSignature);
  const historicalProposals = proposals.filter((p) => !p.needsDecision);
  const historicalContracts = contracts.filter((c) => !c.needsSignature);

  return (
    <div className="space-y-8">
      {(pendingProposals.length > 0 || pendingContracts.length > 0) && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-[#535353]">Needs your decision</h2>
          <div className="space-y-3">
            {pendingProposals.map((p) => (
              <DocumentProposalCard key={p.id} proposal={p} highlight />
            ))}
            {pendingContracts.map((c) => (
              <DocumentContractCard key={c.id} contract={c} highlight />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold text-[#535353]">Proposals</h2>
        {historicalProposals.length || pendingProposals.length ? (
          <div className="space-y-3">
            {historicalProposals.map((p) => (
              <DocumentProposalCard key={p.id} proposal={p} />
            ))}
          </div>
        ) : (
          <PortalCard>
            <p className="text-sm text-neutral-600">No proposals shared with you yet.</p>
          </PortalCard>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-[#535353]">Contracts</h2>
        {historicalContracts.length || pendingContracts.length ? (
          <div className="space-y-3">
            {historicalContracts.map((c) => (
              <DocumentContractCard key={c.id} contract={c} />
            ))}
          </div>
        ) : (
          <PortalCard>
            <p className="text-sm text-neutral-600">No contracts shared with you yet.</p>
          </PortalCard>
        )}
      </section>
    </div>
  );
}

function DocumentProposalCard({
  proposal,
  highlight,
}: {
  proposal: PortalDocumentProposal;
  highlight?: boolean;
}) {
  return (
    <article
      className={`rounded-lg border bg-white p-4 shadow-sm ${
        highlight ? "border-l-4 border-l-[#F47A48]" : "border-neutral-200"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs text-neutral-500">{proposal.proposalNumber}</p>
          <h3 className="font-semibold text-[#535353]">{proposal.title}</h3>
          <p className="text-sm text-neutral-600">
            {proposal.statusLabel}
            {proposal.amountLabel ? ` · ${proposal.amountLabel}` : ""}
            {proposal.dateLabel ? ` · ${proposal.dateLabel}` : ""}
          </p>
        </div>
        {proposal.needsDecision ? (
          <PortalPrimaryButton href={proposal.href}>Review proposal</PortalPrimaryButton>
        ) : (
          <PortalSecondaryButton href={proposal.href}>View</PortalSecondaryButton>
        )}
      </div>
    </article>
  );
}

function DocumentContractCard({
  contract,
  highlight,
}: {
  contract: PortalDocumentContract;
  highlight?: boolean;
}) {
  return (
    <article
      className={`rounded-lg border bg-white p-4 shadow-sm ${
        highlight ? "border-l-4 border-l-[#F47A48]" : "border-neutral-200"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs text-neutral-500">{contract.contractNumber}</p>
          <h3 className="font-semibold text-[#535353]">{contract.title}</h3>
          <p className="text-sm text-neutral-600">
            {contract.statusLabel}
            {contract.signedLabel ? ` · Signed ${contract.signedLabel}` : ""}
          </p>
        </div>
        {contract.needsSignature ? (
          <PortalPrimaryButton href={contract.href}>Review & sign</PortalPrimaryButton>
        ) : (
          <PortalSecondaryButton href={contract.href}>View</PortalSecondaryButton>
        )}
      </div>
    </article>
  );
}
