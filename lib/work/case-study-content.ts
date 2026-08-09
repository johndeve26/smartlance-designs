import { z } from "zod";
import type { CaseStudyKind, WorkProject } from "@prisma/client";
import type {
  ProductFeatureSection,
  Project,
  ProjectCaseStudyCta,
  ProjectCaseStudyHeadings,
  ProjectCaseStudyPoint,
  ProjectEngineeringStack,
  ProjectGalleryItem,
  ProjectServiceLink,
} from "@/types";

const safeHttpUrl = z
  .string()
  .trim()
  .refine(
    (value) => {
      if (!value) return true;
      if (value.startsWith("/") && !value.startsWith("//")) return true;
      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "URL must be http(s) or a site-relative path" },
  );

export const CaseStudyPointV1Schema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
});

export const ProjectGalleryItemV1Schema = z.object({
  id: z.string().min(1).optional(),
  src: z.string().min(1),
  alt: z.string().min(1),
  caption: z.string().optional(),
  layout: z.enum(["full", "half", "mobile"]).optional(),
});

export const ServiceLinkV1Schema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  href: safeHttpUrl.optional(),
  description: z.string().min(1),
});

export const EngineeringStackV1Schema = z.object({
  id: z.string().min(1),
  category: z.string().min(1),
  items: z.array(z.string().min(1)).min(1),
});

export const ProductFeatureSectionV1Schema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  heading: z.string().min(1),
  body: z.string().min(1),
  image: ProjectGalleryItemV1Schema.optional(),
});

export const CaseStudyCtaV1Schema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  primaryLabel: z.string().optional(),
  primaryHref: safeHttpUrl.optional(),
  secondaryLabel: z.string().optional(),
  secondaryHref: safeHttpUrl.optional(),
});

export const CaseStudySectionHeadingsV1Schema = z.object({
  intro: z.string().optional(),
  challenge: z.string().optional(),
  approach: z.string().optional(),
  solution: z.string().optional(),
  outcome: z.string().optional(),
  engineering: z.string().optional(),
  platform: z.string().optional(),
  principles: z.string().optional(),
  saasInfrastructure: z.string().optional(),
});

export const CaseStudyContentV1Schema = z.object({
  version: z.literal(1),
  introHeading: z.string().optional(),
  sectionHeadings: CaseStudySectionHeadingsV1Schema.optional(),
  solutionIntro: z.string().optional(),
  serviceLinks: z.array(ServiceLinkV1Schema).optional(),
  engineeringIntro: z.string().optional(),
  engineeringStacks: z.array(EngineeringStackV1Schema).optional(),
  productPrinciples: z.array(CaseStudyPointV1Schema).optional(),
  productFeatures: z.array(ProductFeatureSectionV1Schema).optional(),
  saasInfrastructure: z.array(EngineeringStackV1Schema).optional(),
  showArchitectureDiagram: z.boolean().optional(),
  caseStudyCta: CaseStudyCtaV1Schema.optional(),
  gallery: z.array(ProjectGalleryItemV1Schema).optional(),
});

export type CaseStudyContentV1 = z.infer<typeof CaseStudyContentV1Schema>;

export function parseCaseStudyContent(raw: unknown): CaseStudyContentV1 | null {
  if (raw == null) return null;
  const result = CaseStudyContentV1Schema.safeParse(raw);
  return result.success ? result.data : null;
}

export function parseCaseStudyKind(raw: CaseStudyKind | string | null | undefined): "website" | "product" {
  return raw === "PRODUCT" ? "product" : "website";
}

function stripIds<T extends { id: string }>(
  items: T[] | undefined,
  map: (item: Omit<T, "id">) => unknown,
) {
  return items?.map(({ id: _id, ...rest }) => map(rest as Omit<T, "id">));
}

