import Link from "next/link";
import { redirect } from "next/navigation";
import { getPortalBillingHome } from "@/lib/portal/billing";
import { getPortalUser } from "@/lib/portal/session";
import { formatMinorAmount } from "@/lib/money/format";
import { displayInvoiceStatus } from "@/lib/billing/display";
import { INVOICE_STATUS_LABELS } from "@/lib/billing/constants";
import { formatPortalDate } from "@/lib/portal/status-labels";
import {
  PortalCard,
  PortalPageHeader,
  PortalPrimaryButton,
  PortalSecondaryButton,
} from "@/components/portal/PortalShell";

export const dynamic = "force-dynamic";

export default async function PortalBillingPage() {
  const user = await getPortalUser();
  if (!user) redirect("/portal/login");

  const { outstanding, overdue, recentPaid, outstandingMinor, currency, rows } =
    await getPortalBillingHome(user.id);

  return (
    <div className="space-y-8">
      <PortalPageHeader
        title="Billing"
        description="Outstanding invoices, payment history, and receipts."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <PortalCard>
          <p className="text-sm text-neutral-500">Amount due</p>
          <p className="mt-1 text-2xl font-semibold text-[#535353]">
            {formatMinorAmount(outstandingMinor, currency)}
          </p>
        </PortalCard>
        <PortalCard>
          <p className="text-sm text-neutral-500">Outstanding invoices</p>
          <p className="mt-1 text-2xl font-semibold text-[#535353]">{outstanding.length}</p>
        </PortalCard>
        <PortalCard>
          <p className="text-sm text-neutral-500">Overdue</p>
          <p className="mt-1 text-2xl font-semibold text-[#535353]">{overdue.length}</p>
        </PortalCard>
      </div>

      {outstanding.length ? (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-[#535353]">Due now</h2>
          <div className="space-y-3">
            {outstanding.map(({ invoice, role }) => {
              const status = displayInvoiceStatus({
                status: invoice.status as never,
                dueDate: invoice.dueDate,
                amountDueMinor: invoice.amountDueMinor,
              });
              const isOverdue = status === "OVERDUE";
              const canPay = role === "BILLING_ADMIN";
              return (
                <article
                  key={invoice.id}
                  className={`rounded-lg border bg-white p-4 shadow-sm ${
                    isOverdue ? "border-l-4 border-l-red-500" : "border-neutral-200"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-[#535353]">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-neutral-600">{invoice.company?.name}</p>
                      <p className="mt-1 text-lg font-medium">
                        {formatMinorAmount(invoice.amountDueMinor, invoice.currency)}
                      </p>
                      {invoice.dueDate ? (
                        <p className="text-sm text-neutral-500">
                          Due {formatPortalDate(invoice.dueDate)}
                          {isOverdue ? " · Overdue" : ""}
                        </p>
                      ) : null}
                    </div>
                    {canPay ? (
                      <PortalPrimaryButton href={`/portal/invoices/${invoice.id}`}>
                        Pay invoice
                      </PortalPrimaryButton>
                    ) : (
                      <PortalSecondaryButton href={`/portal/invoices/${invoice.id}`}>
                        View invoice
                      </PortalSecondaryButton>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : (
        <PortalCard>
          <p className="text-sm text-neutral-600">No invoices due right now.</p>
        </PortalCard>
      )}

      {recentPaid.length ? (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-[#535353]">Recently paid</h2>
          <PortalCard>
            <ul className="divide-y divide-neutral-100">
              {recentPaid.map(({ invoice }) => (
                <li key={invoice.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <Link
                      href={`/portal/invoices/${invoice.id}`}
                      className="font-medium text-[#535353] hover:underline"
                    >
                      {invoice.invoiceNumber}
                    </Link>
                    <p className="text-neutral-600">
                      Paid {formatPortalDate(invoice.updatedAt)}
                    </p>
                  </div>
                  <span>{formatMinorAmount(invoice.totalMinor, invoice.currency)}</span>
                </li>
              ))}
            </ul>
          </PortalCard>
        </section>
      ) : null}

      <section>
        <h2 className="mb-4 text-lg font-semibold text-[#535353]">All invoices</h2>
        <PortalCard>
          <ul className="divide-y divide-neutral-100">
            {rows.map(({ invoice }) => (
              <li key={invoice.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <Link
                  href={`/portal/invoices/${invoice.id}`}
                  className="font-medium text-[#535353] hover:underline"
                >
                  {invoice.invoiceNumber}
                </Link>
                <div className="text-right">
                  <p>{formatMinorAmount(invoice.totalMinor, invoice.currency)}</p>
                  <p className="text-neutral-500">
                    {INVOICE_STATUS_LABELS[invoice.status as keyof typeof INVOICE_STATUS_LABELS]}
                  </p>
                </div>
              </li>
            ))}
            {!rows.length ? (
              <li className="py-4 text-neutral-500">No invoices shared with you yet.</li>
            ) : null}
          </ul>
        </PortalCard>
      </section>
    </div>
  );
}
