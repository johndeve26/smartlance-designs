import Link from "next/link";
import { getContractFinancialSummary } from "@/lib/billing/financial-summary";
import { getScheduleByAcceptanceId } from "@/lib/billing/schedules";
import { listInvoices } from "@/lib/billing/invoices";
import { CONTRACT_STATUS_LABELS } from "@/lib/contracts/constants";
import { BillingSummaryGrid } from "@/components/admin/agency/BillingSummaryGrid";
import { ContractBillingActions } from "@/components/admin/agency/ContractBillingActions";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";

export async function ContractBillingPanel({
  contractId,
  contractStatus,
  proposalAcceptanceId,
  canManage,
}: {
  contractId: string;
  contractStatus: string;
  proposalAcceptanceId?: string | null;
  canManage: boolean;
}) {
  const [summary, schedule, invoices] = await Promise.all([
    getContractFinancialSummary(contractId),
    proposalAcceptanceId
      ? getScheduleByAcceptanceId(proposalAcceptanceId)
      : Promise.resolve(null),
    listInvoices({ pageSize: 20 }),
  ]);
  const linkedInvoices = invoices.items.filter((inv) => inv.contractId === contractId);

  return (
    <AdminPanel>
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">Billing</h2>
        <span className="text-sm text-neutral-500">
          Contract: {CONTRACT_STATUS_LABELS[contractStatus as keyof typeof CONTRACT_STATUS_LABELS] ?? contractStatus}
        </span>
      </div>
      <p className="mt-1 text-xs text-neutral-500">
        Contract signature and payment are separate facts.
      </p>
      <BillingSummaryGrid summary={summary} />
      {canManage && proposalAcceptanceId ? (
        <ContractBillingActions
          contractId={contractId}
          proposalAcceptanceId={proposalAcceptanceId}
          currency={summary.currency}
          schedule={schedule}
        />
      ) : null}
      {linkedInvoices.length ? (
        <ul className="mt-4 divide-y text-sm">
          {linkedInvoices.map((inv) => (
            <li key={inv.id} className="flex justify-between py-2">
              <Link href={`/admin/agency/invoices/${inv.id}`} className="hover:underline">
                {inv.invoiceNumber} · {inv.status}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </AdminPanel>
  );
}
