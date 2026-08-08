/**
 * Published Comparisons registry.
 * Only include Comparisons that are ready to ship — no placeholders.
 *
 * Content maintenance: platform comparisons may need periodic review
 * because features, plans, integrations and capabilities change over time.
 */

import type { ComparisonContent } from "@/data/resource-content-types";
import { wordpressVsWebflow } from "@/data/comparisons/wordpress-vs-webflow";

export const comparisons: ComparisonContent[] = [wordpressVsWebflow];

export function getPublishedComparisons(): ComparisonContent[] {
  return comparisons.filter((item) => item.published);
}

export function getComparisonBySlug(
  slug: string,
): ComparisonContent | undefined {
  return getPublishedComparisons().find((item) => item.slug === slug);
}

export function getRelatedPublishedComparisons(
  slug: string,
  limit = 3,
): ComparisonContent[] {
  return getPublishedComparisons()
    .filter((item) => item.slug !== slug)
    .slice(0, limit);
}
