import { createHash } from "node:crypto";
import type { AgencyInvoiceLineItem } from "@prisma/client";

export function computeInvoiceSnapshotHash(input: {
  invoiceNumber: string;
  currency: string;
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
  issueDate: string;
  dueDate: string;
  billingNameSnapshot: string;
  billingEmailSnapshot: string;
  lineItems: Array<Pick<AgencyInvoiceLineItem, "description" | "quantity" | "unitAmountMinor" | "amountMinor" | "position">>;
}) {
  const payload = JSON.stringify({
    invoiceNumber: input.invoiceNumber,
    currency: input.currency,
    subtotalMinor: input.subtotalMinor,
    discountMinor: input.discountMinor,
    taxMinor: input.taxMinor,
    totalMinor: input.totalMinor,
    issueDate: input.issueDate,
    dueDate: input.dueDate,
    billingNameSnapshot: input.billingNameSnapshot,
    billingEmailSnapshot: input.billingEmailSnapshot,
    lineItems: [...input.lineItems].sort((a, b) => a.position - b.position),
  });
  return createHash("sha256").update(payload).digest("hex");
}

export function hashWebhookPayload(payload: string) {
  return createHash("sha256").update(payload).digest("hex");
}
