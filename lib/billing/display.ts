import type { AgencyInvoiceStatus } from "@prisma/client";
import { INVOICE_PAYABLE_STATUSES } from "@/lib/billing/constants";

export function isInvoiceOverdue(input: {
  status: AgencyInvoiceStatus;
  dueDate: Date | null;
  amountDueMinor: number;
}) {
  if (!INVOICE_PAYABLE_STATUSES.has(input.status)) return false;
  if (input.amountDueMinor <= 0) return false;
  if (!input.dueDate) return false;
  return input.dueDate.getTime() < Date.now();
}

export function displayInvoiceStatus(input: {
  status: AgencyInvoiceStatus;
  dueDate: Date | null;
  amountDueMinor: number;
}): AgencyInvoiceStatus | "OVERDUE" {
  if (isInvoiceOverdue(input)) return "OVERDUE";
  return input.status;
}

export function invoiceStatusTone(status: AgencyInvoiceStatus | "OVERDUE") {
  switch (status) {
    case "PAID":
      return "success" as const;
    case "VOID":
    case "WRITTEN_OFF":
      return "danger" as const;
    case "PARTIALLY_PAID":
    case "OVERDUE":
      return "warning" as const;
    default:
      return "neutral" as const;
  }
}

export function deriveInvoiceStatus(input: {
  status: AgencyInvoiceStatus;
  totalMinor: number;
  amountPaidMinor: number;
  amountDueMinor: number;
}): AgencyInvoiceStatus {
  if (input.status === "VOID" || input.status === "WRITTEN_OFF" || input.status === "DRAFT") {
    return input.status;
  }
  if (input.amountDueMinor <= 0 && input.amountPaidMinor >= input.totalMinor) {
    return "PAID";
  }
  if (input.amountPaidMinor > 0 && input.amountDueMinor > 0) {
    return "PARTIALLY_PAID";
  }
  return input.status === "PARTIALLY_PAID" || input.status === "PAID"
    ? "ISSUED"
    : input.status;
}
