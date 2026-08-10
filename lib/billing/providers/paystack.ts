import { createHmac } from "node:crypto";
import type { PaymentProviderAdapter } from "@/lib/billing/providers/types";

function secretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  return key;
}

export const paystackProvider: PaymentProviderAdapter = {
  name: "PAYSTACK",

  async createCheckout(input) {
    try {
      const res = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: input.email,
          amount: input.amountMinor,
          currency: input.currency.toUpperCase(),
          reference: input.paymentId,
          callback_url: input.callbackUrl,
          metadata: { invoiceId: input.invoiceId, paymentId: input.paymentId },
        }),
      });
      const json = (await res.json()) as {
        status?: boolean;
        message?: string;
        data?: { authorization_url?: string; reference?: string };
      };
      if (!json.status || !json.data?.authorization_url) {
        return { ok: false, errorMessage: json.message ?? "Paystack initialization failed." };
      }
      return {
        ok: true,
        authorizationUrl: json.data.authorization_url,
        providerReference: json.data.reference ?? input.paymentId,
      };
    } catch (err) {
      return {
        ok: false,
        errorMessage: err instanceof Error ? err.message : "Paystack request failed.",
      };
    }
  },

  async verifyTransaction(input) {
    try {
      const res = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(input.providerReference)}`,
        { headers: { Authorization: `Bearer ${secretKey()}` } },
      );
      const json = (await res.json()) as {
        status?: boolean;
        data?: {
          status?: string;
          id?: number;
          reference?: string;
          amount?: number;
          currency?: string;
        };
        message?: string;
      };
      if (!json.status || !json.data) {
        return { ok: false, status: "failed", errorMessage: json.message ?? "Verification failed." };
      }
      const success = json.data.status === "success";
      return {
        ok: success,
        status: success ? "success" : json.data.status === "pending" ? "pending" : "failed",
        providerTransactionId: json.data.id != null ? String(json.data.id) : undefined,
        providerReference: json.data.reference,
        amountMinor: json.data.amount,
        currency: json.data.currency,
      };
    } catch (err) {
      return {
        ok: false,
        status: "failed",
        errorMessage: err instanceof Error ? err.message : "Verification failed.",
      };
    }
  },

  verifyWebhookSignature(input) {
    const hash = createHmac("sha512", secretKey()).update(input.rawBody).digest("hex");
    return hash === input.signature;
  },

  parseWebhook(input) {
    try {
      const body = JSON.parse(input.rawBody) as {
        event?: string;
        data?: {
          id?: number;
          reference?: string;
          status?: string;
          amount?: number;
          currency?: string;
        };
      };
      const data = body.data;
      if (!body.event || !data?.reference) {
        return { ok: false, errorMessage: "Invalid webhook payload." };
      }
      const success = data.status === "success";
      return {
        ok: true,
        eventId: `${body.event}:${data.id ?? data.reference}`,
        eventType: body.event,
        providerReference: data.reference,
        providerTransactionId: data.id != null ? String(data.id) : undefined,
        amountMinor: data.amount,
        currency: data.currency,
        status: success ? "success" : data.status === "pending" ? "pending" : "failed",
      };
    } catch {
      return { ok: false, errorMessage: "Could not parse webhook." };
    }
  },
};