export function caseStudyContentToProjectFields(
  content: CaseStudyContentV1 | null,
): Partial<Project> & { solutionIntro?: string } {
  if (!content) return {};

  const sectionHeadings: ProjectCaseStudyHeadings = {
    intro: content.introHeading ?? content.sectionHeadings?.intro,
    challenge: content.sectionHeadings?.challenge,
    approach: content.sectionHeadings?.approach,
    solution: content.sectionHeadings?.solution,
    outcome: content.sectionHeadings?.outcome,
    engineering: content.sectionHeadings?.engineering,
    platform: content.sectionHeadings?.platform,
    principles: content.sectionHeadings?.principles,
    saasInfrastructure: content.sectionHeadings?.saasInfrastructure,
  };

  return {
    sectionHeadings,
    serviceLinks: stripIds(content.serviceLinks, (rest) => rest) as
      | ProjectServiceLink[]
      | undefined,
    engineeringIntro: content.engineeringIntro,
    engineeringStacks: stripIds(content.engineeringStacks, (rest) => rest) as
      | ProjectEngineeringStack[]
      | undefined,
    productPrinciples: stripIds(content.productPrinciples, (rest) => rest) as
      | ProjectCaseStudyPoint[]
      | undefined,
    productFeatures: stripIds(content.productFeatures, (rest) => rest) as
      | ProductFeatureSection[]
      | undefined,
    saasInfrastructure: stripIds(content.saasInfrastructure, (rest) => rest) as
      | ProjectEngineeringStack[]
      | undefined,
    showArchitectureDiagram: content.showArchitectureDiagram,
    caseStudyCta: content.caseStudyCta as ProjectCaseStudyCta | undefined,
    gallery: stripIds(
      content.gallery?.filter((item): item is typeof item & { id: string } =>
        Boolean(item.id),
      ),
      (rest) => rest,
    ) as ProjectGalleryItem[] | undefined,
    solutionIntro: content.solutionIntro,
  };
}

export function applyPublishedCaseStudyFields(row: WorkProject, base: Project): Project {
  const parsed = parseCaseStudyContent(row.caseStudyContent);
  const fromContent = caseStudyContentToProjectFields(parsed);

  return {
    ...base,
    ...fromContent,
    caseStudyKind: parseCaseStudyKind(row.caseStudyKind),
    heroEyebrow: row.heroEyebrow ?? base.heroEyebrow,
    heroSupportingCopy: row.heroSupportingCopy ?? base.heroSupportingCopy,
    externalLinkLabel: row.externalLinkLabel ?? base.externalLinkLabel,
    sectionHeadings: {
      ...fromContent.sectionHeadings,
      ...base.sectionHeadings,
    },
    gallery: base.gallery?.length ? base.gallery : fromContent.gallery,
    serviceLinks: base.serviceLinks?.length ? base.serviceLinks : fromContent.serviceLinks,
    engineeringStacks: base.engineeringStacks?.length
      ? base.engineeringStacks
      : fromContent.engineeringStacks,
    productPrinciples: base.productPrinciples?.length
      ? base.productPrinciples
      : fromContent.productPrinciples,
    productFeatures: base.productFeatures?.length
      ? base.productFeatures
      : fromContent.productFeatures,
    saasInfrastructure: base.saasInfrastructure?.length
      ? base.saasInfrastructure
      : fromContent.saasInfrastructure,
    caseStudyCta: base.caseStudyCta ?? fromContent.caseStudyCta,
    showArchitectureDiagram:
      base.showArchitectureDiagram ?? fromContent.showArchitectureDiagram,
  };
}

export function validateCaseStudyContentInput(raw: unknown): CaseStudyContentV1 | null {
  if (raw == null || raw === "") return null;
  let value = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch {
      throw new Error("Case study content must be valid JSON.");
    }
  }
  const parsed = CaseStudyContentV1Schema.safeParse(value);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((issue) => issue.message).join("; "));
  }
  return parsed.data;
}

export function caseStudyKindFromInput(value: string | null | undefined): CaseStudyKind {
  return value === "product" || value === "PRODUCT" ? "PRODUCT" : "WEBSITE";
}

export const PHASE3_WORK_CASE_STUDY_MARKER = "phase3-work-case-study";
