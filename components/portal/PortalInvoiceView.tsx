"use client";

import { useId, useTransition } from "react";
import { portalInitiatePaymentAction } from "@/lib/portal/billing-actions";
import type { ClientInvoiceDto } from "@/lib/billing/portal-dto";

export function PortalInvoiceView({ invoice }: { invoice: ClientInvoiceDto }) {
  const [pending, startTransition] = useTransition();
  const clientRequestId = useId();

  return (
    <div className="space-y-6">
      <header className="rounded border bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-neutral-500">Invoice</p>
            <h1 className="text-2xl font-semibold">{invoice.invoiceNumber}</h1>
            <p className="mt-1 text-sm text-neutral-600">Status: {invoice.status}</p>
          </div>
          {invoice.canPay ? (
            <form
              action={(fd) =>
                startTransition(async () => {
                  const result = await portalInitiatePaymentAction(fd);
                  if (result.ok && result.redirectUrl) {
                    window.location.href = result.redirectUrl;
                  } else if (!result.ok) {
                    alert(result.error);
                  }
                })
              }
            >
              <input type="hidden" name="invoiceId" value={invoice.id} />
              <input type="hidden" name="clientRequestId" value={clientRequestId} />
              <button
                type="submit"
                disabled={pending}
                className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {pending ? "Starting checkout…" : `Pay ${invoice.amountDueFormatted}`}
              </button>
            </form>
          ) : null}
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded border bg-white p-4 text-sm">
          <h2 className="font-semibold">From</h2>
          <p className="mt-2">{invoice.issuerName ?? "Smartlance Designs"}</p>
        </section>
        <section className="rounded border bg-white p-4 text-sm">
          <h2 className="font-semibold">Bill to</h2>
          <p className="mt-2">{invoice.billingName}</p>
          <p>{invoice.billingEmail}</p>
        </section>
      </div>

      <section className="rounded border bg-white p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-neutral-500">
              <th className="py-2">Description</th>
              <th className="py-2">Qty</th>
              <th className="py-2">Unit</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((li) => (
              <tr key={li.id} className="border-b">
                <td className="py-2">{li.description}</td>
                <td className="py-2">{li.quantity}</td>
                <td className="py-2">{li.unitFormatted}</td>
                <td className="py-2 text-right">{li.amountFormatted}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <dl className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-neutral-500">Subtotal</dt>
            <dd>{invoice.subtotalFormatted}</dd>
          </div>
          <div className="flex justify-between font-semibold">
            <dt>Total</dt>
            <dd>{invoice.totalFormatted}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-500">Balance due</dt>
            <dd>{invoice.amountDueFormatted}</dd>
          </div>
        </dl>
        {invoice.clientNotes ? (
          <p className="mt-4 text-sm text-neutral-600">{invoice.clientNotes}</p>
        ) : null}
      </section>

      {invoice.payments.length ? (
        <section className="rounded border bg-white p-4">
          <h2 className="font-semibold">Payment history</h2>
          <ul className="mt-2 divide-y text-sm">
            {invoice.payments.map((p) => (
              <li key={p.id} className="flex justify-between py-2">
                <span>
                  {p.paymentReference ?? p.id.slice(0, 8)}
                  {p.manual ? " (recorded manually)" : ""}
                </span>
                <span>
                  {p.amountFormatted}
                  {p.confirmedAt ? ` · ${p.confirmedAt.toISOString().slice(0, 10)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
