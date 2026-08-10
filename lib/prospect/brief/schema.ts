import { websiteProjectBriefTemplate } from "@/data/templates/website-project-brief-template";
import { isTemplateFieldVisible } from "@/data/templates";
import type { TemplateField } from "@/data/resource-content-types";
import {
  isTemplateFieldFilled,
  type TemplateValues,
} from "@/components/templates/brief-plain-text";
import {
  PROSPECT_BRIEF_SCHEMA_VERSION,
  PROSPECT_BRIEF_TEMPLATE_SLUG,
} from "@/lib/prospect/constants";

export const briefTemplate = websiteProjectBriefTemplate;
export const briefTemplateSlug = PROSPECT_BRIEF_TEMPLATE_SLUG;

export function getBriefSections() {
  return briefTemplate.sections;
}

export function getBriefSectionCount() {
  return briefTemplate.sections.length;
}

export function isBriefFieldVisible(
  field: TemplateField,
  values: TemplateValues,
): boolean {
  return isTemplateFieldVisible(field, values);
}

export function calculateBriefCompletion(values: TemplateValues): {
  completionPercent: number;
  completedSectionIds: string[];
} {
  const sections = briefTemplate.sections;
  const completedSectionIds: string[] = [];

  for (const section of sections) {
    const visibleFields = section.fields.filter((f) =>
      isTemplateFieldVisible(f, values),
    );
    if (visibleFields.length === 0) {
      completedSectionIds.push(section.id);
      continue;
    }
    const filledCount = visibleFields.filter((f) =>
      isTemplateFieldFilled(f, values),
    ).length;
    if (filledCount >= Math.ceil(visibleFields.length * 0.5)) {
      completedSectionIds.push(section.id);
    }
  }

  const completionPercent = Math.round(
    (completedSectionIds.length / sections.length) * 100,
  );

  return { completionPercent, completedSectionIds };
}

export function validateBriefAnswers(
  answers: unknown,
): answers is TemplateValues {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    return false;
  }
  for (const value of Object.values(answers)) {
    if (typeof value === "string") continue;
    if (
      Array.isArray(value) &&
      value.every((item) => typeof item === "string")
    ) {
      continue;
    }
    return false;
  }
  return true;
}

export function deriveBriefTitle(values: TemplateValues): string {
  const projectName = values["project-name"];
  const businessName = values["business-name"];
  const projectType = values["project-type"];

  if (typeof projectName === "string" && projectName.trim()) {
    return projectName.trim();
  }
  if (typeof businessName === "string" && businessName.trim()) {
    const typeLabel =
      typeof projectType === "string"
        ? briefTemplate.sections
            .flatMap((s) => s.fields)
            .find((f) => f.id === "project-type")
            ?.kind === "radio"
          ? (
              briefTemplate.sections
                .flatMap((s) => s.fields)
                .find((f) => f.id === "project-type") as {
                options: { value: string; label: string }[];
              }
            ).options.find((o) => o.value === projectType)?.label
          : null
        : null;
    return typeLabel
      ? `${businessName.trim()} — ${typeLabel}`
      : `${businessName.trim()} Website Brief`;
  }
  return "Website Project Brief";
}

export function deriveProjectType(values: TemplateValues): string | null {
  const projectType = values["project-type"];
  return typeof projectType === "string" ? projectType : null;
}

export { PROSPECT_BRIEF_SCHEMA_VERSION };
