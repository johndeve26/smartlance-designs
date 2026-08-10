import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { getProposalById } from "@/lib/proposals/proposals";
import { listTemplates } from "@/lib/agency/templates";
import { listContractsByProposalId } from "@/lib/contracts/contracts";
import { listTemplates as listContractTemplates } from "@/lib/contracts/templates";
import { ProposalDetailPanels } from "@/components/admin/agency/ProposalDetailPanels";
import { ProposalContractsPanel } from "@/components/admin/agency/ProposalContractsPanel";
import { ProposalBillingPanel } from "@/components/admin/agency/ProposalBillingPanel";
import { contactDisplayName } from "@/lib/crm/normalize";
import { AdminDetailHeader } from "@/components/admin/patterns/AdminDetailHeader";

export const dynamic = "force-dynamic";

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdminUser("view_proposals");
  const { id } = await params;
  const [proposal, templates, contracts, contractTemplates] = await Promise.all([
    getProposalById(id),
    can(user.role, "manage_projects") ? listTemplates() : Promise.resolve([]),
    can(user.role, "view_contracts") ? listContractsByProposalId(id) : Promise.resolve([]),
    can(user.role, "view_contracts") ? listContractTemplates() : Promise.resolve([]),
  ]);
  if (!proposal) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/agency/proposals" className="text-sm text-muted hover:underline">
        ← Proposals
      </Link>

      <AdminDetailHeader
        title={`${proposal.proposalNumber} · ${proposal.title}`}
        subtitle={`${contactDisplayName(proposal.primaryContact)}${proposal.deal ? ` · Deal: ${proposal.deal.title}` : ""}`}
        status={{ domain: "proposal", value: proposal.status }}
      />

      {can(user.role, "view_contracts") ? (
        <ProposalContractsPanel
          proposalId={proposal.id}
          proposalStatus={proposal.status}
          primaryContactId={proposal.primaryContactId}
          contracts={contracts.map((c) => ({
            id: c.id,
            contractNumber: c.contractNumber,
            title: c.title,
            status: c.status,
          }))}
          templates={contractTemplates.flatMap((t) =>
            t.versions[0] ? [{ id: t.id, name: t.name, versionId: t.versions[0].id }] : [],
          )}
          canManage={can(user.role, "manage_contracts")}
        />
      ) : null}
      {can(user.role, "view_billing") ? (
        <ProposalBillingPanel
          proposalId={proposal.id}
          proposalStatus={proposal.status}
          acceptanceId={proposal.acceptance?.id}
          acceptanceCurrency={proposal.acceptance?.currency}
          canManage={can(user.role, "manage_billing")}
        />
      ) : null}
      <ProposalDetailPanels
        proposal={proposal as never}
        canManage={can(user.role, "manage_proposals")}
        canSend={can(user.role, "send_proposals")}
        templates={templates.map((t) => ({ id: t.id, name: t.name }))}
      />
    </div>
  );
}
