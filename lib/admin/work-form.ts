import type { Prisma } from "@prisma/client";
import type { WorkEditableFields } from "@/lib/repositories/workDraftFields";
import {
  type CaseStudyContentV1,
  validateCaseStudyContentInput,
} from "@/lib/work/case-study-content";

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function optStr(fd: FormData, key: string) {
  const value = str(fd, key);
  return value || null;
}

function bool(fd: FormData, key: string) {
  const v = fd.get(key);
  return v === "on" || v === "true" || v === "1";
}

function optInt(fd: FormData, key: string) {
  const raw = str(fd, key);
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`${key} must be a number.`);
  }
  return Math.trunc(value);
}

function parseJsonField(fd: FormData, key: string): unknown {
  const raw = str(fd, key);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`${key} must be valid JSON.`);
  }
}

function parseJsonArrayField(fd: FormData, key: string): unknown[] | undefined {
  const value = parseJsonField(fd, key);
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    throw new Error(`${key} must be a JSON array.`);
  }
  return value;
}

export function buildCaseStudyContentFromForm(
  fd: FormData,
  existing: CaseStudyContentV1 | null,
): CaseStudyContentV1 | null {
  const hasStructuredInput =
    str(fd, "solutionIntro") ||
    str(fd, "engineeringIntro") ||
    str(fd, "csEngineeringStacks") ||
    str(fd, "csProductPrinciples") ||
    str(fd, "csProductFeatures") ||
    str(fd, "csSaasInfrastructure") ||
    str(fd, "csServiceLinks") ||
    str(fd, "csSectionHeadings") ||
    str(fd, "csCaseStudyCta") ||
    str(fd, "csGallery") ||
    str(fd, "introHeading") ||
    bool(fd, "showArchitectureDiagram");

  if (!hasStructuredInput && !existing) return null;

  const content: CaseStudyContentV1 = {
    version: 1,
    introHeading: optStr(fd, "introHeading") ?? existing?.introHeading,
    sectionHeadings:
      (parseJsonField(fd, "csSectionHeadings") as CaseStudyContentV1["sectionHeadings"]) ??
      existing?.sectionHeadings,
    solutionIntro: optStr(fd, "solutionIntro") ?? existing?.solutionIntro,
    serviceLinks:
      (parseJsonArrayField(fd, "csServiceLinks") as CaseStudyContentV1["serviceLinks"]) ??
      existing?.serviceLinks,
    engineeringIntro:
      optStr(fd, "engineeringIntro") ?? existing?.engineeringIntro,
    engineeringStacks:
      (parseJsonArrayField(fd, "csEngineeringStacks") as CaseStudyContentV1["engineeringStacks"]) ??
      existing?.engineeringStacks,
    productPrinciples:
      (parseJsonArrayField(fd, "csProductPrinciples") as CaseStudyContentV1["productPrinciples"]) ??
      existing?.productPrinciples,
    productFeatures:
      (parseJsonArrayField(fd, "csProductFeatures") as CaseStudyContentV1["productFeatures"]) ??
      existing?.productFeatures,
    saasInfrastructure:
      (parseJsonArrayField(fd, "csSaasInfrastructure") as CaseStudyContentV1["saasInfrastructure"]) ??
      existing?.saasInfrastructure,
    showArchitectureDiagram: fd.has("showArchitectureDiagram")
      ? bool(fd, "showArchitectureDiagram")
      : existing?.showArchitectureDiagram,
    caseStudyCta:
      (parseJsonField(fd, "csCaseStudyCta") as CaseStudyContentV1["caseStudyCta"]) ??
      existing?.caseStudyCta,
    gallery:
      (parseJsonArrayField(fd, "csGallery") as CaseStudyContentV1["gallery"]) ??
      existing?.gallery,
  };

  return validateCaseStudyContentInput(content);
}

