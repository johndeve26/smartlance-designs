import { Prisma, type WorkProject } from "@prisma/client";
import {
  type CaseStudyContentV1,
  caseStudyKindFromInput,
  parseCaseStudyContent,
  validateCaseStudyContentInput,
} from "@/lib/work/case-study-content";

export type WorkEditableFields = {
  slug: string;
  name: string;
  title: string | null;
  clientName: string | null;
  industryLabel: string;
  projectType: string | null;
  shortDescription: string | null;
  overview: string | null;
  challenge: string;
  solution: string;
  approach: string | null;
  resultSummary: string | null;
  results: Prisma.InputJsonValue | null;
  measurableResults: Prisma.InputJsonValue | null;
  goals: Prisma.InputJsonValue | null;
  servicesLabels: Prisma.InputJsonValue;
  technologies: Prisma.InputJsonValue | null;
  platformLabel: string | null;
  platformsLabels: Prisma.InputJsonValue | null;
  websiteUrl: string | null;
  oldUrl: string | null;
  year: number | null;
  coverImagePath: string | null;
  coverImageAlt: string | null;
  heroImagePath: string | null;
  heroImageAlt: string | null;
  gallery: Prisma.InputJsonValue | null;
  relatedServiceHrefs: Prisma.InputJsonValue | null;
  relatedWorkSlugs: Prisma.InputJsonValue | null;
  featuredHomepage: boolean;
  featuredWorkArchive: boolean;
  featured: boolean;
  displayOrder: number;
  heroStatement: string | null;
  challenges: Prisma.InputJsonValue | null;
  approachSteps: Prisma.InputJsonValue | null;
  solutionPoints: Prisma.InputJsonValue | null;
  highlights: Prisma.InputJsonValue | null;
  platformContext: string | null;
  outcomeHeading: string | null;
  caseStudyKind: "website" | "product";
  caseStudyContent: CaseStudyContentV1 | null;
  heroEyebrow: string | null;
  heroSupportingCopy: string | null;
  externalLinkLabel: string | null;
  seoTitle: string;
  seoDescription: string;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImagePath: string | null;
  noIndex: boolean;
  canonicalOverride: string | null;
  approvedForAI: boolean;
  approvedProjectFacts: Prisma.InputJsonValue | null;
  industryIds: string[];
};

const EDITABLE_KEYS = Object.keys({
  slug: true,
  name: true,
  title: true,
  clientName: true,
  industryLabel: true,
  projectType: true,
  shortDescription: true,
  overview: true,
  challenge: true,
  solution: true,
  approach: true,
  resultSummary: true,
  results: true,
  measurableResults: true,
  goals: true,
  servicesLabels: true,
  technologies: true,
  platformLabel: true,
  platformsLabels: true,
  websiteUrl: true,
  oldUrl: true,
  year: true,
  coverImagePath: true,
  coverImageAlt: true,
  heroImagePath: true,
  heroImageAlt: true,
  gallery: true,
  relatedServiceHrefs: true,
  relatedWorkSlugs: true,
  featuredHomepage: true,
  featuredWorkArchive: true,
  featured: true,
  displayOrder: true,
  heroStatement: true,
  challenges: true,
  approachSteps: true,
  solutionPoints: true,
  highlights: true,
  platformContext: true,
  outcomeHeading: true,
  caseStudyKind: true,
  caseStudyContent: true,
  heroEyebrow: true,
  heroSupportingCopy: true,
  externalLinkLabel: true,
  seoTitle: true,
  seoDescription: true,
  ogTitle: true,
  ogDescription: true,
  ogImagePath: true,
  noIndex: true,
  canonicalOverride: true,
  approvedForAI: true,
  approvedProjectFacts: true,
  industryIds: true,
}) as (keyof WorkEditableFields)[];

