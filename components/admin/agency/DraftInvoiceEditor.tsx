"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  saveDraftInvoiceAction,
  issueInvoiceAction,
} from "@/lib/admin/billing-actions";
import { PAYMENT_TERMS_PRESETS } from "@/lib/billing/constants";
import { calculateInvoiceTotals } from "@/lib/money/minor-units";
import { fromMinorUnits, toMinorUnits } from "@/lib/money/minor-units";
import { formatMinorAmount } from "@/lib/money/format";
import { PortalInvoiceView } from "@/components/portal/PortalInvoiceView";
import { toClientInvoiceDto } from "@/lib/billing/portal-dto";
import { AdminPanel } from "@/components/admin/patterns/AdminPanel";

type LineItemDraft = {
  description: string;
  quantity: number;
  unitMajor: string;
  position: number;
};

type InvoiceDetail = NonNullable<Awaited<ReturnType<typeof import("@/lib/billing/invoices").getInvoiceById>>>;

function lineItemsFromInvoice(invoice: InvoiceDetail): LineItemDraft[] {
  return invoice.lineItems.map((li, i) => ({
    description: li.description,
    quantity: li.quantity,
    unitMajor: String(fromMinorUnits(li.unitAmountMinor, invoice.currency)),
    position: li.position ?? i,
  }));
}

function computePreviewTotals(
  currency: string,
  lineItems: LineItemDraft[],
  discountMinor: number,
  taxMinor: number,
) {
  const items = lineItems.map((li, i) => {
    const unitAmountMinor = toMinorUnits(li.unitMajor || "0", currency);
    return {
      amountMinor: li.quantity * unitAmountMinor,
      position: i,
    };
  });
  return calculateInvoiceTotals({ lineItems: items, discountMinor, taxMinor });
}

