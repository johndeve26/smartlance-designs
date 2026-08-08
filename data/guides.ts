/**
 * Published Guides registry.
 * Only include Guides that are ready to ship — no placeholders.
 */

import type { GuideContent } from "@/data/resource-content-types";
import { websiteRedesignGuide } from "@/data/guides/website-redesign-guide";

export const guides: GuideContent[] = [websiteRedesignGuide];

export function getPublishedGuides(): GuideContent[] {
  return guides.filter((guide) => guide.published);
}

export function getGuideBySlug(slug: string): GuideContent | undefined {
  return getPublishedGuides().find((guide) => guide.slug === slug);
}

export function getGuideToc(guide: GuideContent) {
  if (guide.tableOfContents?.length) return guide.tableOfContents;
  return guide.sections.map((section) => ({
    id: section.id,
    title: section.title,
  }));
}

export function getRelatedPublishedGuides(
  slug: string,
  limit = 3,
): GuideContent[] {
  return getPublishedGuides()
    .filter((guide) => guide.slug !== slug)
    .slice(0, limit);
}
