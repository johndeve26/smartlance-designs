import { describe, expect, it } from "vitest";
import { formatDate, formatDateShort, formatDateTime } from "@/lib/ui/format";

describe("formatDate", () => {
  it("formats with default short month style", () => {
    expect(formatDate("2026-01-15T12:00:00.000Z")).toBe("Jan 15, 2026");
  });

  it("supports dateStyle without mixing component options", () => {
    expect(
      formatDate("2026-01-15T12:00:00.000Z", { dateStyle: "long" }),
    ).toBe("January 15, 2026");
  });

  it("returns null for invalid dates", () => {
    expect(formatDate("not-a-date")).toBeNull();
    expect(formatDate(null)).toBeNull();
  });
});

describe("formatDateTime", () => {
  it("includes date and time", () => {
    const value = formatDateTime("2026-01-15T14:30:00.000Z");
    expect(value).toMatch(/January 15, 2026/);
    expect(value).toMatch(/\d/);
  });
});

describe("formatDateShort", () => {
  it("omits year", () => {
    expect(formatDateShort("2026-01-15T12:00:00.000Z")).toBe("Jan 15");
  });
});
