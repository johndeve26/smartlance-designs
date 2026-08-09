import type { Prisma, ResourceKind } from "@prisma/client";
import type {
  ChecklistContent,
  ComparisonContent,
  GlossaryContent,
  GlossaryTopicGroup,
  GuideContent,
  TemplateContent,
  ToolContent,
} from "@/data/resource-content-types";
import { PLATFORM_SELECTOR_BASE_QUESTION_COUNT } from "@/data/tools/website-platform-selector";
import { glossaryTopicGroups } from "@/data/glossary";
import type { ResourceTopicId } from "@/data/resources";
import { resourceTopics } from "@/data/resources";
import { resourceHref } from "@/lib/content-routes";

/** Columns only — payload read separately for minimal listing fields when needed. */
export const RESOURCE_LISTING_SELECT = {
  id: true,
  type: true,
  slug: true,
  title: true,
  description: true,
  deck: true,
  href: true,
  featured: true,
  featuredOnResources: true,
  featuredOrder: true,
  readingTime: true,
  heroImagePath: true,
  heroImageAlt: true,
  publishedAt: true,
  acronym: true,
  shortDefinition: true,
  aliases: true,
  payload: true,
} satisfies Prisma.CmsResourceSelect;

export type ResourceListingRow = Prisma.CmsResourceGetPayload<{
  select: typeof RESOURCE_LISTING_SELECT;
}>;

export type PublicResourceCard = {
  id: string;
  type: ResourceKind;
  slug: string;
  title: string;
  description: string;
  deck: string | null;
  href: string;
  featured: boolean;
  featuredOnResources: boolean;
  featuredOrder: number;
  readingTime: string | null;
  heroImagePath: string | null;
  heroImageAlt: string | null;
  publishedAt: string | null;
  acronym: string | null;
  shortDefinition: string | null;
};

export type ResourceDiscoveryCounts = {
  guide: number;
  comparison: number;
  checklist: number;
  glossary: number;
  template: number;
  tool: number;
};

export type GlossaryArchiveSearchItem = {
  slug: string;
  term: string;
  acronym?: string;
  expansion?: string;
  aliases: string[];
  shortDefinition: string;
  topicGroup: GlossaryTopicGroup;
  topicLabel: string;
};

function publishedAtIso(value: Date | null | undefined): string {
  return (value ?? new Date()).toISOString();
}

const RESOURCE_TOPIC_IDS = new Set<ResourceTopicId>(
  resourceTopics.map((topic) => topic.id),
);

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function asTopicIds(value: unknown): ResourceTopicId[] {
  return asStringArray(value).filter((id): id is ResourceTopicId =>
    RESOURCE_TOPIC_IDS.has(id as ResourceTopicId),
  );
}

function payloadRecord(payload: unknown): Record<string, unknown> {
  return payload && typeof payload === "object"
    ? (payload as Record<string, unknown>)
    : {};
}

function readComparisonListing(payload: unknown) {
  const record = payloadRecord(payload);
  return {
    optionA: typeof record.optionA === "string" ? record.optionA : "Option A",
    optionB: typeof record.optionB === "string" ? record.optionB : "Option B",
    keyCategories: asStringArray(record.keyCategories),
  };
}

function readChecklistCounts(payload: unknown) {
  const sections = payloadRecord(payload).sections;
  if (!Array.isArray(sections)) return { sectionCount: 0, itemCount: 0 };
  let itemCount = 0;
  for (const section of sections) {
    if (section && typeof section === "object" && Array.isArray(section.items)) {
      itemCount += section.items.length;
    }
  }
  return { sectionCount: sections.length, itemCount };
}

function readTemplateSectionCount(payload: unknown): number {
  const sections = payloadRecord(payload).sections;
  return Array.isArray(sections) ? sections.length : 0;
}

function readToolQuestionCount(payload: unknown, slug: string): number {
  if (slug === "website-platform-selector") {
    return PLATFORM_SELECTOR_BASE_QUESTION_COUNT;
  }
  const record = payloadRecord(payload);
  if (typeof record.questionCount === "number") return record.questionCount;
  const questions = record.questions ?? record.platformSelectorQuestions;
  return Array.isArray(questions) ? questions.length : 0;
}

function readGlossaryListing(payload: unknown, row: ResourceListingRow) {
  const record = payloadRecord(payload);
  return {
    term: row.title,
    expansion:
      typeof record.expansion === "string" ? record.expansion : undefined,
    glossaryTopicGroup:
      typeof record.glossaryTopicGroup === "string"
        ? (record.glossaryTopicGroup as GlossaryTopicGroup)
        : ("website-foundations" as GlossaryTopicGroup),
    topicIds: asTopicIds(record.topicIds),
    relatedTermSlugs: asStringArray(record.relatedTermSlugs),
    relatedGuideSlugs: asStringArray(record.relatedGuideSlugs),
    relatedSolutionSlugs: asStringArray(record.relatedSolutionSlugs),
    relatedServiceHrefs: asStringArray(record.relatedServiceHrefs),
    relatedSeoHrefs: asStringArray(record.relatedSeoHrefs),
  };
}

