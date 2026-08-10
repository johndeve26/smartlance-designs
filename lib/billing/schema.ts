import { z } from "zod";
import { SUPPORTED_CURRENCIES } from "@/lib/money/currency";

const currencySchema = z.enum(SUPPORTED_CURRENCIES);

export const invoiceLineItemSchema = z.object({
  description: z.string().trim().min(1).max(500),
  quantity: z.coerce.number().int().min(1).max(10000),
  unitAmountMinor: z.coerce.number().int().min(0),
  position: z.coerce.number().int().min(0).default(0),
});

export const createManualInvoiceSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  companyId: z.string().cuid().optional().or(z.literal("")),
  primaryContactId: z.string().cuid().optional().or(z.literal("")),
  currency: currencySchema.default("USD"),
  memo: z.string().max(5000).optional(),
  clientNotes: z.string().max(5000).optional(),
  paymentTermsDays: z.coerce.number().int().min(0).max(365).default(14),
});

export const saveDraftInvoiceSchema = z.object({
  invoiceId: z.string().cuid(),
  memo: z.string().max(5000).optional(),
  clientNotes: z.string().max(5000).optional(),
  internalNotes: z.string().max(5000).optional(),
  dueDate: z.string().optional(),
  paymentTermsDays: z.coerce.number().int().min(0).max(365).optional(),
  discountMinor: z.coerce.number().int().min(0).default(0),
  taxMinor: z.coerce.number().int().min(0).default(0),
  lineItemsJson: z.string().min(2),
});

export const issueInvoiceSchema = z.object({
  invoiceId: z.string().cuid(),
});

export const voidInvoiceSchema = z.object({
  invoiceId: z.string().cuid(),
  reason: z.string().trim().min(1).max(5000),
});

export const recordManualPaymentSchema = z.object({
  invoiceId: z.string().cuid(),
  amountMinor: z.coerce.number().int().positive(),
  method: z.enum(["BANK_TRANSFER", "ONLINE_TRANSFER", "CASH", "OTHER"]).default("BANK_TRANSFER"),
  reference: z.string().trim().max(200).optional(),
  note: z.string().trim().max(5000).optional(),
  receivedAt: z.string().optional(),
});

export const initiatePaymentSchema = z.object({
  invoiceId: z.string().cuid(),
  clientRequestId: z.string().max(100).optional(),
});

export const createBillingScheduleSchema = z.object({
  proposalAcceptanceId: z.string().cuid().optional(),
  contractId: z.string().cuid().optional(),
  projectId: z.string().cuid().optional(),
  currency: currencySchema,
  installmentsJson: z.string().min(2),
});

export const createRetainerSchema = z.object({
  companyId: z.string().cuid(),
  primaryContactId: z.string().cuid().optional().or(z.literal("")),
  name: z.string().trim().min(1).max(200),
  currency: currencySchema,
  amountMinor: z.coerce.number().int().positive(),
  billingInterval: z.enum(["MONTHLY", "QUARTERLY", "YEARLY"]).default("MONTHLY"),
  lineItemDescription: z.string().trim().min(1).max(500),
  startDate: z.string(),
  paymentTermsDays: z.coerce.number().int().min(0).max(365).default(14),
  issueMode: z.enum(["CREATE_DRAFT", "AUTO_ISSUE"]).default("CREATE_DRAFT"),
});

export type InvoiceFilters = {
  status?: string;
  companyId?: string;
  projectId?: string;
  currency?: string;
  q?: string;
};
