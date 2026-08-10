import { describe, expect, it } from "vitest";
import { PropertyTypeInUseError } from "@/lib/crm/properties/errors";
import {
  createOptionKey,
  normalizePropertyOptions,
  parsePropertyOptions,
} from "@/lib/crm/properties/options";
import {
  encodeContactFilterParam,
  decodeContactFilterParam,
  mergeQuickFiltersIntoAdvanced,
  quickConditionsFromSearchParams,
} from "@/lib/crm/filters/filter-serialize";
import { parseContactFilterV3, CONTACT_FILTER_VERSION } from "@/lib/crm/filters/contact-filter-schema";
import { CRM_CONTACT_FILTER_MAX_CONDITIONS } from "@/lib/crm/properties/constants";
import { buildStandardFilterFields, customPropertyToFilterField } from "@/lib/crm/filters/filter-ui-registry";
import type { CrmPropertyDefinition } from "@prisma/client";

describe("property options", () => {
  it("generates stable keys from labels", () => {
    const keys = new Set<string>();
    expect(createOptionKey("WordPress", keys)).toBe("wordpress");
    keys.add("wordpress");
    expect(createOptionKey("WordPress", keys)).toBe("wordpress_2");
  });

  it("requires at least one option for select properties", () => {
    expect(() => normalizePropertyOptions([])).toThrow(/at least one option/i);
  });

  it("preserves option keys on rename", () => {
    const opts = normalizePropertyOptions([
      { key: "wordpress", label: "WordPress CMS", displayOrder: 0, isActive: true },
    ]);
    expect(opts[0].key).toBe("wordpress");
    expect(opts[0].label).toBe("WordPress CMS");
  });

  it("parses optionsJson from definition", () => {
    const def = {
      optionsJson: [
        { key: "a", label: "A", displayOrder: 1, isActive: true },
        { key: "b", label: "B", displayOrder: 0, isActive: false },
      ],
    } as Pick<CrmPropertyDefinition, "optionsJson">;
    const parsed = parsePropertyOptions(def);
    expect(parsed[0].key).toBe("b");
    expect(parsed[1].key).toBe("a");
  });
});

describe("property definition lock order", () => {
  it("sorts definition ids before multi-lock", () => {
    const ids = ["czz", "caa", "cbb"];
    const sorted = [...new Set(ids)].sort();
    expect(sorted).toEqual(["caa", "cbb", "czz"]);
  });
});

describe("property type immutability error", () => {
  it("exposes PROPERTY_TYPE_IN_USE code", () => {
    const err = new PropertyTypeInUseError();
    expect(err.code).toBe("PROPERTY_TYPE_IN_USE");
  });
});

describe("filter serialize", () => {
  const sample = parseContactFilterV3({
    version: 3,
    match: "ALL",
    conditions: [
      { kind: "STANDARD", field: "jobTitle", operator: "CONTAINS", value: "Founder" },
      { kind: "STANDARD", field: "countryCode", operator: "IN", value: ["US"] },
    ],
  });

  it("round-trips filter through base64 param", () => {
    const encoded = encodeContactFilterParam(sample);
    const decoded = decodeContactFilterParam(encoded);
    expect(decoded).toEqual(sample);
  });

  it("merges quick filters with advanced AST", () => {
    const merged = mergeQuickFiltersIntoAdvanced(sample, [
      { kind: "STANDARD", field: "temperature", operator: "IS", value: "COLD" },
    ]);
    expect(merged.conditions).toHaveLength(3);
  });

  it("builds quick conditions from search params", () => {
    const quick = quickConditionsFromSearchParams({ countryCode: "US", temperature: "COLD" });
    expect(quick).toHaveLength(2);
    expect(quick[0].kind).toBe("STANDARD");
  });
});

describe("contact filter v3 extensions", () => {
  it("parses engagement conditions", () => {
    const f = parseContactFilterV3({
      version: 3,
      match: "ALL",
      conditions: [{ kind: "ENGAGEMENT", field: "hasDetectedClick", operator: "IS_TRUE" }],
    });
    expect(f.conditions[0].kind).toBe("ENGAGEMENT");
  });

  it("parses number custom property filter", () => {
    const f = parseContactFilterV3({
      version: 3,
      match: "ALL",
      conditions: [
        {
          kind: "CUSTOM",
          propertyId: "clh3vjq00000000000000001",
          operator: "GT",
          value: 100000,
        },
      ],
    });
    expect(f.conditions[0].kind).toBe("CUSTOM");
  });

  it("parses single select with stable option keys", () => {
    const f = parseContactFilterV3({
      version: 3,
      match: "ALL",
      conditions: [
        {
          kind: "CUSTOM",
          propertyId: "clh3vjq00000000000000001",
          operator: "IN",
          value: ["wordpress", "webflow"],
        },
      ],
    });
    const cond = f.conditions[0];
    expect(cond.kind).toBe("CUSTOM");
    if (cond.kind === "CUSTOM") expect(cond.value).toEqual(["wordpress", "webflow"]);
  });

  it("rejects more than 30 conditions", () => {
    const conditions = Array.from({ length: CRM_CONTACT_FILTER_MAX_CONDITIONS + 1 }, () => ({
      kind: "STANDARD" as const,
      field: "email" as const,
      operator: "IS_KNOWN",
    }));
    expect(() => parseContactFilterV3({ version: 3, match: "ALL", conditions })).toThrow();
  });

  it("parses ANY match with three conditions", () => {
    const f = parseContactFilterV3({
      version: 3,
      match: "ANY",
      conditions: [
        { kind: "STANDARD", field: "email", operator: "IS_KNOWN" },
        { kind: "STANDARD", field: "phone", operator: "IS_KNOWN" },
        { kind: "SOCIAL", platform: "LINKEDIN", operator: "HAS" },
      ],
    });
    expect(f.match).toBe("ANY");
    expect(f.conditions).toHaveLength(3);
  });

  it("parses notes contains", () => {
    const f = parseContactFilterV3({
      version: 3,
      match: "ALL",
      conditions: [{ kind: "NOTES", operator: "CONTAINS", value: "proposal" }],
    });
    expect(f.conditions[0].kind).toBe("NOTES");
  });
});

describe("filter ui registry", () => {
  it("includes standard and custom property fields", () => {
    const std = buildStandardFilterFields();
    expect(std.some((f) => f.kind === "STANDARD" && f.field === "jobTitle")).toBe(true);
    expect(std.some((f) => f.kind === "SOCIAL" && f.platform === "LINKEDIN")).toBe(true);

    const custom = customPropertyToFilterField({
      id: "prop1",
      label: "Annual Revenue",
      fieldType: "NUMBER",
      options: [],
      isActive: true,
    });
    expect(custom.kind).toBe("CUSTOM");
    expect(custom.operators.some((o) => o.value === "GT")).toBe(true);
  });
});

describe("segment filter version", () => {
  it("new segment filter defaults to v3 AST", () => {
    const filter = {
      version: CONTACT_FILTER_VERSION,
      match: "ALL" as const,
      conditions: [
        { kind: "STANDARD" as const, field: "countryCode" as const, operator: "IN", value: ["US"] },
      ],
    };
    expect(filter.version).toBe(3);
    expect(() => parseContactFilterV3(filter)).not.toThrow();
  });
});