export function resourceListingOrder(
  type: ResourceKind,
): Prisma.CmsResourceOrderByWithRelationInput[] {
  if (type === "glossary") {
    return [{ title: "asc" }];
  }
  return [
    { featured: "desc" },
    { featuredOrder: "asc" },
    { publishedAt: "desc" },
    { title: "asc" },
  ];
}

export function toPublicResourceCard(row: ResourceListingRow): PublicResourceCard {
  return {
    id: row.id,
    type: row.type,
    slug: row.slug,
    title: row.title,
    description: row.description,
    deck: row.deck,
    href: row.href || resourceHref(row.type, row.slug),
    featured: row.featured,
    featuredOnResources: row.featuredOnResources,
    featuredOrder: row.featuredOrder,
    readingTime: row.readingTime,
    heroImagePath: row.heroImagePath,
    heroImageAlt: row.heroImageAlt,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    acronym: row.acronym,
    shortDefinition: row.shortDefinition,
  };
}

export function countResourcesByType(
  cards: PublicResourceCard[],
): ResourceDiscoveryCounts {
  const counts: ResourceDiscoveryCounts = {
    guide: 0,
    comparison: 0,
    checklist: 0,
    glossary: 0,
    template: 0,
    tool: 0,
  };
  for (const card of cards) {
    counts[card.type] += 1;
  }
  return counts;
}

export function toGuideListingContent(row: ResourceListingRow): GuideContent {
  const record = payloadRecord(row.payload);
  return {
    type: "guide",
    slug: row.slug,
    title: row.title,
    description: row.description,
    deck: row.deck ?? undefined,
    intro: "",
    sections: [],
    readingTime: row.readingTime ?? "",
    published: true,
    publishedAt: publishedAtIso(row.publishedAt),
    topicIds: asTopicIds(record.topicIds),
    featured: row.featured || undefined,
    heroImage: row.heroImagePath ?? undefined,
    heroImageAlt: row.heroImageAlt ?? undefined,
  };
}

export function toComparisonListingContent(
  row: ResourceListingRow,
): ComparisonContent {
  const record = payloadRecord(row.payload);
  const listing = readComparisonListing(row.payload);
  return {
    type: "comparison",
    slug: row.slug,
    title: row.title,
    description: row.description,
    deck: row.deck ?? undefined,
    optionA: listing.optionA,
    optionB: listing.optionB,
    summary: typeof record.summary === "string" ? record.summary : "",
    quickFitA: asStringArray(record.quickFitA),
    quickFitB: asStringArray(record.quickFitB),
    comparisonCriteria: [],
    decisionMatrix: [],
    sections: [],
    bestForA: asStringArray(record.bestForA),
    bestForB: asStringArray(record.bestForB),
    decisionQuestions: asStringArray(record.decisionQuestions),
    tradeoffs: asStringArray(record.tradeoffs),
    decisionGuidance:
      typeof record.decisionGuidance === "string" ? record.decisionGuidance : "",
    readingTime: row.readingTime ?? "",
    published: true,
    publishedAt: publishedAtIso(row.publishedAt),
    topicIds: asTopicIds(record.topicIds),
    featured: row.featured || undefined,
    keyCategories: listing.keyCategories,
  };
}

export type ChecklistListingContent = ChecklistContent & {
  listingSectionCount: number;
  listingItemCount: number;
};

export function toChecklistListingContent(
  row: ResourceListingRow,
): ChecklistListingContent {
  const record = payloadRecord(row.payload);
  const counts = readChecklistCounts(row.payload);
  return {
    type: "checklist",
    slug: row.slug,
    title: row.title,
    description: row.description,
    subtitle: row.deck ?? undefined,
    sections: [],
    published: true,
    publishedAt: publishedAtIso(row.publishedAt),
    topicIds: asTopicIds(record.topicIds),
    featured: row.featured || undefined,
    listingSectionCount: counts.sectionCount,
    listingItemCount: counts.itemCount,
  };
}

export function toGlossaryListingContent(
  row: ResourceListingRow,
): GlossaryContent {
  const listing = readGlossaryListing(row.payload, row);
  return {
    type: "glossary",
    slug: row.slug,
    term: listing.term,
    acronym: row.acronym ?? undefined,
    expansion: listing.expansion,
    aliases: asStringArray(row.aliases),
    shortDefinition: row.shortDefinition ?? row.description,
    fullExplanation: "",
    whyItMatters: "",
    example: "",
    commonMisconceptions: [],
    glossaryTopicGroup: listing.glossaryTopicGroup,
    published: true,
    publishedAt: publishedAtIso(row.publishedAt),
    topicIds: listing.topicIds,
    featured: row.featured || undefined,
    relatedTermSlugs: listing.relatedTermSlugs,
    relatedGuideSlugs: listing.relatedGuideSlugs,
    relatedSolutionSlugs: listing.relatedSolutionSlugs,
    relatedServiceHrefs: listing.relatedServiceHrefs,
    relatedSeoHrefs: listing.relatedSeoHrefs,
  };
}

