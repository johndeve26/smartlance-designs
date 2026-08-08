/**
 * Published Templates registry.
 * Only include Templates that are ready to ship — no placeholders.
 */

import type {
  TemplateContent,
  TemplateField,
} from "@/data/resource-content-types";
import { websiteProjectBriefTemplate } from "@/data/templates/website-project-brief-template";

export const templates: TemplateContent[] = [websiteProjectBriefTemplate];

export function getPublishedTemplates(): TemplateContent[] {
  return templates.filter((item) => item.published);
}

export function getTemplateBySlug(slug: string): TemplateContent | undefined {
  return getPublishedTemplates().find((item) => item.slug === slug);
}

export function getTemplateSectionCount(template: TemplateContent): number {
  return template.sections.length;
}

export function getTemplateFieldCount(template: TemplateContent): number {
  return template.sections.reduce(
    (total, section) => total + section.fields.length,
    0,
  );
}

export function getTemplateNav(template: TemplateContent) {
  return template.sections.map((section, index) => ({
    id: section.id,
    title: section.title,
    number: String(index + 1).padStart(2, "0"),
  }));
}

export function isTemplateFieldVisible(
  field: TemplateField,
  values: Record<string, string | string[]>,
): boolean {
  if (!field.showWhenAny || field.showWhenAny.length === 0) {
    return true;
  }

  return field.showWhenAny.some((condition) => {
    const current = values[condition.fieldId];
    if (current === undefined) return false;
    if (typeof current === "string") {
      return condition.values.includes(current);
    }
    return current.some((value) => condition.values.includes(value));
  });
}