export function publishedFieldsFromRow(
  row: WorkProject,
  industryIds: string[] = [],
): WorkEditableFields {
  return {
    slug: row.slug,
    name: row.name,
    title: row.title,
    clientName: row.clientName,
    industryLabel: row.industryLabel,
    projectType: row.projectType,
    shortDescription: row.shortDescription,
    overview: row.overview,
    challenge: row.challenge,
    solution: row.solution,
    approach: row.approach,
    resultSummary: row.resultSummary,
    results: (row.results ?? null) as Prisma.InputJsonValue | null,
    measurableResults: (row.measurableResults ?? null) as Prisma.InputJsonValue | null,
    goals: (row.goals ?? null) as Prisma.InputJsonValue | null,
    servicesLabels: row.servicesLabels as Prisma.InputJsonValue,
    technologies: (row.technologies ?? null) as Prisma.InputJsonValue | null,
    platformLabel: row.platformLabel,
    platformsLabels: (row.platformsLabels ?? null) as Prisma.InputJsonValue | null,
    websiteUrl: row.websiteUrl,
    oldUrl: row.oldUrl,
    year: row.year,
    coverImagePath: row.coverImagePath,
    coverImageAlt: row.coverImageAlt,
    heroImagePath: row.heroImagePath,
    heroImageAlt: row.heroImageAlt,
    gallery: (row.gallery ?? null) as Prisma.InputJsonValue | null,
    relatedServiceHrefs: (row.relatedServiceHrefs ?? null) as Prisma.InputJsonValue | null,
    relatedWorkSlugs: (row.relatedWorkSlugs ?? null) as Prisma.InputJsonValue | null,
    featuredHomepage: row.featuredHomepage,
    featuredWorkArchive: row.featuredWorkArchive,
    featured: row.featured,
    displayOrder: row.displayOrder,
    heroStatement: row.heroStatement,
    challenges: (row.challenges ?? null) as Prisma.InputJsonValue | null,
    approachSteps: (row.approachSteps ?? null) as Prisma.InputJsonValue | null,
    solutionPoints: (row.solutionPoints ?? null) as Prisma.InputJsonValue | null,
    highlights: (row.highlights ?? null) as Prisma.InputJsonValue | null,
    platformContext: row.platformContext,
    outcomeHeading: row.outcomeHeading,
    caseStudyKind: row.caseStudyKind === "PRODUCT" ? "product" : "website",
    caseStudyContent: parseCaseStudyContent(row.caseStudyContent),
    heroEyebrow: row.heroEyebrow,
    heroSupportingCopy: row.heroSupportingCopy,
    externalLinkLabel: row.externalLinkLabel,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    ogTitle: row.ogTitle,
    ogDescription: row.ogDescription,
    ogImagePath: row.ogImagePath,
    noIndex: row.noIndex,
    canonicalOverride: row.canonicalOverride,
    approvedForAI: row.approvedForAI,
    approvedProjectFacts: (row.approvedProjectFacts ?? null) as Prisma.InputJsonValue | null,
    industryIds,
  };
}

export function parseWorkDraftJson(raw: unknown): Partial<WorkEditableFields> | null {
  if (!raw || typeof raw !== "object") return null;
  return raw as Partial<WorkEditableFields>;
}

export function effectiveWorkFields(
  row: WorkProject,
  industryIds: string[] = [],
): WorkEditableFields {
  const published = publishedFieldsFromRow(row, industryIds);
  const draft = parseWorkDraftJson(row.draftJson);
  if (!draft) return published;
  return {
    ...published,
    ...draft,
    caseStudyContent:
      draft.caseStudyContent === undefined
        ? published.caseStudyContent
        : draft.caseStudyContent,
  };
}

export function hasWorkDraft(row: WorkProject | null | undefined): boolean {
  return Boolean(row?.draftJson && typeof row.draftJson === "object");
}

export function normalizeWorkPartial(
  data: Partial<WorkEditableFields>,
): Partial<WorkEditableFields> {
  const out: Partial<WorkEditableFields> = {};
  for (const key of EDITABLE_KEYS) {
    if (key in data && data[key] !== undefined) {
      (out as Record<string, unknown>)[key] = data[key];
    }
  }
  return out;
}

