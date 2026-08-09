import type { CmsResource, Prisma, ResourceKind } from "@prisma/client";
import type {
  ChecklistContent,
  ComparisonContent,
  GlossaryContent,
  GuideContent,
  TemplateContent,
  ToolContent,
} from "@/data/resource-content-types";
import {
  type ResourceKindKey,
  validateResourcePayload,
} from "@/lib/resources/schemas";

export type ResourceColumnInput = {
  slug: string;
  title: string;
  description: string;
  deck?: string | null;
  author?: string | null;
  readingTime?: string | null;
  heroImagePath?: string | null;
  heroImageAlt?: string | null;
  relatedServiceHrefs?: unknown;
  relatedSolutionSlugs?: unknown;
  relatedPlatformSlugs?: unknown;
  relatedInsightSlugs?: unknown;
  relatedResourceIds?: unknown;
  shortDefinition?: string | null;
  aliases?: unknown;
  acronym?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImagePath?: string | null;
  noIndex?: boolean;
  canonicalOverride?: string | null;
  featured?: boolean;
  featuredOnResources?: boolean;
  featuredOrder?: number;
};

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((item): item is string => typeof item === "string");
}

function mergeRelations(
  target: Record<string, unknown>,
  columns: ResourceColumnInput,
) {
  const relatedServiceHrefs = asStringArray(columns.relatedServiceHrefs);
  const relatedSolutionSlugs = asStringArray(columns.relatedSolutionSlugs);
  const relatedPlatformSlugs = asStringArray(columns.relatedPlatformSlugs);
  const relatedInsightSlugs = asStringArray(columns.relatedInsightSlugs);
  const relatedResourceIds = asStringArray(columns.relatedResourceIds);

  if (relatedServiceHrefs) target.relatedServiceHrefs = relatedServiceHrefs;
  if (relatedSolutionSlugs) target.relatedSolutionSlugs = relatedSolutionSlugs;
  if (relatedPlatformSlugs) target.relatedPlatformSlugs = relatedPlatformSlugs;
  if (relatedInsightSlugs) target.relatedInsightSlugs = relatedInsightSlugs;
  if (relatedResourceIds) target.relatedResourceIds = relatedResourceIds;
}

function mergeCommonColumns(
  target: Record<string, unknown>,
  columns: ResourceColumnInput,
  published: boolean,
) {
  target.slug = columns.slug;
  target.title = columns.title;
  target.description = columns.description;
  if (columns.deck) target.deck = columns.deck;
  if (columns.author) target.author = columns.author;
  if (columns.readingTime) target.readingTime = columns.readingTime;
  if (columns.seoTitle) target.seoTitle = columns.seoTitle;
  if (columns.seoDescription) target.seoDescription = columns.seoDescription;
  if (columns.heroImagePath) target.heroImage = columns.heroImagePath;
  if (columns.heroImageAlt) target.heroImageAlt = columns.heroImageAlt;
  target.published = published;
  mergeRelations(target, columns);
}

function stripToolEngineFields(payload: Record<string, unknown>) {
  for (const key of [
    "questions",
    "platformSelectorQuestions",
    "candidates",
    "signals",
    "scoreWeight",
    "weights",
    "storageKey",
  ]) {
    delete payload[key];
  }
}

export function composeResourcePayload(
  type: ResourceKind,
  columns: ResourceColumnInput,
  structuralPayload: unknown,
  existing?: Pick<CmsResource, "payload" | "publishedAt" | "status"> | null,
): Prisma.InputJsonValue {
  const kind = type as ResourceKindKey;
  const base =
    structuralPayload && typeof structuralPayload === "object"
      ? (structuredClone(structuralPayload) as Record<string, unknown>)
      : existing?.payload && typeof existing.payload === "object"
        ? (structuredClone(existing.payload) as Record<string, unknown>)
        : {};

  base.type = kind;
  mergeCommonColumns(base, columns, existing?.status === "PUBLISHED");

  if (!base.publishedAt && existing?.publishedAt) {
    base.publishedAt = existing.publishedAt.toISOString();
  }
  if (!base.publishedAt) {
    base.publishedAt = new Date().toISOString();
  }

  switch (kind) {
    case "glossary": {
      base.term = columns.title;
      if (columns.shortDefinition) {
        base.shortDefinition = columns.shortDefinition;
      }
      if (columns.acronym) base.acronym = columns.acronym;
      const aliases = asStringArray(columns.aliases);
      if (aliases) base.aliases = aliases;
      break;
    }
    case "checklist": {
      if (columns.deck && !base.subtitle) base.subtitle = columns.deck;
      break;
    }
    case "template": {
      if (columns.deck && !base.subtitle) base.subtitle = columns.deck;
      break;
    }
    case "tool": {
      if (columns.deck && !base.subtitle) base.subtitle = columns.deck;
      stripToolEngineFields(base);
      break;
    }
    default:
      break;
  }

  return validateResourcePayload(kind, base) as Prisma.InputJsonValue;
}

