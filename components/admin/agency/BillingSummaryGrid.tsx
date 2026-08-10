import { formatMinorAmount } from "@/lib/money/format";
import type { BillingFinancialSummary } from "@/lib/billing/financial-summary";

export function BillingSummaryGrid({ summary }: { summary: BillingFinancialSummary }) {
  const rows: Array<{ label: string; value: string | null }> = [
    summary.acceptedValueMinor != null
      ? { label: "Accepted value", value: formatMinorAmount(summary.acceptedValueMinor, summary.currency) }
      : { label: "Accepted value", value: null },
    { label: "Scheduled", value: summary.scheduledMinor != null ? formatMinorAmount(summary.scheduledMinor, summary.currency) : null },
    { label: "Invoiced", value: formatMinorAmount(summary.invoicedMinor, summary.currency) },
    summary.unbilledMinor != null
      ? { label: "Unbilled", value: formatMinorAmount(summary.unbilledMinor, summary.currency) }
      : { label: "Unbilled", value: null },
    { label: "Paid", value: formatMinorAmount(summary.paidMinor, summary.currency) },
    { label: "Invoice balance", value: formatMinorAmount(summary.invoiceBalanceMinor, summary.currency) },
  ];

  return (
    <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((row) =>
        row.value != null ? (
          <div key={row.label}>
            <dt className="text-neutral-500">{row.label}</dt>
            <dd className="font-medium">{row.value}</dd>
          </div>
        ) : null,
      )}
    </dl>
  );
}
