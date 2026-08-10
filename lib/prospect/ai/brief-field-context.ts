import { websiteProjectBriefTemplate } from "@/data/templates/website-project-brief-template";
import { isTemplateFieldVisible } from "@/data/templates";
import {
  getFieldDisplayValue,
  type TemplateValues,
} from "@/components/templates/brief-plain-text";

const FIELD_WRITING_GUIDANCE: Record<string, string> = {
  "project-summary":
    "Write 3–5 sentences covering: what is being planned, who the site is for, the main business outcome expected, and why the project matters now.",
  "business-does":
    "Describe the business in plain language: industry, core offer, who you serve, and how you deliver value.",
  "main-services-products":
    "List the primary services or products the website should promote, grouped logically if helpful.",
  "primary-audiences":
    "Name 2–4 audience segments with a short note on what each needs from the site.",
  "website-goals":
    "State concrete goals (leads, bookings, sales, credibility, support) and how success might be judged.",
  "primary-cta":
    "Describe the main action visitors should take and where it should appear.",
  "pages-needed":
    "Outline required pages or sections and one-line purpose for each.",
  "must-have-features":
    "List required functionality with brief context on why each matters.",
  "content-status":
    "Explain what content exists, what needs writing, and who will supply it.",
  "brand-voice":
    "Describe tone, personality, and any words or styles to avoid.",
  "design-references":
    "Summarize reference sites or styles and what to borrow (layout, typography, tone).",
  "seo-priorities":
    "Note target topics, locations, or pages that matter most for search visibility.",
  "timeline-notes":
    "Describe timing constraints, milestones, or launch drivers without inventing dates.",
  "budget-notes":
    "Frame budget expectations or constraints the user mentioned — do not invent numbers.",
};

export function getBriefFieldWritingGuidance(fieldId: string): string | undefined {
  return FIELD_WRITING_GUIDANCE[fieldId];
}

export function combineBriefFieldInput(
  currentValue: string,
  roughNotes?: string,
): string {
  return [currentValue.trim(), roughNotes?.trim()].filter(Boolean).join("\n");
}

export function isSparseBriefFieldInput(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 40) return true;
  const sentences = trimmed.split(/[.!?]+/).filter((s) => s.trim().length > 8);
  if (sentences.length >= 2) return false;
  if (trimmed.length >= 100 && /[,;:]/.test(trimmed)) return false;
  return trimmed.length < 140;
}

export function buildBriefContextForField(
  values: TemplateValues,
  excludeFieldId: string,
  maxFields = 10,
): Array<{ fieldId: string; label: string; value: string }> {
  const context: Array<{ fieldId: string; label: string; value: string }> = [];

  for (const section of websiteProjectBriefTemplate.sections) {
    for (const field of section.fields) {
      if (field.id === excludeFieldId) continue;
      if (!isTemplateFieldVisible(field, values)) continue;
      const display = getFieldDisplayValue(field, values);
      if (!display?.trim()) continue;
      context.push({
        fieldId: field.id,
        label: field.label,
        value: display.slice(0, 400),
      });
      if (context.length >= maxFields) return context;
    }
  }

  return context;
}
