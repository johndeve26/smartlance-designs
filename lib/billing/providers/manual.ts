import type { PaymentProviderAdapter } from "@/lib/billing/providers/types";

export const manualProvider: PaymentProviderAdapter = {
  name: "MANUAL",
  async createCheckout() {
    return {
      ok: false,
      errorMessage: "Online checkout is not configured. Contact Smartlance for payment instructions.",
    };
  },
  async verifyTransaction() {
    return { ok: false, status: "failed", errorMessage: "Manual provider cannot verify online transactions." };
  },
};
