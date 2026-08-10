import { currencyExponent, assertSupportedCurrency } from "@/lib/money/currency";

/** Convert major units (e.g. dollars) to integer minor units (e.g. cents). */
export function toMinorUnits(amountMajor: number | string, currency: string): number {
  const exp = currencyExponent(currency);
  const factor = 10 ** exp;
  const n = typeof amountMajor === "string" ? Number(amountMajor) : amountMajor;
  if (!Number.isFinite(n)) throw new Error("Invalid amount.");
  return Math.round(n * factor);
}

/** Convert integer minor units to major units number (for display only). */
export function fromMinorUnits(minor: number, currency: string): number {
  assertSupportedCurrency(currency);
  const exp = currencyExponent(currency);
  return minor / 10 ** exp;
}

/** Convert Decimal/string accepted total from proposals to minor units. */
export function decimalToMinorUnits(value: unknown, currency: string): number {
  if (value == null) return 0;
  return toMinorUnits(Number(value), currency);
}

export function addMinor(a: number, b: number) {
  return a + b;
}

export function subtractMinor(a: number, b: number) {
  return a - b;
}

/** Split total into percentage-based installments; last absorbs rounding remainder. */
export function splitByPercentages(
  totalMinor: number,
  basisPoints: number[],
): number[] {
  if (basisPoints.length === 0) return [];
  const sumBp = basisPoints.reduce((s, bp) => s + bp, 0);
  if (sumBp !== 10000) {
    throw new Error("Installment percentages must sum to 100%.");
  }
  const amounts: number[] = [];
  let allocated = 0;
  for (let i = 0; i < basisPoints.length; i++) {
    if (i === basisPoints.length - 1) {
      amounts.push(totalMinor - allocated);
    } else {
      const part = Math.floor((totalMinor * basisPoints[i]!) / 10000);
      amounts.push(part);
      allocated += part;
    }
  }
  return amounts;
}

export function calculateLineItemMinor(input: {
  quantity: number;
  unitAmountMinor: number;
}) {
  return input.quantity * input.unitAmountMinor;
}

export function calculateInvoiceTotals(input: {
  lineItems: Array<{ amountMinor: number }>;
  discountMinor?: number;
  taxMinor?: number;
}) {
  const subtotalMinor = input.lineItems.reduce((s, li) => s + li.amountMinor, 0);
  const discountMinor = Math.max(0, input.discountMinor ?? 0);
  const taxMinor = Math.max(0, input.taxMinor ?? 0);
  const totalMinor = Math.max(0, subtotalMinor - discountMinor + taxMinor);
  return { subtotalMinor, discountMinor, taxMinor, totalMinor };
}