export type TemplateListingContent = TemplateContent & {
  listingSectionCount: number;
};

export function toTemplateListingContent(
  row: ResourceListingRow,
): TemplateListingContent {
  const record = payloadRecord(row.payload);
  return {
    type: "template",
    slug: row.slug,
    title: row.title,
    description: row.description,
    sections: [],
    published: true,
    publishedAt: publishedAtIso(row.publishedAt),
    topicIds: asTopicIds(record.topicIds),
    featured: row.featured || undefined,
    listingSectionCount: readTemplateSectionCount(row.payload),
  };
}

export type ToolListingContent = ToolContent & {
  listingQuestionCount: number;
};

export function toToolListingContent(row: ResourceListingRow): ToolListingContent {
  const record = payloadRecord(row.payload);
  return {
    type: "tool",
    slug: row.slug,
    title: row.title,
    description: row.description,
    published: true,
    publishedAt: publishedAtIso(row.publishedAt),
    topicIds: asTopicIds(record.topicIds),
    featured: row.featured || undefined,
    listingQuestionCount: readToolQuestionCount(row.payload, row.slug),
  };
}

const listingMapperByType = {
  guide: toGuideListingContent,
  comparison: toComparisonListingContent,
  checklist: toChecklistListingContent,
  glossary: toGlossaryListingContent,
  template: toTemplateListingContent,
  tool: toToolListingContent,
} as const;

export function mapResourceListingRow<T extends ResourceKind>(
  type: T,
  row: ResourceListingRow,
): ReturnType<(typeof listingMapperByType)[T]> {
  return listingMapperByType[type](row) as ReturnType<
    (typeof listingMapperByType)[T]
  >;
}

export function resolveRelatedPublishedGuides(
  slug: string,
  guides: GuideContent[],
  limit = 3,
): GuideContent[] {
  return guides.filter((guide) => guide.slug !== slug).slice(0, limit);
}

export function resolveRelatedPublishedComparisons(
  slug: string,
  comparisons: ComparisonContent[],
  limit = 3,
): ComparisonContent[] {
  return comparisons
    .filter((comparison) => comparison.slug !== slug)
    .slice(0, limit);
}

export function resolveRelatedGlossaryEntries(
  entry: GlossaryContent,
  published: GlossaryContent[],
): GlossaryContent[] {
  const bySlug = new Map(published.map((item) => [item.slug, item]));
  return (entry.relatedTermSlugs ?? [])
    .map((relatedSlug) => bySlug.get(relatedSlug))
    .filter((item): item is GlossaryContent => Boolean(item));
}

export function resolveAdjacentGlossaryEntries(
  slug: string,
  published: GlossaryContent[],
) {
  const sorted = [...published].sort((a, b) =>
    a.term.localeCompare(b.term, undefined, { numeric: true }),
  );
  const index = sorted.findIndex((entry) => entry.slug === slug);
  if (index === -1) return { previous: undefined, next: undefined };
  return {
    previous: index > 0 ? sorted[index - 1] : undefined,
    next: index < sorted.length - 1 ? sorted[index + 1] : undefined,
  };
}

function alphabeticalKey(term: string) {
  const first = term.trim().charAt(0);
  return /[A-Za-z]/.test(first) ? first.toUpperCase() : "#";
}

export function buildGlossarySearchIndex(
  entries: GlossaryContent[],
): GlossaryArchiveSearchItem[] {
  return entries.map((entry) => ({
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

export function buildGlossaryAlphabeticalGroups(entries: GlossaryContent[]) {
  const groups = new Map<string, GlossaryContent[]>();
  for (const entry of entries) {
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
    .map(([letter, terms]) => ({
      letter,
      terms: buildGlossarySearchIndex(terms),
    }));
}

export function buildGlossaryTopicGroupArchive(entries: GlossaryContent[]) {
  return glossaryTopicGroups.map((group) => ({
    ...group,
    terms: buildGlossarySearchIndex(
      entries
        .filter((entry) => entry.glossaryTopicGroup === group.id)
        .sort((a, b) => a.term.localeCompare(b.term)),
    ),
  }));
}

export function getFeaturedGlossaryListingEntries(
  entries: GlossaryContent[],
  limit = 4,
) {
  const featured = entries.filter((entry) => entry.featured);
  if (featured.length >= limit) {
    return buildGlossarySearchIndex(featured.slice(0, limit));
  }
  return buildGlossarySearchIndex(entries.slice(0, limit));
}

export function getPublicResourceHref(type: ResourceKind, slug: string): string {
  return resourceHref(type, slug);
}
