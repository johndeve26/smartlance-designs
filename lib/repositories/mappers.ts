import type {
  HomepageContent,
  Platform as DbPlatform,
  Service as DbService,
  Solution as DbSolution,
} from "@prisma/client";
import type { Platform, Service, Solution } from "@/types";

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asOptionalArray<T>(value: unknown): T[] | undefined {
  if (value == null) return undefined;
  return Array.isArray(value) ? (value as T[]) : undefined;
}

/** Map DB Service → public Service type used by templates. */
export function toPublicService(row: DbService): Service {
  return {
    slug: row.slug,
    title: row.title,
    shortTitle: row.shortTitle ?? undefined,
    href: row.href,
    category: row.category as Service["category"],
    group: row.group as Service["group"],
    navigationFeatured: row.navigationFeatured || undefined,
    summary: row.summary,
    description: row.description,
    tagline: row.tagline ?? undefined,
    capabilities: asOptionalArray(row.capabilities),
    narrativeTitle: row.narrativeTitle ?? undefined,
    narrative: row.narrative ?? undefined,
    seoConnection: row.seoConnection ?? undefined,
    idealFor: asOptionalArray(row.idealFor),
    ctaTitle: row.ctaTitle ?? undefined,
    ctaDescription: row.ctaDescription ?? undefined,
    primaryCtaLabel: row.primaryCtaLabel ?? undefined,
    primaryCtaHref: row.primaryCtaHref ?? undefined,
    secondaryCtaLabel: row.secondaryCtaLabel ?? undefined,
    secondaryCtaHref: row.secondaryCtaHref ?? undefined,
    visualVariant: (row.visualVariant as Service["visualVariant"]) ?? undefined,
    relatedProjectSlugs: asOptionalArray(row.relatedProjectSlugs),
    evaluationItems: asOptionalArray(row.evaluationItems),
    audience: row.audience ?? undefined,
    platformsNote: row.platformsNote ?? undefined,
    icon: row.icon,
    featured: row.featured || undefined,
    problems: asOptionalArray(row.problems),
    deliverables: asOptionalArray(row.deliverables),
    process: asOptionalArray(row.process),
    faqs: asOptionalArray(row.faqs),
    relatedServiceSlugs: asOptionalArray(row.relatedServiceSlugs),
    relatedSeoSlugs: asOptionalArray(row.relatedSeoSlugs),
    relatedPlatformSlugs: asOptionalArray(row.relatedPlatformSlugs),
    metaTitle: row.seoTitle ?? row.title,
    metaDescription: row.seoDescription ?? row.summary,
    noIndex: row.noIndex,
    canonicalOverride: row.canonicalOverride,
    ogImagePath: row.ogImagePath,
  };
}

export function toPublicSolution(row: DbSolution): Solution {
  return {
    name: row.name,
    title: row.title,
    slug: row.slug,
    shortDescription: row.shortDescription,
    category: row.category as Solution["category"],
    featured: row.featured || undefined,
    published: row.status === "PUBLISHED",
    icon: row.icon,
    relatedServiceHrefs: asArray(row.relatedServiceHrefs),
    relatedPlatformSlugs: asOptionalArray(row.relatedPlatformSlugs),
    relatedIndustrySlugs: asOptionalArray(row.relatedIndustrySlugs),
    eyebrow: row.eyebrow ?? undefined,
    heroStatement: row.heroStatement ?? undefined,
    heroSupporting: row.heroSupporting ?? undefined,
    problemSymptoms: asOptionalArray(row.problemSymptoms),
    possibleCauses: asOptionalArray(row.possibleCauses),
    whatWeReview: asOptionalArray(row.whatWeReview),
    process: asOptionalArray(row.process),
    measurementPoints: asOptionalArray(row.measurementPoints),
    relatedProjectSlugs: asOptionalArray(row.relatedProjectSlugs),
    relatedArticleSlugs: asOptionalArray(row.relatedArticleSlugs),
    relatedServiceReasons: asOptionalArray(row.relatedServiceReasons),
    relatedSolutions: asOptionalArray(row.relatedSolutions),
    faqs: asOptionalArray(row.faqs),
    ctaTitle: row.ctaTitle ?? undefined,
    ctaDescription: row.ctaDescription ?? undefined,
    primaryCtaLabel: row.primaryCtaLabel ?? undefined,
    primaryCtaHref: row.primaryCtaHref ?? undefined,
    secondaryCtaLabel: row.secondaryCtaLabel ?? undefined,
    secondaryCtaHref: row.secondaryCtaHref ?? undefined,
    seoTitle: row.seoTitle ?? undefined,
    seoDescription: row.seoDescription ?? undefined,
    noIndex: row.noIndex,
    canonicalOverride: row.canonicalOverride,
    ogImagePath: row.ogImagePath,
  };
}

