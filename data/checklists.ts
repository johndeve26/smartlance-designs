/**
 * Published Checklists registry.
 * Only include Checklists that are ready to ship — no placeholders.
 *
 * Content maintenance: review this Checklist when the Website Redesign Guide
 * is materially updated so they stay aligned without duplicating Guide copy.
 */

import type { ChecklistContent } from "@/data/resource-content-types";
import { websiteRedesignChecklist } from "@/data/checklists/website-redesign-checklist";

export const checklists: ChecklistContent[] = [websiteRedesignChecklist];

export function getPublishedChecklists(): ChecklistContent[] {
  return checklists.filter((item) => item.published);
}

export function getChecklistBySlug(
  slug: string,
): ChecklistContent | undefined {
  return getPublishedChecklists().find((item) => item.slug === slug);
}

export function getChecklistItemIds(checklist: ChecklistContent): string[] {
  const ids: string[] = [];
  for (const section of checklist.sections) {
    for (const item of section.items) ids.push(item.id);
    for (const subgroup of section.subgroups ?? []) {
      for (const item of subgroup.items) ids.push(item.id);
    }
  }
  return ids;
}

export function getChecklistItemCount(checklist: ChecklistContent) {
  return getChecklistItemIds(checklist).length;
}

export function getChecklistNav(checklist: ChecklistContent) {
  return checklist.sections.map((section, index) => ({
    id: section.id,
    title: section.title,
    number: String(index + 1).padStart(2, "0"),
  }));
}
