import { describe, expect, it } from "vitest";

function formatProjectNumber(year: number, sequence: number) {
  return `SL-${year}-${String(sequence).padStart(4, "0")}`;
}

describe("agency project number format", () => {
  it("formats SL-YYYY-#### with zero padding", () => {
    expect(formatProjectNumber(2026, 12)).toBe("SL-2026-0012");
    expect(formatProjectNumber(2026, 1)).toBe("SL-2026-0001");
    expect(formatProjectNumber(2026, 9999)).toBe("SL-2026-9999");
  });
});
