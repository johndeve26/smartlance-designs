/** Supported billing currencies — aligned with proposal currencies. */
export const SUPPORTED_CURRENCIES = ["USD", "GBP", "EUR", "NGN", "CAD", "AUD"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

const EXPONENT: Record<SupportedCurrency, number> = {
  USD: 2,
  GBP: 2,
  EUR: 2,
  NGN: 2,
  CAD: 2,
  AUD: 2,
};

export function assertSupportedCurrency(currency: string): SupportedCurrency {
  const upper = currency.toUpperCase();
  if (!(SUPPORTED_CURRENCIES as readonly string[]).includes(upper)) {
    throw new Error(`Unsupported currency: ${currency}`);
  }
  return upper as SupportedCurrency;
}

export function currencyExponent(currency: string): number {
  return EXPONENT[assertSupportedCurrency(currency)];
}

export function currenciesMatch(a: string, b: string) {
  return a.toUpperCase() === b.toUpperCase();
}