export function DraftInvoiceEditor({
  invoice,
  canManage,
}: {
  invoice: InvoiceDetail;
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [confirmIssue, setConfirmIssue] = useState(false);

  const [lineItems, setLineItems] = useState<LineItemDraft[]>(() => lineItemsFromInvoice(invoice));
  const [clientNotes, setClientNotes] = useState(invoice.clientNotes ?? "");
  const [internalNotes, setInternalNotes] = useState(invoice.internalNotes ?? "");
  const [memo, setMemo] = useState(invoice.memo ?? "");
  const [discountMajor, setDiscountMajor] = useState(
    String(fromMinorUnits(invoice.discountMinor, invoice.currency)),
  );
  const [taxMajor, setTaxMajor] = useState(String(fromMinorUnits(invoice.taxMinor, invoice.currency)));
  const [paymentTermsDays, setPaymentTermsDays] = useState("14");
  const [customDueDate, setCustomDueDate] = useState(
    invoice.dueDate ? invoice.dueDate.toISOString().slice(0, 10) : "",
  );

  const discountMinor = toMinorUnits(discountMajor || "0", invoice.currency);
  const taxMinor = toMinorUnits(taxMajor || "0", invoice.currency);
  const totals = useMemo(
    () => computePreviewTotals(invoice.currency, lineItems, discountMinor, taxMinor),
    [invoice.currency, lineItems, discountMinor, taxMinor],
  );

  const isDraft = invoice.status === "DRAFT";

  function buildLineItemsPayload() {
    return lineItems.map((li, i) => ({
      description: li.description,
      quantity: li.quantity,
      unitAmountMinor: toMinorUnits(li.unitMajor || "0", invoice.currency),
      position: i,
    }));
  }

  function saveDraft() {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("invoiceId", invoice.id);
      fd.set("lineItemsJson", JSON.stringify(buildLineItemsPayload()));
      fd.set("clientNotes", clientNotes);
      fd.set("internalNotes", internalNotes);
      fd.set("memo", memo);
      fd.set("discountMinor", String(discountMinor));
      fd.set("taxMinor", String(taxMinor));
      if (customDueDate) {
        fd.set("dueDate", customDueDate);
      } else {
        fd.set("paymentTermsDays", paymentTermsDays);
      }
      const result = await saveDraftInvoiceAction(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function issueInvoice() {
    setError(null);
    startTransition(async () => {
      const saveFd = new FormData();
      saveFd.set("invoiceId", invoice.id);
      saveFd.set("lineItemsJson", JSON.stringify(buildLineItemsPayload()));
      saveFd.set("clientNotes", clientNotes);
      saveFd.set("internalNotes", internalNotes);
      saveFd.set("memo", memo);
      saveFd.set("discountMinor", String(discountMinor));
      saveFd.set("taxMinor", String(taxMinor));
      if (customDueDate) saveFd.set("dueDate", customDueDate);
      else saveFd.set("paymentTermsDays", paymentTermsDays);

      const saved = await saveDraftInvoiceAction(saveFd);
      if (!saved.ok) {
        setError(saved.error);
        return;
      }

      const issueFd = new FormData();
      issueFd.set("invoiceId", invoice.id);
      const issued = await issueInvoiceAction(issueFd);
      if (!issued.ok) {
        setError(issued.error);
        return;
      }
      setConfirmIssue(false);
      router.refresh();
    });
  }

  const previewDto = toClientInvoiceDto({
    invoice: {
      ...invoice,
      subtotalMinor: totals.subtotalMinor,
      discountMinor: totals.discountMinor,
      taxMinor: totals.taxMinor,
      totalMinor: totals.totalMinor,
      amountDueMinor: totals.totalMinor,
      clientNotes,
      memo,
      status: "ISSUED",
    },
    lineItems: lineItems.map((li, i) => {
      const unitAmountMinor = toMinorUnits(li.unitMajor || "0", invoice.currency);
      const amountMinor = li.quantity * unitAmountMinor;
      return {
        id: `preview-${i}`,
        description: li.description,
        quantity: li.quantity,
        unitAmountMinor,
        amountMinor,
        unitFormatted: formatMinorAmount(unitAmountMinor, invoice.currency),
        amountFormatted: formatMinorAmount(amountMinor, invoice.currency),
      };
    }),
    payments: [],
    canPay: false,
  });

  if (!isDraft) {
    return (
      <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        This invoice is {invoice.status} — financial fields are read-only.
      </div>
    );
  }

  if (preview) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setPreview(false)}>
            ← Back to editor
          </button>
        </div>
        <PortalInvoiceView invoice={previewDto} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
      ) : null}

      <AdminPanel>
        <h2 className="font-semibold">Bill to (preview)</h2>
        <p className="mt-2 text-sm">{invoice.billingNameSnapshot}</p>
        <p className="text-sm">{invoice.billingEmailSnapshot}</p>
        <p className="mt-1 text-xs text-neutral-500">Frozen on issue.</p>
      </AdminPanel>

      <AdminPanel>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Line items</h2>
          {canManage ? (
            <button
              type="button"
              className="admin-btn admin-btn-secondary text-sm"
              onClick={() =>
                setLineItems((items) => [
                  ...items,
                  { description: "", quantity: 1, unitMajor: "0", position: items.length },
                ])
              }
            >
              + Add line item
            </button>
          ) : null}
        </div>
        <div className="mt-3 space-y-3">
          {lineItems.map((li, idx) => (
            <div key={idx} className="grid gap-2 border-b pb-3 sm:grid-cols-12">
              <input
                className="admin-input sm:col-span-5"
                placeholder="Description"
                value={li.description}
                disabled={!canManage}
                onChange={(e) => {
                  const next = [...lineItems];
                  next[idx] = { ...li, description: e.target.value };
                  setLineItems(next);
                }}
              />
              <input
                type="number"
                min={1}
                className="admin-input sm:col-span-2"
                value={li.quantity}
                disabled={!canManage}
                onChange={(e) => {
                  const next = [...lineItems];
                  next[idx] = { ...li, quantity: Math.max(1, Number(e.target.value) || 1) };
                  setLineItems(next);
                }}
              />
              <input
                className="admin-input sm:col-span-2"
                placeholder="Unit price"
                value={li.unitMajor}
                disabled={!canManage}
                onChange={(e) => {
                  const next = [...lineItems];
                  next[idx] = { ...li, unitMajor: e.target.value };
                  setLineItems(next);
                }}
              />
              <div className="flex items-center gap-1 sm:col-span-3">
                <span className="text-sm text-neutral-600">
                  {formatMinorAmount(
                    li.quantity * toMinorUnits(li.unitMajor || "0", invoice.currency),
                    invoice.currency,
                  )}
                </span>
                {canManage ? (
                  <>
                    <button
                      type="button"
                      className="text-xs hover:underline"
                      disabled={idx === 0}
                      onClick={() => {
                        if (idx === 0) return;
                        const next = [...lineItems];
                        [next[idx - 1], next[idx]] = [next[idx]!, next[idx - 1]!];
                        setLineItems(next);
                      }}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="text-xs hover:underline"
                      disabled={idx === lineItems.length - 1}
                      onClick={() => {
                        if (idx >= lineItems.length - 1) return;
                        const next = [...lineItems];
                        [next[idx], next[idx + 1]] = [next[idx + 1]!, next[idx]!];
                        setLineItems(next);
                      }}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="text-xs text-red-600 hover:underline"
                      onClick={() => setLineItems(lineItems.filter((_, i) => i !== idx))}
                    >
                      Remove
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </AdminPanel>

      <AdminPanel className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="admin-label">Payment terms</label>
          <select
            className="admin-input w-full"
            value={customDueDate ? "custom" : paymentTermsDays}
            disabled={!canManage}
            onChange={(e) => {
              if (e.target.value === "custom") return;
              setCustomDueDate("");
              setPaymentTermsDays(e.target.value);
            }}
          >
            {PAYMENT_TERMS_PRESETS.map((p) => (
              <option key={p.days} value={String(p.days)}>
                {p.label}
              </option>
            ))}
            <option value="custom">Custom due date</option>
          </select>
        </div>
        {customDueDate || paymentTermsDays === "custom" ? (
          <div>
            <label className="admin-label">Due date</label>
            <input
              type="date"
              className="admin-input w-full"
              value={customDueDate}
              disabled={!canManage}
              onChange={(e) => setCustomDueDate(e.target.value)}
            />
          </div>
        ) : null}
        <div>
          <label className="admin-label">Discount ({invoice.currency})</label>
          <input
            className="admin-input w-full"
            value={discountMajor}
            disabled={!canManage}
            onChange={(e) => setDiscountMajor(e.target.value)}
          />
        </div>
        <div>
          <label className="admin-label">Tax ({invoice.currency})</label>
          <input
            className="admin-input w-full"
            value={taxMajor}
            disabled={!canManage}
            onChange={(e) => setTaxMajor(e.target.value)}
          />
        </div>
      </AdminPanel>

      <AdminPanel className="space-y-3">
        <div>
          <label className="admin-label">Client memo</label>
          <textarea
            className="admin-input w-full"
            rows={2}
            value={clientNotes}
            disabled={!canManage}
            onChange={(e) => setClientNotes(e.target.value)}
          />
        </div>
        <div>
          <label className="admin-label">Internal notes</label>
          <textarea
            className="admin-input w-full"
            rows={2}
            value={internalNotes}
            disabled={!canManage}
            onChange={(e) => setInternalNotes(e.target.value)}
          />
        </div>
      </AdminPanel>

      <AdminPanel>
        <h2 className="font-semibold">Totals (server-calculated on save)</h2>
        <dl className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
          <div className="flex justify-between sm:block">
            <dt className="text-neutral-500">Subtotal</dt>
            <dd>{formatMinorAmount(totals.subtotalMinor, invoice.currency)}</dd>
          </div>
          {totals.discountMinor > 0 ? (
            <div className="flex justify-between sm:block">
              <dt className="text-neutral-500">Discount</dt>
              <dd>-{formatMinorAmount(totals.discountMinor, invoice.currency)}</dd>
            </div>
          ) : null}
          {totals.taxMinor > 0 ? (
            <div className="flex justify-between sm:block">
              <dt className="text-neutral-500">Tax</dt>
              <dd>{formatMinorAmount(totals.taxMinor, invoice.currency)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between font-semibold sm:block">
            <dt>Total</dt>
            <dd>{formatMinorAmount(totals.totalMinor, invoice.currency)}</dd>
          </div>
        </dl>
      </AdminPanel>

      {canManage ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="admin-btn admin-btn-secondary" disabled={pending} onClick={saveDraft}>
            Save draft
          </button>
          <button type="button" className="admin-btn admin-btn-secondary" disabled={pending} onClick={() => setPreview(true)}>
            Preview
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            disabled={pending}
            onClick={() => setConfirmIssue(true)}
          >
            Issue invoice
          </button>
        </div>
      ) : null}

      {confirmIssue ? (
        <AdminPanel className="space-y-3">
          <h3 className="font-semibold">Issue this invoice?</h3>
          <p className="text-sm text-neutral-600">
            Total: {formatMinorAmount(totals.totalMinor, invoice.currency)} · Bill to:{" "}
            {invoice.billingEmailSnapshot}
          </p>
          <div className="flex gap-2">
            <button type="button" className="admin-btn admin-btn-primary" disabled={pending} onClick={issueInvoice}>
              Confirm issue
            </button>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setConfirmIssue(false)}>
              Cancel
            </button>
          </div>
        </AdminPanel>
      ) : null}
    </div>
  );
}
