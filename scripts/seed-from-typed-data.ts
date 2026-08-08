import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { services } from "../data/services";
import { solutions } from "../data/solutions";
import { getSolutionPageContent } from "../data/solution-pages";
import { platforms } from "../data/platforms";
import {
  proofBarItems,
  problemPoints,
  growthSystemSteps,
  whySmartlanceItems,
  processSteps,
  reviewChecklist,
  seoHighlights,
  valueProps,
  trustStats,
  growthSystemItems,
  growthSystemFlow,
  homepageServiceItems,
  homepageTestimonialIds,
} from "../data/home";
import { siteConfig } from "../lib/site";

function json(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function optionalJson(
  value: unknown,
): Prisma.InputJsonValue | typeof Prisma.DbNull {
  if (value == null) return Prisma.DbNull;
  return json(value);
}

const HERO_SUPPORTING =
  "We design high-performing websites and SEO strategies that help businesses get found, build trust and turn more visitors into customers.";

const SECTION_KEYS = [
  "proofBarItems",
  "problemPoints",
  "growthSystemSteps",
  "whySmartlanceItems",
  "processSteps",
  "reviewChecklist",
  "seoHighlights",
  "valueProps",
  "trustStats",
  "growthSystemItems",
  "growthSystemFlow",
] as const;

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const now = new Date();

  try {
    let serviceCount = 0;
    for (const [index, service] of services.entries()) {
      const relatedSolutionSlugs =
        "relatedSolutionSlugs" in service
          ? (service as { relatedSolutionSlugs?: string[] }).relatedSolutionSlugs
          : undefined;

      const data = {
        slug: service.slug,
        href: service.href,
        title: service.title,
        shortTitle: service.shortTitle ?? null,
        category: service.category,
        group: service.group,
        icon: service.icon,
        summary: service.summary,
        description: service.description,
        tagline: service.tagline ?? null,
        narrativeTitle: service.narrativeTitle ?? null,
        narrative: service.narrative ?? null,
        seoConnection: service.seoConnection ?? null,
        audience: service.audience ?? null,
        platformsNote: service.platformsNote ?? null,
        visualVariant: service.visualVariant ?? null,
        featured: Boolean(service.featured),
        navigationFeatured: Boolean(service.navigationFeatured),
        displayOrder: index,
        capabilities: optionalJson(service.capabilities),
        idealFor: optionalJson(service.idealFor),
        problems: optionalJson(service.problems),
        deliverables: optionalJson(service.deliverables),
        process: optionalJson(service.process),
        evaluationItems: optionalJson(service.evaluationItems),
        faqs: optionalJson(service.faqs),
        relatedProjectSlugs: optionalJson(service.relatedProjectSlugs),
        relatedServiceSlugs: optionalJson(service.relatedServiceSlugs),
        relatedSeoSlugs: optionalJson(service.relatedSeoSlugs),
        relatedPlatformSlugs: optionalJson(service.relatedPlatformSlugs),
        relatedSolutionSlugs: optionalJson(relatedSolutionSlugs),
        ctaTitle: service.ctaTitle ?? null,
        ctaDescription: service.ctaDescription ?? null,
        primaryCtaLabel: service.primaryCtaLabel ?? null,
        primaryCtaHref: service.primaryCtaHref ?? null,
        secondaryCtaLabel: service.secondaryCtaLabel ?? null,
        secondaryCtaHref: service.secondaryCtaHref ?? null,
        seoTitle: service.metaTitle,
        seoDescription: service.metaDescription,
        status: "PUBLISHED" as const,
        publishedAt: now,
      };

      await prisma.service.upsert({
        where: { slug: service.slug },
        create: data,
        update: data,
      });
      serviceCount += 1;
    }

    let solutionCount = 0;
    for (const [index, solution] of solutions.entries()) {
      const pageContent = getSolutionPageContent(solution.slug);
      const isPublished = solution.published;
      const data = {
        slug: solution.slug,
        name: solution.name,
        title: solution.title,
        shortDescription: solution.shortDescription,
        category: solution.category,
        icon: solution.icon,
        featured: Boolean(solution.featured),
        displayOrder: index,
        eyebrow: solution.eyebrow ?? null,
        heroStatement: solution.heroStatement ?? null,
        heroSupporting: solution.heroSupporting ?? null,
        problemSymptoms: optionalJson(solution.problemSymptoms),
        possibleCauses: optionalJson(solution.possibleCauses),
        whatWeReview: optionalJson(solution.whatWeReview),
        process: optionalJson(solution.process),
        measurementPoints: optionalJson(solution.measurementPoints),
        relatedServiceHrefs: json(solution.relatedServiceHrefs),
        relatedPlatformSlugs: optionalJson(solution.relatedPlatformSlugs),
        relatedIndustrySlugs: optionalJson(solution.relatedIndustrySlugs),
        relatedProjectSlugs: optionalJson(solution.relatedProjectSlugs),
        relatedArticleSlugs: optionalJson(solution.relatedArticleSlugs),
        relatedServiceReasons: optionalJson(solution.relatedServiceReasons),
        relatedSolutions: optionalJson(solution.relatedSolutions),
        faqs: optionalJson(solution.faqs),
        pageKind: pageContent?.kind ?? null,
        pageContent: pageContent ? json(pageContent) : Prisma.DbNull,
        ctaTitle: solution.ctaTitle ?? null,
        ctaDescription: solution.ctaDescription ?? null,
        primaryCtaLabel: solution.primaryCtaLabel ?? null,
        primaryCtaHref: solution.primaryCtaHref ?? null,
        secondaryCtaLabel: solution.secondaryCtaLabel ?? null,
        secondaryCtaHref: solution.secondaryCtaHref ?? null,
        seoTitle: solution.seoTitle ?? null,
        seoDescription: solution.seoDescription ?? null,
        status: isPublished ? ("PUBLISHED" as const) : ("DRAFT" as const),
        publishedAt: isPublished ? now : null,
      };

      await prisma.solution.upsert({
        where: { slug: solution.slug },
        create: data,
        update: data,
      });
      solutionCount += 1;
    }

    let platformCount = 0;
    for (const [index, platform] of platforms.entries()) {
      const data = {
        slug: platform.slug,
        href: platform.href,
        name: platform.name,
        title: platform.title,
        summary: platform.summary,
        description: platform.description,
        tagline: platform.tagline ?? null,
        icon: platform.icon,
        group: platform.group,
        prominence: platform.prominence ?? null,
        featured: Boolean(platform.featured),
        navigationFeatured: Boolean(platform.navigationFeatured),
        verifiedExperience: Boolean(platform.verifiedExperience),
        platformMatch: platform.platformMatch,
        displayOrder: index,
        audiences: json(platform.audiences),
        whenItFits: optionalJson(platform.whenItFits),
        capabilities: json(platform.capabilities),
        challenges: optionalJson(platform.challenges),
        seoSection: optionalJson(platform.seoSection),
        relatedServiceHrefs: json(platform.relatedServiceHrefs),
        relatedSeoHrefs: optionalJson(platform.relatedSeoHrefs),
        faqs: optionalJson(platform.faqs),
        legacyUrl: platform.legacyUrl ?? null,
        conversionNote: platform.conversionNote ?? null,
        migrationNote: platform.migrationNote ?? null,
        ctaTitle: platform.ctaTitle ?? null,
        ctaDescription: platform.ctaDescription ?? null,
        seoTitle: platform.metaTitle,
        seoDescription: platform.metaDescription,
        status: "PUBLISHED" as const,
        publishedAt: now,
      };

      await prisma.platform.upsert({
        where: { slug: platform.slug },
        create: data,
        update: data,
      });
      platformCount += 1;
    }

    const sections = {
      proofBarItems,
      problemPoints,
      growthSystemSteps,
      whySmartlanceItems,
      processSteps,
      reviewChecklist,
      seoHighlights,
      valueProps,
      trustStats,
      growthSystemItems,
      growthSystemFlow,
    };

    const sectionVisibility = Object.fromEntries(
      SECTION_KEYS.map((key) => [key, true]),
    );

    const homepageData = {
      id: "home",
      heroEyebrow: "Website design, development & SEO",
      heroHeadline: "Websites Built to Rank, Convert and Grow.",
      heroHeadlineAccent: "Rank",
      heroSupporting: HERO_SUPPORTING,
      primaryCtaLabel: "Tell Us About Your Project",
      primaryCtaHref: "/contact",
      secondaryCtaLabel: "View Our Work",
      secondaryCtaHref: "/work",
      sections: json(sections),
      sectionVisibility: json(sectionVisibility),
      curatedServiceItems: json(homepageServiceItems),
      curatedTestimonialIds: json([...homepageTestimonialIds]),
      metaTitle: null,
      metaDescription: null,
      seoTitle: null,
      seoDescription: null,
    };

    await prisma.homepageContent.upsert({
      where: { id: "home" },
      create: homepageData,
      update: homepageData,
    });

    const siteSettingsData = {
      id: "site",
      siteName: siteConfig.name,
      businessName: siteConfig.legalName,
      defaultSiteDescription: siteConfig.description,
      defaultMetaTitle: `${siteConfig.name} | ${siteConfig.tagline}`,
      defaultMetaDescription: siteConfig.description,
      defaultOgImagePath: siteConfig.ogImage,
      contactEmail: siteConfig.email,
      contactPhone: siteConfig.phone,
      canonicalHost: new URL(siteConfig.url).host,
      primaryLogoPath: "/images/brand/smartlance-logo.png",
      logoOnDarkPath: "/images/brand/smartlance-logo-on-dark.png",
      faviconPath: "/images/brand/favicon-32.png",
      showPublicPricing: false,
      socialLinks: [
        {
          platform: "instagram",
          url: "https://www.instagram.com/smartlance_designs/",
          enabled: true,
          displayOrder: 0,
        },
      ],
    };

    await prisma.siteSettings.upsert({
      where: { id: "site" },
      create: siteSettingsData,
      update: siteSettingsData,
    });

    console.log(
      `Seed complete: ${serviceCount} services, ${solutionCount} solutions, ${platformCount} platforms, 1 homepage, 1 site settings`,
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
