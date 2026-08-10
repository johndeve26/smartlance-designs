import { describe, expect, it } from "vitest";
import { normalizeCountryInput } from "@/lib/crm/country";
import { validateSocialProfileUrl } from "@/lib/crm/social";
import { assertPropertyKeyAllowed } from "@/lib/crm/properties/definitions";
import { validatePropertyValueInput } from "@/lib/crm/properties/validate";
import { parseContactFilterV3 } from "@/lib/crm/filters/contact-filter-schema";
import type { CrmPropertyDefinition } from "@prisma/client";

describe("country normalization", () => {
  it("normalizes United States to US", () => {
    const c = normalizeCountryInput("United States");
    expect(c?.countryCode).toBe("US");
    expect(c?.countryName).toBeTruthy();
  });

  it("accepts NG code", () => {
    const c = normalizeCountryInput("NG");
    expect(c?.countryCode).toBe("NG");
  });

  it("returns null for unknown country", () => {
    expect(normalizeCountryInput("Atlantis")).toBeNull();
  });
});

describe("social URL validation", () => {
  it("accepts linkedin https URL", () => {
    const r = validateSocialProfileUrl("LINKEDIN", "https://www.linkedin.com/in/jane");
    expect(r.ok).toBe(true);
  });

  it("rejects javascript URLs", () => {
    const r = validateSocialProfileUrl("OTHER", "javascript:alert(1)");
    expect(r.ok).toBe(false);
  });
});

describe("property keys", () => {
  it("rejects reserved email key", () => {
    expect(() => assertPropertyKeyAllowed("email")).toThrow(/reserved/);
  });
});

describe("property value validation", () => {
  const numberDef = {
    id: "1",
    objectType: "CONTACT",
    label: "Annual Revenue",
    key: "annual_revenue",
    fieldType: "NUMBER",
    isActive: true,
    optionsJson: null,
  } as CrmPropertyDefinition;

  it("accepts numeric value", () => {
    const r = validatePropertyValueInput(numberDef, "50000");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.numberValue).toBe(50000);
  });

  it("rejects non-numeric", () => {
    const r = validatePropertyValueInput(numberDef, "large");
    expect(r.ok).toBe(false);
  });
});

describe("contact filter v3", () => {
  it("parses ALL match filter", () => {
    const f = parseContactFilterV3({
      version: 3,
      match: "ALL",
      conditions: [
        { kind: "STANDARD", field: "countryCode", operator: "IS", value: "US" },
        { kind: "SOCIAL", platform: "LINKEDIN", operator: "HAS" },
      ],
    });
    expect(f.conditions).toHaveLength(2);
  });

  it("rejects raw prisma keys", () => {
    expect(() =>
      parseContactFilterV3({
        version: 3,
        match: "ALL",
        OR: [{ email: "x" }],
      } as never),
    ).toThrow();
  });
});
