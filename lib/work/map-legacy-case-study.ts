import type { CaseStudyKind } from "@prisma/client";
import type { CaseStudyNarrative } from "@/data/case-study-narratives";
import type { Project } from "@/types";
import type { CaseStudyContentV1 } from "@/lib/work/case-study-content";

function pointId(slug: string, prefix: string, index: number) {
  return `${slug}-${prefix}-${index}`;
}

function stackId(slug: string, prefix: string, index: number) {
  return `${slug}-${prefix}-stack-${index}`;
}

export function mapLegacyCaseStudyContent(
  slug: string,
  narrative: CaseStudyNarrative,
  portfolio?: Project,
): CaseStudyContentV1 {
  return {
    version: 1,
    introHeading: narrative.introHeading,
    sectionHeadings: narrative.sectionHeadings,
    solutionIntro: narrative.solutionIntro,
    serviceLinks: narrative.serviceLinks?.map((link, index) => ({
      id: pointId(slug, "service-link", index),
      ...link,
    })),
    engineeringIntro: narrative.engineeringIntro ?? portfolio?.engineeringIntro,
    engineeringStacks: (narrative.engineeringStacks ?? portfolio?.engineeringStacks)?.map(
      (stack, index) => ({
        id: stackId(slug, "engineering", index),
        ...stack,
      }),
    ),
    productPrinciples: narrative.productPrinciples?.map((item, index) => ({
      id: pointId(slug, "principle", index),
      ...item,
    })),
    productFeatures: narrative.productFeatures?.map((feature, index) => ({
      id: pointId(slug, "feature", index),
      ...feature,
      image: feature.image
        ? { id: pointId(slug, "feature-image", index), ...feature.image }
        : undefined,
    })),
    saasInfrastructure: narrative.saasInfrastructure?.map((stack, index) => ({
      id: stackId(slug, "saas", index),
      ...stack,
    })),
    showArchitectureDiagram:
      narrative.showArchitectureDiagram ?? portfolio?.showArchitectureDiagram,
    caseStudyCta: narrative.caseStudyCta ?? portfolio?.caseStudyCta,
    gallery: (narrative.gallery ?? portfolio?.gallery)?.map((item, index) => ({
      id: pointId(slug, "gallery", index),
      ...item,
    })),
  };
}

export function mapLegacyWorkPublishedFields(
  slug: string,
  portfolio: Project,
  narrative: CaseStudyNarrative,
) {
  return {
    heroStatement: narrative.heroStatement,
    heroEyebrow: narrative.heroEyebrow ?? portfolio.heroEyebrow ?? null,
    heroSupportingCopy: narrative.heroSupportingCopy ?? portfolio.heroSupportingCopy ?? null,
    externalLinkLabel: narrative.externalLinkLabel ?? portfolio.externalLinkLabel ?? null,
    caseStudyKind: (portfolio.caseStudyKind === "product"
      ? "PRODUCT"
      : "WEBSITE") as CaseStudyKind,
    challenges: narrative.challenges,
    approachSteps: narrative.approachSteps,
    solutionPoints: narrative.solutionPoints,
    highlights: narrative.highlights,
    platformContext: narrative.platformContext ?? portfolio.platformContext ?? null,
    outcomeHeading: narrative.outcomeHeading ?? portfolio.outcomeHeading ?? null,
    caseStudyContent: mapLegacyCaseStudyContent(slug, narrative, portfolio),
  };
}
