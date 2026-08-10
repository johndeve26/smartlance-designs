"use client";

import { useTransition } from "react";
import {
  voidInvoiceAction,
  recordManualPaymentAction,
} from "@/lib/admin/billing-actions";
import { INVOICE_STATUS_LABELS } from "@/lib/billing/constants";
import { formatMinorAmount } from "@/lib/money/format";
import type { AgencyInvoiceStatus } from "@prisma/client";
import { DraftInvoiceEditor } from "@/components/admin/agency/DraftInvoiceEditor";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";

type InvoiceDetail = NonNullable<Awaited<ReturnType<typeof import("@/lib/billing/invoices").getInvoiceById>>>;

export function InvoiceDetailPanels({
  invoice,
  canManage,
  canRecordPayments,
}: {
  invoice: InvoiceDetail;
  canManage: boolean;
  canRecordPayments: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const isDraft = invoice.status === "DRAFT";
  const isPayable = ["ISSUED", "PARTIALLY_PAID"].includes(invoice.status);

  if (isDraft && canManage) {
    return (
      <div className="space-y-6">
        <DraftInvoiceEditor invoice={invoice} canManage={canManage} />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <AdminPanel>
          <h2 className="font-semibold">Line items</h2>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="border-b text-left text-neutral-500">
                <th className="py-2">Description</th>
                <th className="py-2">Qty</th>
                <th className="py-2">Unit</th>
                <th className="py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((li) => (
                <tr key={li.id} className="border-b">
                  <td className="py-2">{li.description}</td>
                  <td className="py-2">{li.quantity}</td>
                  <td className="py-2">{formatMinorAmount(li.unitAmountMinor, invoice.currency)}</td>
                  <td className="py-2">{formatMinorAmount(li.amountMinor, invoice.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <dl className="mt-4 grid gap-1 text-sm sm:grid-cols-2">
            <div className="flex justify-between sm:block">
              <dt className="text-neutral-500">Subtotal</dt>
              <dd>{formatMinorAmount(invoice.subtotalMinor, invoice.currency)}</dd>
            </div>
            {invoice.discountMinor > 0 ? (
              <div className="flex justify-between sm:block">
                <dt className="text-neutral-500">Discount</dt>
                <dd>-{formatMinorAmount(invoice.discountMinor, invoice.currency)}</dd>
              </div>
            ) : null}
            {invoice.taxMinor > 0 ? (
              <div className="flex justify-between sm:block">
                <dt className="text-neutral-500">Tax</dt>
                <dd>{formatMinorAmount(invoice.taxMinor, invoice.currency)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between font-semibold sm:block">
              <dt>Total</dt>
              <dd>{formatMinorAmount(invoice.totalMinor, invoice.currency)}</dd>
            </div>
            <div className="flex justify-between sm:block">
              <dt className="text-neutral-500">Paid</dt>
              <dd>{formatMinorAmount(invoice.amountPaidMinor, invoice.currency)}</dd>
            </div>
            <div className="flex justify-between font-semibold sm:block">
              <dt>Balance due</dt>
              <dd>{formatMinorAmount(invoice.amountDueMinor, invoice.currency)}</dd>
            </div>
          </dl>
          {invoice.clientNotes ? (
            <p className="mt-3 text-sm text-neutral-600">{invoice.clientNotes}</p>
          ) : null}
        </AdminPanel>

        {invoice.allocations.length ? (
          <AdminPanel>
            <h2 className="font-semibold">Payments</h2>
            <ul className="mt-2 divide-y text-sm">
              {invoice.allocations.map((a) => (
                <li key={a.id} className="flex justify-between py-2">
                  <span>
                    {a.payment.paymentReference ?? a.payment.id}
                    {a.payment.provider === "MANUAL" ? " (manual)" : ""}
                  </span>
                  <span>
                    {formatMinorAmount(a.amountMinor, invoice.currency)} · {a.payment.status}
                  </span>
                </li>
              ))}
            </ul>
          </AdminPanel>
        ) : null}

        {invoice.activities.length ? (
          <AdminPanel>
            <h2 className="font-semibold">Activity</h2>
            <ul className="mt-2 space-y-2 text-sm text-neutral-600">
              {invoice.activities.map((a) => (
                <li key={a.id}>
                  {a.createdAt.toISOString().slice(0, 16).replace("T", " ")} — {a.summary}
                </li>
              ))}
            </ul>
          </AdminPanel>
        ) : null}
      </div>

      <div className="space-y-4">
        <AdminPanel className="text-sm">
          <h2 className="font-semibold">Billing</h2>
          <p className="mt-2">{invoice.billingNameSnapshot}</p>
          <p>{invoice.billingEmailSnapshot}</p>
          <p className="mt-2 text-neutral-500">
            Status: {INVOICE_STATUS_LABELS[invoice.status as AgencyInvoiceStatus]}
          </p>
          {invoice.issueDate ? (
            <p className="text-neutral-500">Issued: {invoice.issueDate.toISOString().slice(0, 10)}</p>
          ) : null}
          {invoice.dueDate ? (
            <p className="text-neutral-500">Due: {invoice.dueDate.toISOString().slice(0, 10)}</p>
          ) : null}
          {invoice.internalNotes ? (
            <p className="mt-2 text-neutral-500">Internal: {invoice.internalNotes}</p>
          ) : null}
        </AdminPanel>

        {canManage && isPayable && invoice.amountPaidMinor === 0 ? (
          <AdminPanel className="space-y-3">
            <form
              action={(fd) => startTransition(() => void voidInvoiceAction(fd))}
              className="space-y-3"
            >
            <h2 className="font-semibold">Void invoice</h2>
            <textarea name="reason" required rows={3} className="admin-input w-full" placeholder="Reason" />
            <input type="hidden" name="invoiceId" value={invoice.id} />
            <button type="submit" disabled={pending} className="admin-btn admin-btn-secondary w-full">
              Void
            </button>
            </form>
          </AdminPanel>
        ) : null}

        {canRecordPayments && isPayable && invoice.amountDueMinor > 0 ? (
          <AdminPanel className="space-y-3">
            <form
              action={(fd) => startTransition(() => void recordManualPaymentAction(fd))}
              className="space-y-3"
            >
            <h2 className="font-semibold">Record manual payment</h2>
            <input type="hidden" name="invoiceId" value={invoice.id} />
            <div>
              <label className="admin-label">Amount (minor units)</label>
              <input
                name="amountMinor"
                type="number"
                required
                max={invoice.amountDueMinor}
                className="admin-input w-full"
              />
            </div>
            <div>
              <label className="admin-label">Method</label>
              <select name="method" className="admin-input w-full">
                <option value="BANK_TRANSFER">Bank transfer</option>
                <option value="ONLINE_TRANSFER">Online transfer</option>
                <option value="CASH">Cash</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <input name="reference" placeholder="Reference" className="admin-input w-full" />
            <textarea name="note" rows={2} placeholder="Note" className="admin-input w-full" />
            <button type="submit" disabled={pending} className="admin-btn admin-btn-primary w-full">
              Record payment
            </button>
            </form>
          </AdminPanel>
        ) : null}
      </div>
    </div>
  );
}
