import { displayInvoiceStatus } from "@/lib/billing/display";
import { formatMinorAmount } from "@/lib/money/format";

export type ClientInvoiceDto = {
  id: string;
  invoiceNumber: string;
  status: string;
  currency: string;
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
  amountPaidMinor: number;
  amountDueMinor: number;
  subtotalFormatted: string;
  totalFormatted: string;
  amountDueFormatted: string;
  issueDate: Date | null;
  dueDate: Date | null;
  paidAt: Date | null;
  billingName: string | null;
  billingEmail: string | null;
  issuerName: string | null;
  memo: string | null;
  clientNotes: string | null;
  lineItems: Array<{
    id: string;
    description: string;
    quantity: number;
    unitAmountMinor: number;
    amountMinor: number;
    unitFormatted: string;
    amountFormatted: string;
  }>;
  payments: Array<{
    id: string;
    paymentReference: string | null;
    amountMinor: number;
    amountFormatted: string;
    confirmedAt: Date | null;
    method: string;
    provider: string;
    manual: boolean;
  }>;
  canPay: boolean;
};

export function toClientInvoiceDto(input: {
  invoice: {
    id: string;
    invoiceNumber: string;
    status: string;
    currency: string;
    subtotalMinor: number;
    discountMinor: number;
    taxMinor: number;
    totalMinor: number;
    amountPaidMinor: number;
    amountDueMinor: number;
    issueDate: Date | null;
    dueDate: Date | null;
    paidAt: Date | null;
    billingNameSnapshot: string | null;
    billingEmailSnapshot: string | null;
    issuerNameSnapshot: string | null;
    memo: string | null;
    clientNotes: string | null;
  };
  lineItems: ClientInvoiceDto["lineItems"];
  payments: ClientInvoiceDto["payments"];
  canPay: boolean;
}): ClientInvoiceDto {
  const displayStatus = displayInvoiceStatus({
    status: input.invoice.status as never,
    dueDate: input.invoice.dueDate,
    amountDueMinor: input.invoice.amountDueMinor,
  });

  return {
    id: input.invoice.id,
    invoiceNumber: input.invoice.invoiceNumber,
    status: displayStatus,
    currency: input.invoice.currency,
    subtotalMinor: input.invoice.subtotalMinor,
    discountMinor: input.invoice.discountMinor,
    taxMinor: input.invoice.taxMinor,
    totalMinor: input.invoice.totalMinor,
    amountPaidMinor: input.invoice.amountPaidMinor,
    amountDueMinor: input.invoice.amountDueMinor,
    subtotalFormatted: formatMinorAmount(input.invoice.subtotalMinor, input.invoice.currency),
    totalFormatted: formatMinorAmount(input.invoice.totalMinor, input.invoice.currency),
    amountDueFormatted: formatMinorAmount(input.invoice.amountDueMinor, input.invoice.currency),
    issueDate: input.invoice.issueDate,
    dueDate: input.invoice.dueDate,
    paidAt: input.invoice.paidAt,
    billingName: input.invoice.billingNameSnapshot,
    billingEmail: input.invoice.billingEmailSnapshot,
    issuerName: input.invoice.issuerNameSnapshot,
    memo: input.invoice.memo,
    clientNotes: input.invoice.clientNotes,
    lineItems: input.lineItems,
    payments: input.payments,
    canPay: input.canPay,
  };
}
