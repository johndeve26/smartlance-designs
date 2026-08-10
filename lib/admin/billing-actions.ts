"use server";

import { revalidatePath } from "next/cache";
import { assertSameOrigin, requireAdminUser } from "@/lib/admin/session";
import { writeAuditLog } from "@/lib/repositories/auditRepository";
import {
  createManualInvoice,
  createInvoiceFromAcceptance,
  issueInvoice,
  saveDraftInvoice,
  voidInvoice,
  listInvoices,
  getInvoiceById,
} from "@/lib/billing/invoices";
import { recordManualPayment } from "@/lib/billing/payments";
import {
  createBillingSchedule,
  activateBillingSchedule,
  createInvoiceFromInstallment,
} from "@/lib/billing/schedules";
import {
  createRetainer,
  activateRetainer,
  pauseRetainer,
  cancelRetainer,
} from "@/lib/billing/retainers";
import {
  createManualInvoiceSchema,
  issueInvoiceSchema,
  voidInvoiceSchema,
  recordManualPaymentSchema,
  createBillingScheduleSchema,
  createRetainerSchema,
  saveDraftInvoiceSchema,
} from "@/lib/billing/schema";

function parseForm(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function revalidateBilling(invoiceId?: string) {
  revalidatePath("/admin/agency/billing");
  revalidatePath("/admin/agency/invoices");
  if (invoiceId) revalidatePath(`/admin/agency/invoices/${invoiceId}`);
}

export async function createManualInvoiceAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_billing");
  const parsed = createManualInvoiceSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const invoice = await createManualInvoice({
      createdById: user.id,
      companyId: parsed.data.companyId || null,
      primaryContactId: parsed.data.primaryContactId || null,
      currency: parsed.data.currency,
      memo: parsed.data.memo || null,
      clientNotes: parsed.data.clientNotes || null,
      paymentTermsDays: parsed.data.paymentTermsDays,
    });
    revalidateBilling(invoice!.id);
    return { ok: true as const, id: invoice!.id };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Could not create invoice." };
  }
}

export async function issueInvoiceAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_billing");
  const parsed = issueInvoiceSchema.safeParse(parseForm(formData));
  if (!parsed.success) return { ok: false as const, error: "Invalid input." };
  try {
    const result = await issueInvoice({ invoiceId: parsed.data.invoiceId, actorUserId: user.id });
    await writeAuditLog({
      actorId: user.id,
      action: "invoice.issue",
      entityType: "AgencyInvoice",
      entityId: parsed.data.invoiceId,
    });
    revalidateBilling(parsed.data.invoiceId);
    revalidatePath("/portal/billing");
    return { ok: true as const, notificationFailed: result.notificationFailed };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Could not issue invoice." };
  }
}

export async function voidInvoiceAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_billing");
  const parsed = voidInvoiceSchema.safeParse(parseForm(formData));
  if (!parsed.success) return { ok: false as const, error: "Invalid input." };
  try {
    await voidInvoice({
      invoiceId: parsed.data.invoiceId,
      actorUserId: user.id,
      reason: parsed.data.reason,
    });
    revalidateBilling(parsed.data.invoiceId);
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Could not void invoice." };
  }
}

export async function recordManualPaymentAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("record_payments");
  const parsed = recordManualPaymentSchema.safeParse(parseForm(formData));
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  try {
    await recordManualPayment({
      invoiceId: parsed.data.invoiceId,
      amountMinor: parsed.data.amountMinor,
      method: parsed.data.method,
      reference: parsed.data.reference || null,
      note: parsed.data.note || null,
      recordedById: user.id,
    });
    revalidateBilling(parsed.data.invoiceId);
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Could not record payment." };
  }
}

