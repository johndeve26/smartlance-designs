"use server";

import { revalidatePath } from "next/cache";
import { assertSameOrigin } from "@/lib/admin/session";
import { initiatePaymentSchema } from "@/lib/billing/schema";
import { initiateInvoicePayment, isOnlinePaymentsEnabled } from "@/lib/billing/payments";
import { createCheckoutForPayment } from "@/lib/billing/providers";
import { verifyPaymentOnReturn } from "@/lib/billing/webhook";
import { assertInvoiceAccess, canPayInvoice } from "@/lib/billing/portal-access";
import { requirePortalUser } from "@/lib/portal/session";
import { prisma } from "@/lib/db";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

export async function portalInitiatePaymentAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requirePortalUser();
  const parsed = initiatePaymentSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false as const, error: "Invalid input." };

  try {
    await assertInvoiceAccess({
      invoiceId: parsed.data.invoiceId,
      portalUserId: user.id,
      contactId: user.contactId,
    });
    const canPay = await canPayInvoice({
      invoiceId: parsed.data.invoiceId,
      portalUserId: user.id,
      contactId: user.contactId,
    });
    if (!canPay) return { ok: false as const, error: "You are not authorized to pay this invoice." };

    if (!isOnlinePaymentsEnabled()) {
      return {
        ok: false as const,
        error: "Online payments are not configured. Please use the payment instructions provided or contact Smartlance.",
      };
    }

    const invoice = await prisma.agencyInvoice.findUniqueOrThrow({
      where: { id: parsed.data.invoiceId },
    });

    const payment = await initiateInvoicePayment({
      invoiceId: parsed.data.invoiceId,
      portalUserId: user.id,
      contactId: user.contactId,
      clientRequestId: parsed.data.clientRequestId,
    });

    const checkout = await createCheckoutForPayment({
      paymentId: payment.id,
      amountMinor: payment.amountMinor,
      currency: payment.currency,
      email: invoice.billingEmailSnapshot ?? user.email,
      invoiceId: invoice.id,
      callbackUrl: `${siteUrl()}/portal/billing/return?reference=${encodeURIComponent(payment.providerReference ?? payment.id)}`,
    });

    if (!checkout.ok || !checkout.authorizationUrl) {
      return { ok: false as const, error: checkout.errorMessage ?? "Could not start checkout." };
    }

    await prisma.agencyPayment.update({
      where: { id: payment.id },
      data: { providerReference: checkout.providerReference ?? payment.providerReference },
    });

    return { ok: true as const, redirectUrl: checkout.authorizationUrl };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not initiate payment.",
    };
  }
}

export async function portalVerifyPaymentReturn(reference: string) {
  const user = await requirePortalUser();
  const result = await verifyPaymentOnReturn(reference);
  revalidatePath("/portal/billing");
  if ("invoiceId" in result && result.invoiceId) {
    revalidatePath(`/portal/invoices/${result.invoiceId}`);
  } else if (result.paymentId) {
    const payment = await prisma.agencyPayment.findUnique({
      where: { id: result.paymentId },
      include: { allocations: true },
    });
    const invoiceId = payment?.allocations[0]?.invoiceId;
    if (invoiceId) revalidatePath(`/portal/invoices/${invoiceId}`);
    return { ...result, invoiceId, userId: user.id };
  }
  return { ...result, userId: user.id };
}
