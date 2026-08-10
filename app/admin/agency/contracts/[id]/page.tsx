import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/session";
import { can } from "@/lib/admin/rbac";
import { getContractById } from "@/lib/contracts/contracts";
import { ContractDetailPanels } from "@/components/admin/agency/ContractDetailPanels";
import { ContractBillingPanel } from "@/components/admin/agency/ContractBillingPanel";
import { AdminDetailHeader } from "@/components/admin/patterns/AdminDetailHeader";

export const dynamic = "force-dynamic";

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdminUser("view_contracts");
  const { id } = await params;
  const contract = await getContractById(id);
  if (!contract) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/agency/contracts" className="text-sm text-muted hover:underline">
        ← Contracts
      </Link>

      <AdminDetailHeader
        title={`${contract.contractNumber} · ${contract.title}`}
        status={{ domain: "contract", value: contract.status }}
      />

      {can(user.role, "view_billing") ? (
        <ContractBillingPanel
          contractId={contract.id}
          contractStatus={contract.status}
          proposalAcceptanceId={contract.proposalAcceptanceId}
          canManage={can(user.role, "manage_billing")}
        />
      ) : null}
      <ContractDetailPanels
        contract={contract as never}
        canManage={can(user.role, "manage_contracts")}
        canSend={can(user.role, "send_contracts")}
        canSign={can(user.role, "sign_contracts")}
      />
    </div>
  );
}