export function workFieldsToRowData(
  fields: WorkEditableFields,
): Prisma.WorkProjectUncheckedUpdateInput {
  return {
    slug: fields.slug,
    name: fields.name,
    title: fields.title,
    clientName: fields.clientName,
    industryLabel: fields.industryLabel,
    projectType: fields.projectType,
    shortDescription: fields.shortDescription,
    overview: fields.overview,
    challenge: fields.challenge,
    solution: fields.solution,
    approach: fields.approach,
    resultSummary: fields.resultSummary,
    results: fields.results ?? Prisma.JsonNull,
    measurableResults: fields.measurableResults ?? Prisma.JsonNull,
    goals: fields.goals ?? Prisma.JsonNull,
    servicesLabels: fields.servicesLabels,
    technologies: fields.technologies ?? Prisma.JsonNull,
    platformLabel: fields.platformLabel,
    platformsLabels: fields.platformsLabels ?? Prisma.JsonNull,
    websiteUrl: fields.websiteUrl,
    oldUrl: fields.oldUrl,
    year: fields.year,
    coverImagePath: fields.coverImagePath,
    coverImageAlt: fields.coverImageAlt,
    heroImagePath: fields.heroImagePath,
    heroImageAlt: fields.heroImageAlt,
    gallery: fields.gallery ?? Prisma.JsonNull,
    relatedServiceHrefs: fields.relatedServiceHrefs ?? Prisma.JsonNull,
    relatedWorkSlugs: fields.relatedWorkSlugs ?? Prisma.JsonNull,
    featuredHomepage: fields.featuredHomepage,
    featuredWorkArchive: fields.featuredWorkArchive,
    featured: fields.featured,
    displayOrder: fields.displayOrder,
    heroStatement: fields.heroStatement,
    challenges: fields.challenges ?? Prisma.JsonNull,
    approachSteps: fields.approachSteps ?? Prisma.JsonNull,
    solutionPoints: fields.solutionPoints ?? Prisma.JsonNull,
    highlights: fields.highlights ?? Prisma.JsonNull,
    platformContext: fields.platformContext,
    outcomeHeading: fields.outcomeHeading,
    caseStudyKind: caseStudyKindFromInput(fields.caseStudyKind),
    caseStudyContent: fields.caseStudyContent
      ? (fields.caseStudyContent as unknown as Prisma.InputJsonValue)
      : Prisma.JsonNull,
    heroEyebrow: fields.heroEyebrow,
    heroSupportingCopy: fields.heroSupportingCopy,
    externalLinkLabel: fields.externalLinkLabel,
    seoTitle: fields.seoTitle,
    seoDescription: fields.seoDescription,
    ogTitle: fields.ogTitle,
    ogDescription: fields.ogDescription,
    ogImagePath: fields.ogImagePath,
    noIndex: fields.noIndex,
    canonicalOverride: fields.canonicalOverride,
    approvedForAI: fields.approvedForAI,
    approvedProjectFacts: fields.approvedProjectFacts ?? Prisma.JsonNull,
  };
}

export function parseWorkDraftInput(data: {
  [key: string]: unknown;
  caseStudyContent?: unknown;
  caseStudyKind?: string;
}): Partial<WorkEditableFields> {
  const partial: Partial<WorkEditableFields> = {};
  for (const key of EDITABLE_KEYS) {
    if (key in data && data[key] !== undefined) {
      (partial as Record<string, unknown>)[key] = data[key];
    }
  }
  if ("caseStudyContent" in data) {
    partial.caseStudyContent = validateCaseStudyContentInput(data.caseStudyContent);
  }
  if (typeof data.caseStudyKind === "string") {
    partial.caseStudyKind = data.caseStudyKind === "product" ? "product" : "website";
  }
  return partial;
}
