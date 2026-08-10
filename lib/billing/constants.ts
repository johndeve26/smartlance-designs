import type { AgencyInvoiceStatus } from "@prisma/client";

export const INVOICE_PAGE_SIZE_DEFAULT = 25;
export const INVOICE_PAGE_SIZE_MAX = 100;

export const INVOICE_STATUS_LABELS: Record<AgencyInvoiceStatus, string> = {
  DRAFT: "Draft",
  ISSUED: "Issued",
  PARTIALLY_PAID: "Partially paid",
  PAID: "Paid",
  VOID: "Void",
  WRITTEN_OFF: "Written off",
};

export const INVOICE_PAYABLE_STATUSES = new Set<AgencyInvoiceStatus>([
  "ISSUED",
  "PARTIALLY_PAID",
]);

export const PAYMENT_TERMS_PRESETS = [
  { label: "Due on receipt", days: 0 },
  { label: "Net 7", days: 7 },
  { label: "Net 14", days: 14 },
  { label: "Net 30", days: 30 },
] as const;
