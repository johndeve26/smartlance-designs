import {
  CRM_PROPERTY_OPTION_LABEL_MAX,
  CRM_PROPERTY_OPTION_MAX,
  CRM_PROPERTY_KEY_MAX,
  type PropertySelectOption,
} from "@/lib/crm/properties/constants";

function slugOptionKey(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, CRM_PROPERTY_KEY_MAX);
}

export function parsePropertyOptions(def: { optionsJson?: unknown | null }): PropertySelectOption[] {
  if (!def.optionsJson || !Array.isArray(def.optionsJson)) return [];
  return (def.optionsJson as PropertySelectOption[]).slice().sort((a, b) => a.displayOrder - b.displayOrder);
}

export function createOptionKey(label: string, existingKeys: Set<string>): string {
  let base = slugOptionKey(label.replace(/\s+/g, "_")) || "option";
  if (!existingKeys.has(base)) return base;
  let i = 2;
  while (existingKeys.has(`${base}_${i}`)) i++;
  return `${base}_${i}`;
}

export function normalizePropertyOptions(input: PropertySelectOption[]): PropertySelectOption[] {
  if (!input.length) throw new Error("Select properties require at least one option.");
  if (input.length > CRM_PROPERTY_OPTION_MAX) throw new Error("Too many options.");

  const keys = new Set<string>();
  return input.map((opt, idx) => {
    const label = opt.label.trim().slice(0, CRM_PROPERTY_OPTION_LABEL_MAX);
    if (!label) throw new Error("Option label required.");
    const key = opt.key?.trim() || createOptionKey(label, keys);
    if (keys.has(key)) throw new Error(`Duplicate option key: ${key}`);
    keys.add(key);
    return {
      key,
      label,
      displayOrder: opt.displayOrder ?? idx,
      isActive: opt.isActive ?? true,
    };
  });
}

export function optionLabelByKey(
  def: { optionsJson?: unknown | null },
  key: string,
): string {
  const opt = parsePropertyOptions(def).find((o) => o.key === key);
  return opt?.label ?? key;
}