export function toPublicPlatform(row: DbPlatform): Platform {
  return {
    slug: row.slug,
    name: row.name,
    title: row.title,
    href: row.href,
    summary: row.summary,
    description: row.description,
    tagline: row.tagline ?? undefined,
    icon: row.icon,
    featured: row.featured || undefined,
    group: row.group as Platform["group"],
    prominence: (row.prominence as Platform["prominence"]) ?? undefined,
    navigationFeatured: row.navigationFeatured || undefined,
    verifiedExperience: row.verifiedExperience || undefined,
    platformMatch: row.platformMatch,
    audiences: asArray(row.audiences),
    whenItFits: asOptionalArray(row.whenItFits),
    capabilities: asArray(row.capabilities),
    challenges: asOptionalArray(row.challenges),
    seoSection: (row.seoSection as Platform["seoSection"]) ?? undefined,
    conversionNote: row.conversionNote ?? undefined,
    migrationNote: row.migrationNote ?? undefined,
    relatedServiceHrefs: asArray(row.relatedServiceHrefs),
    relatedSeoHrefs: asOptionalArray(row.relatedSeoHrefs),
    faqs: asOptionalArray(row.faqs),
    ctaTitle: row.ctaTitle ?? undefined,
    ctaDescription: row.ctaDescription ?? undefined,
    metaTitle: row.seoTitle ?? row.title,
    metaDescription: row.seoDescription ?? row.summary,
    noIndex: row.noIndex,
    canonicalOverride: row.canonicalOverride,
    ogImagePath: row.ogImagePath,
    legacyUrl: row.legacyUrl ?? undefined,
  };
}

export type HomepagePublic = {
  hero: {
    eyebrow: string;
    headline: string;
    headlineAccent: string | null;
    supporting: string;
    primaryCtaLabel: string;
    primaryCtaHref: string;
    secondaryCtaLabel: string;
    secondaryCtaHref: string;
  };
  metaTitle: string | null;
  metaDescription: string | null;
  sections: Record<string, unknown>;
  sectionVisibility: Record<string, boolean>;
  curatedServiceItems: unknown[];
  curatedTestimonialIds: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImagePath: string | null;
  noIndex: boolean;
  canonicalOverride: string | null;
};

export function toPublicHomepage(row: HomepageContent): HomepagePublic {
  return {
    hero: {
      eyebrow: row.heroEyebrow,
      headline: row.heroHeadline,
      headlineAccent: row.heroHeadlineAccent,
      supporting: row.heroSupporting,
      primaryCtaLabel: row.primaryCtaLabel,
      primaryCtaHref: row.primaryCtaHref,
      secondaryCtaLabel: row.secondaryCtaLabel,
      secondaryCtaHref: row.secondaryCtaHref,
    },
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    sections: (row.sections as Record<string, unknown>) ?? {},
    sectionVisibility:
      (row.sectionVisibility as Record<string, boolean>) ?? {},
    curatedServiceItems: asArray(row.curatedServiceItems),
    curatedTestimonialIds: asArray(row.curatedTestimonialIds),
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    ogTitle: row.ogTitle,
    ogDescription: row.ogDescription,
    ogImagePath: row.ogImagePath,
    noIndex: row.noIndex,
    canonicalOverride: row.canonicalOverride,
  };
}
