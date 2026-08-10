import { describe, it, expect } from "vitest";
import { formatProposalNumber, parseProposalNumber } from "@/lib/proposals/proposal-number";
import { calculateLineItemAmount, calculateVersionPricing } from "@/lib/proposals/pricing";

describe("proposal number format", () => {
  it("formats PR-YYYY-####", () => {
    expect(formatProposalNumber(2026, 24)).toBe("PR-2026-0024");
    expect(parseProposalNumber("PR-2026-0024")).toEqual({ year: 2026, sequence: 24 });
  });
});

describe("proposal pricing", () => {
  it("calculates line item amount", () => {
    expect(Number(calculateLineItemAmount({ quantity: 2, unitPrice: 1500 }))).toBe(3000);
  });

  it("includes selected optional items in total", () => {
    const result = calculateVersionPricing({
      lineItems: [
        { id: "core", quantity: 1, unitPrice: 5000, isOptional: false, type: "SERVICE" },
        { id: "seo", quantity: 1, unitPrice: 800, isOptional: true, type: "ADD_ON" },
      ],
      selectedOptionalItemIds: ["seo"],
    });
    expect(Number(result.totalAmount)).toBe(5800);
  });

  it("ignores unselected optional items", () => {
    const result = calculateVersionPricing({
      lineItems: [
        { id: "core", quantity: 1, unitPrice: 5000, isOptional: false, type: "SERVICE" },
        { id: "seo", quantity: 1, unitPrice: 800, isOptional: true, type: "ADD_ON" },
      ],
      selectedOptionalItemIds: [],
    });
    expect(Number(result.totalAmount)).toBe(5000);
  });
});
