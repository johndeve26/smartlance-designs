import Link from "next/link";
import { getProposalFinancialSummary } from "@/lib/billing/financial-summary";
import { getScheduleByAcceptanceId } from "@/lib/billing/schedules";
import { listInvoices } from "@/lib/billing/invoices";
import { BillingSummaryGrid } from "@/components/admin/agency/BillingSummaryGrid";
import { ProposalBillingActions } from "@/components/admin/agency/ProposalBillingActions";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";

export async function ProposalBillingPanel({
  proposalId,
  proposalStatus,
  acceptanceId,
  acceptanceCurrency,
  canManage,
}: {
  proposalId: string;
  proposalStatus: string;
  acceptanceId?: string | null;
  acceptanceCurrency?: string;
  canManage: boolean;
}) {
  if (proposalStatus !== "ACCEPTED" || !acceptanceId) {
    return (
      <AdminPanel>
        <h2 className="font-semibold">Billing</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Proposal must be accepted before creating accepted-scope billing schedules or invoices.
        </p>
        {canManage ? (
          <Link href="/admin/agency/invoices/new" className="mt-3 inline-block text-sm hover:underline">
            Create standalone manual invoice
          </Link>
        ) : null}
      </AdminPanel>
    );
  }

  const [summary, schedule, invoices] = await Promise.all([
    getProposalFinancialSummary(acceptanceId),
    getScheduleByAcceptanceId(acceptanceId),
    listInvoices({ filters: { q: undefined }, pageSize: 5 }),
  ]);
  const linkedInvoices = invoices.items.filter(
    (inv) => inv.proposalId === proposalId || inv.proposalAcceptanceId === acceptanceId,
  );

  return (
    <AdminPanel>
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">Billing</h2>
        <Link href={`/admin/agency/invoices?proposal=${proposalId}`} className="text-sm hover:underline">
          View invoices
        </Link>
      </div>
      {schedule ? (
        <p className="mt-1 text-xs text-neutral-500">
          Schedule: {schedule.status} · {schedule.installments.length} installments
        </p>
      ) : null}
      <BillingSummaryGrid summary={summary} />
      {canManage ? (
        <ProposalBillingActions
          proposalAcceptanceId={acceptanceId}
          currency={acceptanceCurrency ?? summary.currency}
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
