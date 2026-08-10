import type { CrmPropertyDefinition, CrmPropertyFieldType } from "@prisma/client";
import { normalizeCrmEmail, normalizePhone } from "@/lib/crm/normalize";
import { isSafeHttpUrl } from "@/lib/crm/social";
import {
  CRM_MULTILINE_VALUE_MAX,
  CRM_MULTI_SELECT_CSV_DELIMITER,
  CRM_TEXT_VALUE_MAX,
  type PropertySelectOption,
} from "@/lib/crm/properties/constants";

export type ParsedPropertyValue = {
  textValue?: string | null;
  numberValue?: number | null;
  booleanValue?: boolean | null;
  dateValue?: Date | null;
  jsonValue?: string[] | null;
};

function parseOptions(def: CrmPropertyDefinition): PropertySelectOption[] {
  if (!def.optionsJson || !Array.isArray(def.optionsJson)) return [];
  return def.optionsJson as PropertySelectOption[];
}

function parseBoolean(raw: string): boolean | null {
  const v = raw.trim().toLowerCase();
  if (["true", "yes", "1", "y"].includes(v)) return true;
  if (["false", "no", "0", "n"].includes(v)) return false;
  return null;
}

function resolveSelectOption(
  def: CrmPropertyDefinition,
  raw: string,
): string | null {
  const v = raw.trim();
  if (!v) return null;
  const options = parseOptions(def).filter((o) => o.isActive);
  const byKey = options.find((o) => o.key.toLowerCase() === v.toLowerCase());
  if (byKey) return byKey.key;
  const byLabel = options.find((o) => o.label.toLowerCase() === v.toLowerCase());
  return byLabel?.key ?? null;
}

export function validatePropertyValueInput(
  def: CrmPropertyDefinition,
  raw: unknown,
): { ok: true; value: ParsedPropertyValue } | { ok: false; error: string } {
  if (raw == null || raw === "") {
    return { ok: true, value: {} };
  }

  switch (def.fieldType as CrmPropertyFieldType) {
    case "TEXT":
    case "URL":
    case "EMAIL":
    case "PHONE": {
      const s = String(raw).trim();
      if (s.length > CRM_TEXT_VALUE_MAX) return { ok: false, error: "Value too long." };
      if (def.fieldType === "URL" && s && !isSafeHttpUrl(s)) {
        return { ok: false, error: "Invalid URL." };
      }
      if (def.fieldType === "EMAIL" && s && !normalizeCrmEmail(s)) {
        return { ok: false, error: "Invalid email." };
      }
      if (def.fieldType === "PHONE" && s && !normalizePhone(s)) {
        return { ok: false, error: "Invalid phone." };
      }
      return { ok: true, value: { textValue: s || null } };
    }
    case "MULTILINE_TEXT": {
      const s = String(raw).trim();
      if (s.length > CRM_MULTILINE_VALUE_MAX) return { ok: false, error: "Value too long." };
      return { ok: true, value: { textValue: s || null } };
    }
    case "NUMBER": {
      const n = typeof raw === "number" ? raw : Number(String(raw).replace(/,/g, ""));
      if (!Number.isFinite(n)) return { ok: false, error: "Invalid number." };
      return { ok: true, value: { numberValue: n } };
    }
    case "BOOLEAN": {
      const b = typeof raw === "boolean" ? raw : parseBoolean(String(raw));
      if (b == null) return { ok: false, error: "Invalid boolean." };
      return { ok: true, value: { booleanValue: b } };
    }
    case "DATE": {
      if (typeof raw === "number") {
        return { ok: false, error: "Invalid date." };
      }
      const s = String(raw).trim();
      if (!s) return { ok: true, value: {} };
      if (/^\d+$/.test(s)) {
        return { ok: false, error: "Invalid date." };
      }
      const d = new Date(s);
      if (Number.isNaN(d.getTime())) return { ok: false, error: "Invalid date." };
      return { ok: true, value: { dateValue: d } };
    }
    case "SINGLE_SELECT": {
      const key = resolveSelectOption(def, String(raw));
      if (!key) return { ok: false, error: "Unknown option." };
      return { ok: true, value: { textValue: key } };
    }
    case "MULTI_SELECT": {
      const parts = String(raw)
        .split(CRM_MULTI_SELECT_CSV_DELIMITER)
        .map((p) => p.trim())
        .filter(Boolean);
      const keys: string[] = [];
      for (const part of parts) {
        const key = resolveSelectOption(def, part);
        if (!key) return { ok: false, error: `Unknown option: ${part}` };
        if (!keys.includes(key)) keys.push(key);
      }
      return { ok: true, value: { jsonValue: keys.length ? keys : null } };
    }
    default:
      return { ok: false, error: "Unsupported field type." };
  }
}

export function formatPropertyValueForDisplay(
  def: CrmPropertyDefinition,
  value: {
    textValue?: string | null;
    numberValue?: number | { toString(): string } | null;
    booleanValue?: boolean | null;
    dateValue?: Date | null;
    jsonValue?: unknown;
  },
): string {
  if (def.fieldType === "BOOLEAN") {
    if (value.booleanValue == null) return "—";
    return value.booleanValue ? "Yes" : "No";
  }
  if (def.fieldType === "NUMBER" && value.numberValue != null) {
    return value.numberValue.toString();
  }
  if (def.fieldType === "DATE" && value.dateValue) {
    return value.dateValue.toISOString().slice(0, 10);
  }
  if (def.fieldType === "SINGLE_SELECT" && value.textValue) {
    const opt = parseOptions(def).find((o) => o.key === value.textValue);
    return opt?.label ?? value.textValue;
  }
  if (def.fieldType === "MULTI_SELECT" && Array.isArray(value.jsonValue)) {
    const options = parseOptions(def);
    return value.jsonValue
      .map((k) => options.find((o) => o.key === k)?.label ?? k)
      .join(", ");
  }
  return value.textValue?.trim() || "—";
}
