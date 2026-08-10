import { describe, expect, it } from "vitest";
import { deriveInvoiceStatus } from "@/lib/billing/display";

describe("billing invoice status derivation", () => {
  it("marks partially paid when balance remains", () => {
    expect(
      deriveInvoiceStatus({
        status: "ISSUED",
        totalMinor: 100000,
        amountPaidMinor: 40000,
        amountDueMinor: 60000,
      }),
    ).toBe("PARTIALLY_PAID");
  });

  it("marks paid when balance is zero", () => {
    expect(
      deriveInvoiceStatus({
        status: "PARTIALLY_PAID",
        totalMinor: 100000,
        amountPaidMinor: 100000,
        amountDueMinor: 0,
      }),
    ).toBe("PAID");
  });

  it("preserves void status", () => {
    expect(
      deriveInvoiceStatus({
        status: "VOID",
        totalMinor: 100000,
        amountPaidMinor: 0,
        amountDueMinor: 0,
      }),
    ).toBe("VOID");
  });
});
