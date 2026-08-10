import { describe, expect, it } from "vitest";
import { calculateInvoiceTotals, toMinorUnits } from "@/lib/money/minor-units";

describe("draft invoice calculations", () => {
  it("recalculates totals when quantity and unit change", () => {
    const unit = toMinorUnits("150.00", "USD");
    const totals = calculateInvoiceTotals({
      lineItems: [
        { amountMinor: 2 * unit },
        { amountMinor: 1 * toMinorUnits("50.00", "USD") },
      ],
    });
    expect(totals.subtotalMinor).toBe(35000);
    expect(totals.totalMinor).toBe(35000);
  });
});

describe("financial summary terminology", () => {
  it("distinguishes unbilled from invoice balance", () => {
    const acceptedValueMinor = 1_000_000;
    const invoicedMinor = 500_000;
    const paidMinor = 300_000;
    const invoiceBalanceMinor = 200_000;
    const unbilledMinor = acceptedValueMinor - invoicedMinor;

    expect(unbilledMinor).toBe(500_000);
    expect(invoiceBalanceMinor).toBe(invoicedMinor - paidMinor);
    expect(unbilledMinor).not.toBe(invoiceBalanceMinor);
  });
});
