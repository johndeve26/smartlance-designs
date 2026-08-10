import { describe, expect, it } from "vitest";
import { splitByPercentages, calculateInvoiceTotals, decimalToMinorUnits } from "@/lib/money/minor-units";

describe("money minor units", () => {
  it("calculates line item totals without float drift", () => {
    const totals = calculateInvoiceTotals({
      lineItems: [
        { amountMinor: 3333 },
        { amountMinor: 3333 },
        { amountMinor: 3334 },
      ],
    });
    expect(totals.subtotalMinor).toBe(10000);
    expect(totals.totalMinor).toBe(10000);
  });

  it("splits percentages with remainder on last installment", () => {
    const parts = splitByPercentages(10001, [5000, 3000, 2000]);
    expect(parts.reduce((s, p) => s + p, 0)).toBe(10001);
    expect(parts).toEqual([5000, 3000, 2001]);
  });

  it("converts decimal USD to minor units", () => {
    expect(decimalToMinorUnits("100.00", "USD")).toBe(10000);
    expect(decimalToMinorUnits("99.99", "USD")).toBe(9999);
  });
});

describe("derive invoice status", () => {
  it("detects overdue display state", async () => {
    const { isInvoiceOverdue, displayInvoiceStatus } = await import("@/lib/billing/display");
    const past = new Date(Date.now() - 86400000);
    expect(
      isInvoiceOverdue({ status: "ISSUED", dueDate: past, amountDueMinor: 100 }),
    ).toBe(true);
    expect(
      displayInvoiceStatus({ status: "ISSUED", dueDate: past, amountDueMinor: 100 }),
    ).toBe("OVERDUE");
  });
});
