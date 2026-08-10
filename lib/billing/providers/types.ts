export type CheckoutSessionResult = {
  ok: boolean;
  authorizationUrl?: string;
  providerReference?: string;
  errorMessage?: string;
};

export type VerifyTransactionResult = {
  ok: boolean;
  status: "success" | "failed" | "pending";
  providerTransactionId?: string;
  providerReference?: string;
  amountMinor?: number;
  currency?: string;
  errorMessage?: string;
};

export type WebhookParseResult = {
  ok: boolean;
  eventId?: string;
  eventType?: string;
  providerReference?: string;
  providerTransactionId?: string;
  amountMinor?: number;
  currency?: string;
  status?: "success" | "failed" | "pending";
  errorMessage?: string;
};

export interface PaymentProviderAdapter {
  name: "MANUAL" | "PAYSTACK";
  createCheckout(input: {
    paymentId: string;
    amountMinor: number;
    currency: string;
    email: string;
    invoiceId: string;
    callbackUrl: string;
  }): Promise<CheckoutSessionResult>;
  verifyTransaction(input: { providerReference: string }): Promise<VerifyTransactionResult>;
  verifyWebhookSignature?(input: { rawBody: string; signature: string }): boolean;
  parseWebhook?(input: { rawBody: string }): WebhookParseResult;
}
