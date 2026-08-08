import type {
  TemplateContent,
  TemplateField,
} from "@/data/resource-content-types";

/**
 * Plain-text Project Brief export helpers.
 *
 * Conditional fields: values may remain in localStorage when a trigger is
 * deselected (so switching back restores answers). Summary and copy always
 * filter with `isTemplateFieldVisible` so hidden fields never appear.
 */

export type TemplateValues = Record<string, string | string[]>;

export function isTemplateFieldFilled(
  field: TemplateField,
  values: TemplateValues,
): boolean {
  const value = values[field.id];
  if (value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  return Array.isArray(value) && value.length > 0;
}

/** Resolve a filled field to a human-readable string, or null if empty. */
export function getFieldDisplayValue(
  field: TemplateField,
  values: TemplateValues,
): string | null {
  if (!isTemplateFieldFilled(field, values)) return null;

  const value = values[field.id];

  if (field.kind === "checkboxGroup") {
    const selected = value as string[];
    return selected
      .map((v) => field.options.find((o) => o.value === v)?.label ?? v)
      .join(", ");
  }

  if (field.kind === "radio" || field.kind === "select") {
    const v = value as string;
    return field.options.find((o) => o.value === v)?.label ?? v;
  }

  return (value as string).trim();
}

export function countStartedSections(
  template: TemplateContent,
  values: TemplateValues,
  isVisible: (field: TemplateField, values: TemplateValues) => boolean,
): number {
  let count = 0;
  for (const section of template.sections) {
    const started = section.fields.some(
      (field) =>
        isVisible(field, values) && isTemplateFieldFilled(field, values),
    );
    if (started) count += 1;
  }
  return count;
}

export function buildBriefPlainText(
  template: TemplateContent,
  values: TemplateValues,
  isVisible: (field: TemplateField, values: TemplateValues) => boolean,
): string {
  const lines: string[] = ["WEBSITE PROJECT BRIEF", template.title, ""];

  for (const section of template.sections) {
    const fieldBlocks: string[] = [];

    for (const field of section.fields) {
      if (!isVisible(field, values)) continue;
      const display = getFieldDisplayValue(field, values);
      if (!display) continue;
      fieldBlocks.push(`${field.label}:`);
      fieldBlocks.push(display);
      fieldBlocks.push("");
    }

    if (fieldBlocks.length === 0) continue;

    lines.push(section.title.toUpperCase());
    lines.push(...fieldBlocks);
  }

  return `${lines.join("\n").trimEnd()}\n`;
}
