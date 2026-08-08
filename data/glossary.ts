/**
 * Published Glossary registry.
 * Only include terms that are ready to ship — no placeholders.
 *
 * Content maintenance: Core Web Vitals / LCP / INP / CLS / Structured Data / SEO
 * terminology may need more frequent review as industry guidance evolves.
 */

import type {
  GlossaryContent,
  GlossaryTopicGroup,
} from "@/data/resource-content-types";
import { glossaryEntries as entries } from "@/data/glossary/entries";

export const glossaryTopicGroups: {
  id: GlossaryTopicGroup;
  label: string;
  description: string;
}[] = [
  {
    id: "website-foundations",
    label: "Website Foundations",
    description: "Core building blocks of websites and conversion.",
  },
  {
    id: "search-technical-seo",
    label: "Search & Technical SEO",
    description: "Discovery, indexing signals and technical search foundations.",
  },
  {
    id: "performance",
    label: "Performance",
    description: "How pages load, respond and stay visually stable.",
  },
];

export const glossaryEntries: GlossaryContent[] = entries;

export function getPublishedGlossaryEntries(): GlossaryContent[] {
  return glossaryEntries.filter((entry) => entry.published);
}

export function getGlossaryEntryBySlug(
  slug: string,
): GlossaryContent | undefined {
  return getPublishedGlossaryEntries().find((entry) => entry.slug === slug);
}

export function getGlossaryCount() {
  return getPublishedGlossaryEntries().length;
}

export function getFeaturedGlossaryEntries(limit = 4): GlossaryContent[] {
  const featured = getPublishedGlossaryEntries().filter(
    (entry) => entry.featured,
  );
  if (featured.length >= limit) return featured.slice(0, limit);
  return getPublishedGlossaryEntries().slice(0, limit);
}

export function getGlossaryAlphabeticalGroups() {
  const groups = new Map<string, GlossaryContent[]>();
  for (const entry of getPublishedGlossaryEntries()) {
    const letter = alphabeticalKey(entry.term);
    const list = groups.get(letter) ?? [];
    list.push(entry);
    groups.set(letter, list);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => a.term.localeCompare(b.term));
  }
  return [...groups.entries()]
    .sort(([a], [b]) => {
      if (a === "#") return -1;
      if (b === "#") return 1;
      return a.localeCompare(b);
    })
    .map(([letter, terms]) => ({ letter, terms }));
}

export function getGlossaryEntriesByTopicGroup(group: GlossaryTopicGroup) {
  return getPublishedGlossaryEntries()
    .filter((entry) => entry.glossaryTopicGroup === group)
    .sort((a, b) => a.term.localeCompare(b.term));
}

export function getRelatedGlossaryEntries(
  entry: GlossaryContent,
): GlossaryContent[] {
  return (entry.relatedTermSlugs ?? [])
    .map((slug) => getGlossaryEntryBySlug(slug))
    .filter((item): item is GlossaryContent => Boolean(item));
}

export function getAdjacentGlossaryEntries(slug: string) {
  const sorted = [...getPublishedGlossaryEntries()].sort((a, b) =>
    a.term.localeCompare(b.term, undefined, { numeric: true }),
  );
  const index = sorted.findIndex((entry) => entry.slug === slug);
  if (index === -1) return { previous: undefined, next: undefined };
  return {
    previous: index > 0 ? sorted[index - 1] : undefined,
    next: index < sorted.length - 1 ? sorted[index + 1] : undefined,
  };
}

/** Compact records for client-side archive search */
export function getGlossarySearchIndex() {
  return getPublishedGlossaryEntries().map((entry) => ({
    slug: entry.slug,
    term: entry.term,
    acronym: entry.acronym,
    expansion: entry.expansion,
    aliases: entry.aliases ?? [],
    shortDefinition: entry.shortDefinition,
    topicGroup: entry.glossaryTopicGroup,
    topicLabel:
      glossaryTopicGroups.find((group) => group.id === entry.glossaryTopicGroup)
        ?.label ?? "",
  }));
}

function alphabeticalKey(term: string) {
  const trimmed = term.trim();
  const first = trimmed.charAt(0);
  if (/[0-9]/.test(first)) return "#";
  return first.toUpperCase();
}