export async function createBillingScheduleAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_billing");
  const raw = parseForm(formData);
  const parsed = createBillingScheduleSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, error: "Invalid schedule input." };
  try {
    const installments = JSON.parse(parsed.data.installmentsJson) as Array<{
      label: string;
      type: "DEPOSIT" | "MILESTONE" | "FINAL" | "OTHER";
      amountMinor?: number;
      percentageBasisPoints?: number;
    }>;
    const schedule = await createBillingSchedule({
      proposalAcceptanceId: parsed.data.proposalAcceptanceId,
      contractId: parsed.data.contractId,
      projectId: parsed.data.projectId,
      currency: parsed.data.currency,
      installments,
      createdById: user.id,
    });
    await activateBillingSchedule(schedule.id, user.id);
    return { ok: true as const, id: schedule.id };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Could not create schedule." };
  }
}

export async function createInvoiceFromInstallmentAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_billing");
  const installmentId = String(formData.get("installmentId") || "");
  if (!installmentId) return { ok: false as const, error: "Missing installment." };
  try {
    const invoice = await createInvoiceFromInstallment({ installmentId, createdById: user.id });
    revalidateBilling(invoice!.id);
    return { ok: true as const, id: invoice!.id };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Could not create invoice." };
  }
}

export async function createRetainerAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_retainers");
  const parsed = createRetainerSchema.safeParse(parseForm(formData));
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  try {
    const retainer = await createRetainer({
      ...parsed.data,
      primaryContactId: parsed.data.primaryContactId || null,
      startDate: new Date(parsed.data.startDate),
      ownerId: user.id,
      createdById: user.id,
    });
    revalidatePath("/admin/agency/retainers");
    return { ok: true as const, id: retainer.id };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Could not create retainer." };
  }
}

export async function activateRetainerAction(formData: FormData) {
  await assertSameOrigin();
  await requireAdminUser("manage_retainers");
  const id = String(formData.get("retainerId") || "");
  await activateRetainer(id);
  revalidatePath("/admin/agency/retainers");
  return { ok: true as const };
}

export async function pauseRetainerAction(formData: FormData) {
  await assertSameOrigin();
  await requireAdminUser("manage_retainers");
  const id = String(formData.get("retainerId") || "");
  await pauseRetainer(id);
  revalidatePath("/admin/agency/retainers");
  return { ok: true as const };
}

export async function saveDraftInvoiceAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_billing");
  const raw = parseForm(formData);
  const parsed = saveDraftInvoiceSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    const lineItems = JSON.parse(parsed.data.lineItemsJson) as Array<{
      description: string;
      quantity: number;
      unitAmountMinor: number;
      position: number;
    }>;
    await saveDraftInvoice({
      invoiceId: parsed.data.invoiceId,
      memo: parsed.data.memo || null,
      clientNotes: parsed.data.clientNotes || null,
      internalNotes: parsed.data.internalNotes || null,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      paymentTermsDays: parsed.data.paymentTermsDays,
      discountMinor: parsed.data.discountMinor,
      taxMinor: parsed.data.taxMinor,
      lineItems,
      actorUserId: user.id,
    });
    revalidateBilling(parsed.data.invoiceId);
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Could not save draft." };
  }
}

export async function createInvoiceFromAcceptanceAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_billing");
  const proposalAcceptanceId = String(formData.get("proposalAcceptanceId") || "");
  const contractId = String(formData.get("contractId") || "") || null;
  if (!proposalAcceptanceId) return { ok: false as const, error: "Missing acceptance." };
  try {
    const invoice = await createInvoiceFromAcceptance({
      proposalAcceptanceId,
      contractId,
      createdById: user.id,
    });
    revalidateBilling(invoice!.id);
    return { ok: true as const, id: invoice!.id };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Could not create invoice." };
  }
}

export async function cancelRetainerAction(formData: FormData) {
  await assertSameOrigin();
  await requireAdminUser("manage_retainers");
  const id = String(formData.get("retainerId") || "");
  await cancelRetainer(id);
  revalidatePath("/admin/agency/retainers");
  return { ok: true as const };
}

export { listInvoices, getInvoiceById };