export function composeResourceSaveData(input: {
  type: ResourceKind;
  columns: ResourceColumnInput;
  structuralPayload: unknown;
  existing?: CmsResource | null;
}): Prisma.CmsResourceUncheckedUpdateInput {
  const payload = composeResourcePayload(
    input.type,
    input.columns,
    input.structuralPayload,
    input.existing,
  );

  const data: Prisma.CmsResourceUncheckedUpdateInput = {
    slug: input.columns.slug,
    title: input.columns.title,
    description: input.columns.description,
    deck: input.columns.deck ?? null,
    author: input.columns.author ?? null,
    readingTime: input.columns.readingTime ?? null,
    heroImagePath: input.columns.heroImagePath ?? null,
    heroImageAlt: input.columns.heroImageAlt ?? null,
    relatedServiceHrefs: (asStringArray(input.columns.relatedServiceHrefs) ??
      undefined) as Prisma.InputJsonValue | undefined,
    relatedSolutionSlugs: (asStringArray(input.columns.relatedSolutionSlugs) ??
      undefined) as Prisma.InputJsonValue | undefined,
    relatedPlatformSlugs: (asStringArray(input.columns.relatedPlatformSlugs) ??
      undefined) as Prisma.InputJsonValue | undefined,
    relatedInsightSlugs: (asStringArray(input.columns.relatedInsightSlugs) ??
      undefined) as Prisma.InputJsonValue | undefined,
    relatedResourceIds: (asStringArray(input.columns.relatedResourceIds) ??
      undefined) as Prisma.InputJsonValue | undefined,
    seoTitle: input.columns.seoTitle ?? null,
    seoDescription: input.columns.seoDescription ?? null,
    ogTitle: input.columns.ogTitle ?? null,
    ogDescription: input.columns.ogDescription ?? null,
    ogImagePath: input.columns.ogImagePath ?? null,
    noIndex: input.columns.noIndex ?? false,
    canonicalOverride: input.columns.canonicalOverride ?? null,
    featured: input.columns.featured ?? false,
    featuredOnResources: input.columns.featuredOnResources ?? false,
    featuredOrder: input.columns.featuredOrder ?? 0,
    payload,
  };

  if (input.type === "glossary") {
    data.shortDefinition =
      input.columns.shortDefinition ?? input.existing?.shortDefinition ?? null;
    data.aliases = (asStringArray(input.columns.aliases) ??
      (Array.isArray(input.existing?.aliases)
        ? (input.existing?.aliases as string[])
        : undefined)) as Prisma.InputJsonValue | undefined;
    data.acronym = input.columns.acronym ?? input.existing?.acronym ?? null;
  }

  return data;
}

export function columnsFromResourceRow(row: CmsResource): ResourceColumnInput {
  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    deck: row.deck,
    author: row.author,
    readingTime: row.readingTime,
    heroImagePath: row.heroImagePath,
    heroImageAlt: row.heroImageAlt,
    relatedServiceHrefs: row.relatedServiceHrefs,
    relatedSolutionSlugs: row.relatedSolutionSlugs,
    relatedPlatformSlugs: row.relatedPlatformSlugs,
    relatedInsightSlugs: row.relatedInsightSlugs,
    relatedResourceIds: row.relatedResourceIds,
    shortDefinition: row.shortDefinition,
    aliases: row.aliases,
    acronym: row.acronym,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    ogTitle: row.ogTitle,
    ogDescription: row.ogDescription,
    ogImagePath: row.ogImagePath,
    noIndex: row.noIndex,
    canonicalOverride: row.canonicalOverride,
    featured: row.featured,
    featuredOnResources: row.featuredOnResources,
    featuredOrder: row.featuredOrder,
  };
}

export function resolvePublicResourceContent<T>(row: CmsResource): T {
  const structural =
    row.payload && typeof row.payload === "object"
      ? row.payload
      : {};
  const payload = composeResourcePayload(
    row.type,
    columnsFromResourceRow(row),
    structural,
    row,
  );
  return payload as T;
}

export type {
  GuideContent,
  ComparisonContent,
  ChecklistContent,
  GlossaryContent,
  TemplateContent,
  ToolContent,
};