export function workFieldsFromForm(
  fd: FormData,
  existingContent: CaseStudyContentV1 | null,
): Partial<WorkEditableFields> {
  let approvedProjectFacts: unknown = undefined;
  const factsRaw = str(fd, "approvedProjectFacts");
  if (factsRaw) {
    try {
      approvedProjectFacts = JSON.parse(factsRaw);
    } catch {
      throw new Error("Approved project facts must be valid JSON.");
    }
  }

  return {
    name: str(fd, "name"),
    slug: str(fd, "slug"),
    industryLabel: str(fd, "industryLabel"),
    clientName: optStr(fd, "clientName"),
    shortDescription: optStr(fd, "shortDescription"),
    overview: optStr(fd, "overview"),
    challenge: str(fd, "challenge"),
    solution: str(fd, "solution"),
    resultSummary: optStr(fd, "resultSummary"),
    results: parseJsonArrayField(fd, "results") as Prisma.InputJsonValue | undefined,
    measurableResults: parseJsonArrayField(fd, "measurableResults") as
      | Prisma.InputJsonValue
      | undefined,
    servicesLabels: JSON.parse(str(fd, "servicesLabels") || "[]"),
    platformLabel: optStr(fd, "platformLabel"),
    websiteUrl: optStr(fd, "websiteUrl"),
    year: optInt(fd, "year"),
    coverImagePath: optStr(fd, "coverImagePath"),
    heroImagePath: optStr(fd, "heroImagePath"),
    coverImageAlt: optStr(fd, "coverImageAlt"),
    heroImageAlt: optStr(fd, "heroImageAlt"),
    gallery: parseJsonArrayField(fd, "gallery") as Prisma.InputJsonValue | undefined,
    featured: bool(fd, "featured"),
    featuredHomepage: bool(fd, "featuredHomepage"),
    featuredWorkArchive: bool(fd, "featuredWorkArchive"),
    displayOrder: Number(fd.get("displayOrder") || 0),
    seoTitle: str(fd, "seoTitle"),
    seoDescription: str(fd, "seoDescription"),
    ogTitle: optStr(fd, "ogTitle"),
    ogDescription: optStr(fd, "ogDescription"),
    ogImagePath: optStr(fd, "ogImagePath"),
    noIndex: bool(fd, "noIndex"),
    canonicalOverride: optStr(fd, "canonicalOverride"),
    relatedServiceHrefs: parseJsonArrayField(fd, "relatedServiceHrefs") as
      | Prisma.InputJsonValue
      | undefined,
    relatedWorkSlugs: parseJsonArrayField(fd, "relatedWorkSlugs") as
      | Prisma.InputJsonValue
      | undefined,
    approvedForAI: bool(fd, "approvedForAI"),
    approvedProjectFacts:
      approvedProjectFacts === undefined
        ? undefined
        : (approvedProjectFacts as object),
    heroStatement: optStr(fd, "heroStatement"),
    heroEyebrow: optStr(fd, "heroEyebrow"),
    heroSupportingCopy: optStr(fd, "heroSupportingCopy"),
    externalLinkLabel: optStr(fd, "externalLinkLabel"),
    platformContext: optStr(fd, "platformContext"),
    outcomeHeading: optStr(fd, "outcomeHeading"),
    challenges: parseJsonArrayField(fd, "challenges") as Prisma.InputJsonValue | undefined,
    approachSteps: parseJsonArrayField(fd, "approachSteps") as Prisma.InputJsonValue | undefined,
    solutionPoints: parseJsonArrayField(fd, "solutionPoints") as Prisma.InputJsonValue | undefined,
    highlights: parseJsonArrayField(fd, "highlights") as Prisma.InputJsonValue | undefined,
    caseStudyKind: str(fd, "caseStudyKind") === "product" ? "product" : "website",
    caseStudyContent: buildCaseStudyContentFromForm(fd, existingContent),
    industryIds: str(fd, "industryIds")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };
}
