import { prisma } from "@/lib/db";
import { hashWebhookPayload } from "@/lib/billing/snapshot-hash";
import { confirmPaymentSuccess } from "@/lib/billing/payments";
import { getPaymentProvider } from "@/lib/billing/providers";

export async function processPaymentWebhook(input: {
  provider: "PAYSTACK";
  rawBody: string;
  signature?: string | null;
}) {
  const provider = getPaymentProvider();
  if (provider.name !== input.provider) {
    throw new Error("Provider mismatch.");
  }
  if (provider.verifyWebhookSignature) {
    if (!input.signature || !provider.verifyWebhookSignature({ rawBody: input.rawBody, signature: input.signature })) {
      throw new Error("Invalid webhook signature.");
    }
  }
  if (!provider.parseWebhook) throw new Error("Provider does not support webhooks.");

  const parsed = provider.parseWebhook({ rawBody: input.rawBody });
  if (!parsed.ok || !parsed.eventId) {
    throw new Error(parsed.errorMessage ?? "Invalid webhook.");
  }

  const payloadHash = hashWebhookPayload(input.rawBody);
  const existing = await prisma.agencyPaymentWebhookEvent.findUnique({
    where: {
      provider_providerEventId: { provider: input.provider, providerEventId: parsed.eventId },
    },
  });
  if (existing?.status === "PROCESSED") {
    return { duplicate: true as const };
  }

  const event = await prisma.agencyPaymentWebhookEvent.upsert({
    where: {
      provider_providerEventId: { provider: input.provider, providerEventId: parsed.eventId },
    },
    create: {
      provider: input.provider,
      providerEventId: parsed.eventId,
      eventType: parsed.eventType ?? "unknown",
      payloadHash,
      status: "RECEIVED",
    },
    update: {},
  });

  if (parsed.status !== "success" || !parsed.providerReference) {
    await prisma.agencyPaymentWebhookEvent.update({
      where: { id: event.id },
      data: { status: "IGNORED", processedAt: new Date() },
    });
    return { ignored: true as const };
  }

  const payment = await prisma.agencyPayment.findFirst({
    where: {
      OR: [
        { id: parsed.providerReference },
        { providerReference: parsed.providerReference },
        { paymentReference: parsed.providerReference },
      ],
    },
  });
  if (!payment) {
    await prisma.agencyPaymentWebhookEvent.update({
      where: { id: event.id },
      data: { status: "FAILED", errorSafe: "Unknown payment reference.", processedAt: new Date() },
    });
    return { unknown: true as const };
  }

  try {
    await confirmPaymentSuccess({
      paymentId: payment.id,
      providerTransactionId: parsed.providerTransactionId,
      providerReference: parsed.providerReference,
      amountMinor: parsed.amountMinor ?? payment.amountMinor,
      currency: parsed.currency ?? payment.currency,
      source: "WEBHOOK",
    });
    await prisma.agencyPaymentWebhookEvent.update({
      where: { id: event.id },
      data: { status: "PROCESSED", paymentId: payment.id, processedAt: new Date() },
    });
    return { processed: true as const, paymentId: payment.id };
  } catch (err) {
    await prisma.agencyPaymentWebhookEvent.update({
      where: { id: event.id },
      data: {
        status: "FAILED",
        paymentId: payment.id,
        errorSafe: err instanceof Error ? err.message.slice(0, 500) : "Processing failed",
      },
    });
    throw err;
  }
}

export async function verifyPaymentOnReturn(providerReference: string) {
  const provider = getPaymentProvider();
  const result = await provider.verifyTransaction({ providerReference });
  if (!result.ok || result.status !== "success") {
    return { confirmed: false as const, status: result.status };
  }

  const payment = await prisma.agencyPayment.findFirst({
    where: {
      OR: [
        { id: providerReference },
        { providerReference },
        { paymentReference: providerReference },
      ],
    },
  });
  if (!payment) return { confirmed: false as const, status: "failed" as const };

  await confirmPaymentSuccess({
    paymentId: payment.id,
    providerTransactionId: result.providerTransactionId,
    providerReference: result.providerReference ?? providerReference,
    amountMinor: result.amountMinor ?? payment.amountMinor,
    currency: result.currency ?? payment.currency,
    source: "VERIFY",
  });

  const allocation = await prisma.agencyPaymentAllocation.findFirst({
    where: { paymentId: payment.id },
    select: { invoiceId: true },
  });

  return {
    confirmed: true as const,
    paymentId: payment.id,
    invoiceId: allocation?.invoiceId,
  };
}
