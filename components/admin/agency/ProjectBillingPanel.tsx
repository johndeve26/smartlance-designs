import Link from "next/link";
import { getProjectFinancialSummaryDetailed } from "@/lib/billing/financial-summary";
import { listInvoices } from "@/lib/billing/invoices";
import { BillingSummaryGrid } from "@/components/admin/agency/BillingSummaryGrid";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";

export async function ProjectBillingPanel({ projectId }: { projectId: string }) {
  const [summary, invoices] = await Promise.all([
    getProjectFinancialSummaryDetailed(projectId),
    listInvoices({ filters: { projectId }, pageSize: 10 }),
  ]);

  return (
    <AdminPanel>
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">Billing</h2>
        <Link href="/admin/agency/invoices" className="text-sm hover:underline">
          All invoices
        </Link>
      </div>
      <BillingSummaryGrid summary={summary} />
      {invoices.items.length ? (
        <ul className="mt-4 divide-y text-sm">
          {invoices.items.map((inv) => (
            <li key={inv.id} className="flex justify-between py-2">
              <Link href={`/admin/agency/invoices/${inv.id}`} className="hover:underline">
                {inv.invoiceNumber}
              </Link>
              <span>{inv.status}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-neutral-500">No invoices linked to this project yet.</p>
      )}
    </AdminPanel>
  );
}
