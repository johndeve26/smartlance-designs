import type { AgencyPaymentMethod, AgencyPaymentProvider, AgencyPaymentSource } from "@prisma/client";
import { prisma } from "@/lib/db";
import { recordBillingActivity } from "@/lib/billing/activity";
import { deriveInvoiceStatus } from "@/lib/billing/display";
import { generatePaymentReference } from "@/lib/billing/payment-reference";
import { currenciesMatch } from "@/lib/money/currency";
import { sendPaymentConfirmationEmail } from "@/lib/billing/payment-email";

export type ConfirmPaymentInput = {
  paymentId: string;
  providerTransactionId?: string | null;
  providerReference?: string | null;
  amountMinor: number;
  currency: string;
  method?: AgencyPaymentMethod;
  source: AgencyPaymentSource;
  actorUserId?: string;
  actorPortalUserId?: string;
  metadata?: Record<string, unknown>;
};

/** Idempotent payment confirmation + invoice allocation. */
export async function confirmPaymentSuccess(input: ConfirmPaymentInput) {
  const result = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT id FROM "AgencyPayment" WHERE id = ${input.paymentId} FOR UPDATE`;

    const payment = await tx.agencyPayment.findUniqueOrThrow({
      where: { id: input.paymentId },
      include: { allocations: true },
    });

    if (payment.status === "SUCCEEDED") {
      return { payment, idempotent: true as const };
    }
    if (payment.status === "FAILED" || payment.status === "CANCELLED") {
      throw new Error("Payment is not in a confirmable state.");
    }

    if (!currenciesMatch(payment.currency, input.currency)) {
      await tx.agencyPayment.update({ where: { id: payment.id }, data: { status: "NEEDS_REVIEW" } });
      await recordBillingActivity(
        {
          paymentId: payment.id,
          type: "PAYMENT_ANOMALY",
          summary: "Payment currency mismatch.",
          actorUserId: input.actorUserId,
          actorPortalUserId: input.actorPortalUserId,
        },
        tx,
      );
      return {
        payment: await tx.agencyPayment.findUniqueOrThrow({ where: { id: payment.id } }),
        idempotent: false as const,
        anomaly: "CURRENCY_MISMATCH" as const,
      };
    }

    if (input.amountMinor !== payment.amountMinor) {
      await tx.agencyPayment.update({ where: { id: payment.id }, data: { status: "NEEDS_REVIEW" } });
      await recordBillingActivity(
        {
          paymentId: payment.id,
          type: "PAYMENT_ANOMALY",
          summary: "Payment amount mismatch.",
          actorUserId: input.actorUserId,
          actorPortalUserId: input.actorPortalUserId,
        },
        tx,
      );
      return {
        payment: await tx.agencyPayment.findUniqueOrThrow({ where: { id: payment.id } }),
        idempotent: false as const,
        anomaly: "AMOUNT_MISMATCH" as const,
      };
    }

    let invoiceId = payment.allocations[0]?.invoiceId;
    if (!invoiceId) throw new Error("Payment has no invoice allocation target.");

    await tx.$executeRaw`SELECT id FROM "AgencyInvoice" WHERE id = ${invoiceId} FOR UPDATE`;
    let invoice = await tx.agencyInvoice.findUniqueOrThrow({ where: { id: invoiceId } });

    if (!["ISSUED", "PARTIALLY_PAID"].includes(invoice.status)) {
      throw new Error("Invoice is not payable.");
    }

    if (input.amountMinor > invoice.amountDueMinor) {
      throw new Error("Payment would over-allocate invoice balance.");
    }

    if (payment.allocations.length === 0) {
      if (input.amountMinor > invoice.amountDueMinor) {
        throw new Error("Payment would over-allocate invoice balance.");
      }
      await tx.agencyPaymentAllocation.create({
        data: { paymentId: payment.id, invoiceId, amountMinor: input.amountMinor },
      });
    }

    const now = new Date();
    await tx.agencyPayment.update({
      where: { id: payment.id },
      data: {
        status: "SUCCEEDED",
        confirmedAt: now,
        receivedAt: payment.receivedAt ?? now,
        providerTransactionId: input.providerTransactionId ?? payment.providerTransactionId,
        providerReference: input.providerReference ?? payment.providerReference,
        method: input.method ?? payment.method,
        source: input.source,
        metadataJson: (input.metadata ?? payment.metadataJson ?? undefined) as import("@prisma/client").Prisma.InputJsonValue | undefined,
      },
    });

    const newPaid = invoice.amountPaidMinor + input.amountMinor;
    const newDue = Math.max(0, invoice.totalMinor - newPaid);
    const newStatus = deriveInvoiceStatus({
      status: invoice.status,
      totalMinor: invoice.totalMinor,
      amountPaidMinor: newPaid,
      amountDueMinor: newDue,
    });

    await tx.agencyInvoice.update({
      where: { id: invoiceId },
      data: {
        amountPaidMinor: newPaid,
        amountDueMinor: newDue,
        status: newStatus,
        paidAt: newDue === 0 ? now : invoice.paidAt,
      },
    });

    await recordBillingActivity(
      {
        invoiceId,
        paymentId: payment.id,
        type: newDue === 0 ? "INVOICE_PAID" : "PAYMENT_PARTIAL",
        summary: newDue === 0 ? "Invoice paid in full." : "Partial payment received.",
        actorUserId: input.actorUserId,
        actorPortalUserId: input.actorPortalUserId,
        clientVisible: true,
      },
      tx,
    );

    return {
      payment: await tx.agencyPayment.findUniqueOrThrow({ where: { id: payment.id } }),
      idempotent: false as const,
    };
  });

  if ("anomaly" in result && result.anomaly === "CURRENCY_MISMATCH") {
    throw new Error("Payment currency mismatch.");
  }
  if ("anomaly" in result && result.anomaly === "AMOUNT_MISMATCH") {
    throw new Error("Payment amount mismatch.");
  }

  if (!result.idempotent) {
    void sendPaymentConfirmationEmail(input.paymentId).catch((err) => {
      console.error("[billing:payment-email]", err instanceof Error ? err.message : err);
    });
  }

  return result;
}

export async function recordManualPayment(input: {
  invoiceId: string;
  amountMinor: number;
  method: AgencyPaymentMethod;
  reference?: string | null;
  note?: string | null;
  recordedById: string;
}) {
  const invoice = await prisma.agencyInvoice.findUniqueOrThrow({ where: { id: input.invoiceId } });
  if (!["ISSUED", "PARTIALLY_PAID"].includes(invoice.status)) {
    throw new Error("Invoice is not open for payment.");
  }
  if (input.amountMinor > invoice.amountDueMinor) {
    throw new Error("Payment exceeds invoice balance.");
  }

  const paymentRef = await generatePaymentReference();
  const payment = await prisma.agencyPayment.create({
    data: {
      paymentReference: paymentRef,
      companyId: invoice.companyId,
      contactId: invoice.primaryContactId,
      provider: "MANUAL",
      status: "PENDING",
      currency: invoice.currency,
      amountMinor: input.amountMinor,
      method: input.method,
      source: "ADMIN_MANUAL",
      recordedById: input.recordedById,
      manualNote: input.note ?? null,
      providerReference: input.reference ?? null,
      metadataJson: { recordedManually: true },
      allocations: {
        create: { invoiceId: input.invoiceId, amountMinor: input.amountMinor },
      },
    },
  });

  await confirmPaymentSuccess({
    paymentId: payment.id,
    amountMinor: input.amountMinor,
    currency: invoice.currency,
    method: input.method,
    source: "ADMIN_MANUAL",
    actorUserId: input.recordedById,
    providerReference: input.reference ?? paymentRef,
  });

  await recordBillingActivity({
    invoiceId: input.invoiceId,
    paymentId: payment.id,
    type: "MANUAL_PAYMENT_RECORDED",
    summary: "Manual payment recorded.",
    actorUserId: input.recordedById,
  });

  return payment;
}

export async function initiateInvoicePayment(input: {
  invoiceId: string;
  portalUserId: string;
  contactId: string;
  clientRequestId?: string;
}) {
  const invoice = await prisma.agencyInvoice.findUniqueOrThrow({ where: { id: input.invoiceId } });
  if (!["ISSUED", "PARTIALLY_PAID"].includes(invoice.status)) {
    throw new Error("Invoice is not payable.");
  }
  if (invoice.amountDueMinor <= 0) throw new Error("Nothing due on this invoice.");

  if (input.clientRequestId) {
    const existing = await prisma.agencyPayment.findFirst({
      where: {
        clientRequestId: input.clientRequestId,
        status: { in: ["PENDING", "SUCCEEDED"] },
      },
    });
    if (existing) return existing;
  }

  const paymentRef = await generatePaymentReference();
  const payment = await prisma.agencyPayment.create({
    data: {
      paymentReference: paymentRef,
      companyId: invoice.companyId,
      contactId: input.contactId,
      provider: getConfiguredProvider(),
      status: "PENDING",
      currency: invoice.currency,
      amountMinor: invoice.amountDueMinor,
      method: "CARD",
      source: "PORTAL",
      clientRequestId: input.clientRequestId ?? null,
      providerReference: paymentRef,
      allocations: {
        create: { invoiceId: input.invoiceId, amountMinor: invoice.amountDueMinor },
      },
    },
  });

  await recordBillingActivity({
    invoiceId: input.invoiceId,
    paymentId: payment.id,
    type: "PAYMENT_INITIATED",
    summary: "Online payment initiated.",
    actorPortalUserId: input.portalUserId,
    clientVisible: true,
  });

  return payment;
}

export function getConfiguredProvider(): AgencyPaymentProvider {
  if (process.env.PAYSTACK_SECRET_KEY?.trim()) return "PAYSTACK";
  return "MANUAL";
}

export function isOnlinePaymentsEnabled() {
  return Boolean(process.env.PAYSTACK_SECRET_KEY?.trim());
}

export async function listPayments(input?: { page?: number; pageSize?: number }) {
  const page = Math.max(1, input?.page ?? 1);
  const pageSize = Math.min(50, input?.pageSize ?? 25);
  const [items, total] = await Promise.all([
    prisma.agencyPayment.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        contact: { select: { id: true, displayName: true, email: true } },
        allocations: { include: { invoice: { select: { id: true, invoiceNumber: true } } } },
      },
    }),
    prisma.agencyPayment.count(),
  ]);
  return { items, total, page, pageSize };
}
