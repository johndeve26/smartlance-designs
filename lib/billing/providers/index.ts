import { paystackProvider } from "@/lib/billing/providers/paystack";
import { manualProvider } from "@/lib/billing/providers/manual";
import type { PaymentProviderAdapter } from "@/lib/billing/providers/types";

export function getPaymentProvider(): PaymentProviderAdapter {
  if (process.env.PAYSTACK_SECRET_KEY?.trim()) return paystackProvider;
  return manualProvider;
}

export async function createCheckoutForPayment(input: {
  paymentId: string;
  amountMinor: number;
  currency: string;
  email: string;
  invoiceId: string;
  callbackUrl: string;
}) {
  return getPaymentProvider().createCheckout(input);
}

export async function verifyProviderPayment(input: { providerReference: string }) {
  return getPaymentProvider().verifyTransaction(input);
}
