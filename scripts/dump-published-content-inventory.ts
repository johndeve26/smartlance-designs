/**
 * One-shot published CMS inventory dump for content quality audit.
 * Read-only — does not mutate content.
 *
 * Usage: npx tsx scripts/dump-published-content-inventory.ts
 */

import { writeFileSync } from "fs";
import { prisma } from "@/lib/db";

function arrLen(v: unknown): number {
  return Array.isArray(v) ? v.length : 0;
}

function textLen(v: unknown): number {
  return typeof v === "string" ? v.trim().length : 0;
}

async function main() {
  const [
    services,
    solutions,
    platforms,
    industries,
    work,
    testimonials,
    insights,
    resources,
    home,
  ] = await Promise.all([
    prisma.service.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { title: "asc" },
    }),
    prisma.solution.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { name: "asc" },
    }),
    prisma.platform.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { name: "asc" },
    }),
    prisma.industry.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { name: "asc" },
      include: { workLinks: { select: { workId: true } } },
    }),
    prisma.workProject.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { name: "asc" },
      include: {
        industryLinks: { select: { industryId: true } },
        testimonials: { select: { id: true, verified: true, status: true } },
      },
    }),
    prisma.testimonial.findMany({
      where: { status: "PUBLISHED", verified: true },
      orderBy: { displayOrder: "asc" },
    }),
    prisma.insight.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      include: { topics: { include: { topic: true } } },
    }),
    prisma.cmsResource.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ type: "asc" }, { title: "asc" }],
    }),
    prisma.homepageContent.findUnique({ where: { id: "home" } }),
  ]);

  const out = {
    auditedAt: new Date().toISOString(),
    auditVersion: "site-content-audit:v1",
    counts: {
      homepage: home ? 1 : 0,
      services: services.length,
      solutions: solutions.length,
      platforms: platforms.length,
      industries: industries.length,
      work: work.length,
      testimonials: testimonials.length,
      insights: insights.length,
      resources: resources.length,
      resourcesByType: resources.reduce(
        (a, r) => {
          a[r.type] = (a[r.type] || 0) + 1;
          return a;
        },
        {} as Record<string, number>,
      ),
    },
    homepage: home
      ? {
          heroEyebrow: home.heroEyebrow,
          heroHeadline: home.heroHeadline,
          heroHeadlineAccent: home.heroHeadlineAccent,
          heroSupporting: home.heroSupporting,
          primaryCtaLabel: home.primaryCtaLabel,
          primaryCtaHref: home.primaryCtaHref,
          secondaryCtaLabel: home.secondaryCtaLabel,
          secondaryCtaHref: home.secondaryCtaHref,
          seoTitle: home.seoTitle || home.metaTitle,
          seoDescription: home.seoDescription || home.metaDescription,
          curatedServiceItems: home.curatedServiceItems,
          curatedTestimonialIds: home.curatedTestimonialIds,
          sectionKeys:
            home.sections && typeof home.sections === "object"
              ? Object.keys(home.sections as object)
              : [],
          sectionVisibility: home.sectionVisibility,
          hasDraft: Boolean(home.draftJson),
        }
      : null,
    services: services.map((s) => ({
      id: s.id,
      slug: s.slug,
      href: s.href,
      title: s.title,
      category: s.category,
      group: s.group,
      summary: s.summary,
      summaryLen: textLen(s.summary),
      description: s.description,
      descLen: textLen(s.description),
      tagline: s.tagline,
      narrativeLen: textLen(s.narrative),
      process: arrLen(s.process),
      deliverables: arrLen(s.deliverables),
      problems: arrLen(s.problems),
      idealFor: arrLen(s.idealFor),
      faqs: arrLen(s.faqs),
      seoTitle: s.seoTitle,
      seoDescription: s.seoDescription,
      primaryCtaLabel: s.primaryCtaLabel,
      primaryCtaHref: s.primaryCtaHref,
      relatedServiceSlugs: s.relatedServiceSlugs,
      relatedSolutionSlugs: s.relatedSolutionSlugs,
      relatedPlatformSlugs: s.relatedPlatformSlugs,
      relatedProjectSlugs: s.relatedProjectSlugs,
      updatedAt: s.updatedAt,
    })),
    solutions: solutions.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      title: s.title,
      shortDescription: s.shortDescription,
      shortLen: textLen(s.shortDescription),
      heroStatement: s.heroStatement,
      heroSupporting: s.heroSupporting,
      problemSymptoms: arrLen(s.problemSymptoms),
      possibleCauses: arrLen(s.possibleCauses),
      whatWeReview: arrLen(s.whatWeReview),
      process: arrLen(s.process),
      measurementPoints: arrLen(s.measurementPoints),
      hasPageContent: Boolean(s.pageContent),
      pageContentKind:
        s.pageContent &&
        typeof s.pageContent === "object" &&
        "kind" in (s.pageContent as object)
          ? String((s.pageContent as { kind?: string }).kind)
          : null,
      seoTitle: s.seoTitle,
      seoDescription: s.seoDescription,
      relatedServiceHrefs: s.relatedServiceHrefs,
      relatedPlatformSlugs: s.relatedPlatformSlugs,
      relatedIndustrySlugs: s.relatedIndustrySlugs,
      primaryCtaLabel: s.primaryCtaLabel,
      primaryCtaHref: s.primaryCtaHref,
      updatedAt: s.updatedAt,
    })),
    platforms: platforms.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      title: s.title,
      summary: s.summary,
      summaryLen: textLen(s.summary),
      descLen: textLen(s.description),
      description: s.description,
      tagline: s.tagline,
      group: s.group,
      verifiedExperience: s.verifiedExperience,
      platformMatch: s.platformMatch,
      audiences: arrLen(s.audiences),
      whenItFits: arrLen(s.whenItFits),
      capabilities: arrLen(s.capabilities),
      challenges: arrLen(s.challenges),
      faqs: arrLen(s.faqs),
      lastReviewedAt: s.lastReviewedAt,
      seoTitle: s.seoTitle,
      seoDescription: s.seoDescription,
      relatedServiceHrefs: s.relatedServiceHrefs,
      conversionNoteLen: textLen(s.conversionNote),
      migrationNoteLen: textLen(s.migrationNote),
      updatedAt: s.updatedAt,
    })),
    industries: industries.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      description: s.description,
      descLen: textLen(s.description),
      group: s.group,
      proven: s.hasVerifiedProjectExperience,
      relatedServiceLinks: s.relatedServiceLinks,
      relatedSolutionSlugs: s.relatedSolutionSlugs,
      workLinkCount: s.workLinks.length,
      seoTitle: s.seoTitle,
      seoDescription: s.seoDescription,
      updatedAt: s.updatedAt,
    })),
    work: work.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      industryLabel: s.industryLabel,
      shortDescription: s.shortDescription,
      challenge: s.challenge,
      challengeLen: textLen(s.challenge),
      solution: s.solution,
      solutionLen: textLen(s.solution),
      resultSummary: s.resultSummary,
      results: arrLen(s.results),
      measurableResults: arrLen(s.measurableResults),
      servicesLabels: s.servicesLabels,
      technologies: s.technologies,
      platformId: s.platformId,
      platformLabel: s.platformLabel,
      relatedServiceHrefs: s.relatedServiceHrefs,
      industryLinkCount: s.industryLinks.length,
      testimonialCount: s.testimonials.filter(
        (t) => t.verified && t.status === "PUBLISHED",
      ).length,
      seoTitle: s.seoTitle,
      seoDescription: s.seoDescription,
      approvedForAI: s.approvedForAI,
      hasApprovedFacts: Boolean(s.approvedProjectFacts),
      updatedAt: s.updatedAt,
    })),
    testimonials: testimonials.map((s) => ({
      id: s.id,
      legacyId: s.legacyId,
      name: s.name,
      role: s.role,
      company: s.company,
      quoteLen: textLen(s.quote),
      displayExcerpt: s.displayExcerpt,
      hasOriginalQuote: Boolean(s.originalQuote),
      originalMatchesQuote:
        s.originalQuote && s.quote
          ? s.originalQuote.trim() === s.quote.trim() ||
            (s.displayExcerpt
              ? s.originalQuote.includes(s.displayExcerpt.trim())
              : true)
          : null,
      workProjectId: s.workProjectId,
      serviceLabel: s.serviceLabel,
      verified: s.verified,
    })),
    insights: insights.map((s) => ({
      id: s.id,
      slug: s.slug,
      title: s.title,
      description: s.description,
      descriptionLen: textLen(s.description),
      bodyLen: textLen(s.bodyMarkdown),
      categoryLabel: s.categoryLabel,
      topics: s.topics.map((t) => t.topic.slug),
      relatedServiceHrefs: s.relatedServiceHrefs,
      seoTitle: s.seoTitle,
      seoDescription: s.seoDescription,
      publishedAt: s.publishedAt,
      originalPublishedAt: s.originalPublishedAt,
      materialUpdatedAt: s.materialUpdatedAt,
      updatedAt: s.updatedAt,
    })),
    resources: resources.map((s) => ({
      id: s.id,
      type: s.type,
      slug: s.slug,
      title: s.title,
      description: s.description,
      descLen: textLen(s.description),
      deckLen: textLen(s.deck),
      shortDefinitionLen: textLen(s.shortDefinition),
      acronym: s.acronym,
      aliases: s.aliases,
      seoTitle: s.seoTitle,
      seoDescription: s.seoDescription,
      relatedServiceHrefs: s.relatedServiceHrefs,
      relatedPlatformSlugs: s.relatedPlatformSlugs,
      relatedSolutionSlugs: s.relatedSolutionSlugs,
      relatedInsightSlugs: s.relatedInsightSlugs,
      materialUpdatedAt: s.materialUpdatedAt,
      payloadKeys:
        s.payload && typeof s.payload === "object"
          ? Object.keys(s.payload as object)
          : [],
      payloadPreview: s.payload,
      updatedAt: s.updatedAt,
    })),
  };

  const path = "docs/audit-artifacts/published-content-inventory.json";
  writeFileSync(path, JSON.stringify(out, null, 2));
  console.log("Wrote", path);
  console.log(JSON.stringify(out.counts, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
