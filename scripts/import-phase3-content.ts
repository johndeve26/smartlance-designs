/**
 * Phase 3 one-time / explicit content import.
 *
 * Safe behavior:
 * - Skips entirely if ContentImportMarker id=phase3 already exists (unless --force)
 * - Upserts by stable slug / legacyId
 * - Does NOT run automatically on deploy
 *
 * Usage:
 *   npx tsx scripts/import-phase3-content.ts
 *   npx tsx scripts/import-phase3-content.ts --force
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { industriesCatalog } from "../data/industries";
import { projects } from "../data/portfolio";
import { testimonials } from "../data/testimonials";
import { getPublishedGuides } from "../data/guides";
import { getPublishedComparisons } from "../data/comparisons";
import { getPublishedChecklists } from "../data/checklists";
import { getPublishedGlossaryEntries } from "../data/glossary";
import { getPublishedTemplates } from "../data/templates";
import { getPublishedTools } from "../data/tools";
import { resourceTopics } from "../data/resources";
import { legacyBlogRedirects } from "../data/legacy-blog-redirects";
import { resourceHref } from "../lib/content-routes";

const FORCE = process.argv.includes("--force");
const MARKER_ID = "phase3";
const MARKER_VERSION = "phase3-v1";

type Report = Record<string, unknown>;

function json(value: unknown) {
  return value as object;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const report: Report = {
    startedAt: new Date().toISOString(),
    force: FORCE,
  };

  try {
    const existing = await prisma.contentImportMarker.findUnique({
      where: { id: MARKER_ID },
    });
    if (existing && !FORCE) {
      console.log(
        `Phase 3 import skipped: marker ${MARKER_ID} exists (${existing.version}). Use --force to re-import.`,
      );
      report.skipped = true;
      report.existingMarker = existing;
      console.log(JSON.stringify(report, null, 2));
      return;
    }

    await prisma.$transaction(async (tx) => {
      // Topics
      let topicCount = 0;
      for (const [index, topic] of resourceTopics.entries()) {
        await tx.topic.upsert({
          where: { slug: topic.id },
          create: {
            slug: topic.id,
            name: topic.label,
            displayOrder: index,
            active: true,
          },
          update: {
            name: topic.label,
            displayOrder: index,
            active: true,
          },
        });
        topicCount += 1;
      }
      report.topics = topicCount;

      // Platforms lookup for work relations
      const platforms = await tx.platform.findMany({
        select: { id: true, name: true, platformMatch: true, slug: true },
      });

      // Work projects
      let workCount = 0;
      const workBySlug = new Map<string, string>();
      for (const [index, project] of projects.entries()) {
        const platform =
          platforms.find(
            (p) =>
              p.platformMatch === project.platform ||
              p.name === project.platform ||
              (project.platforms ?? []).includes(p.platformMatch) ||
              (project.platforms ?? []).includes(p.name),
          ) ?? null;

        const row = await tx.workProject.upsert({
          where: { slug: project.slug },
          create: {
            slug: project.slug,
            name: project.name,
            title: project.title ?? null,
            clientName: project.client ?? null,
            industryLabel: project.industry,
            projectType: project.projectType ?? null,
            shortDescription: project.shortDescription ?? null,
            overview: project.overview ?? null,
            challenge: project.challenge,
            solution: project.solution,
            approach: project.approach ?? null,
            designNotes: project.designNotes ?? null,
            developmentNotes: project.developmentNotes ?? null,
            seoNotes: project.seoNotes ?? null,
            resultSummary: project.resultSummary ?? null,
            results: project.results ? json(project.results) : undefined,
            measurableResults: project.measurableResults
              ? json(project.measurableResults)
              : undefined,
            goals: project.goals ? json(project.goals) : undefined,
            servicesLabels: json(project.services),
            technologies: project.technologies
              ? json(project.technologies)
              : undefined,
            platformId: platform?.id ?? null,
            platformLabel: project.platform ?? null,
            platformsLabels: project.platforms
              ? json(project.platforms)
              : undefined,
            websiteUrl: project.websiteUrl ?? null,
            oldUrl: project.oldUrl ?? null,
            year: project.year ?? null,
            coverImagePath: project.image ?? null,
            coverImageAlt: project.imageAlt ?? null,
            heroImagePath: project.heroImage ?? null,
            heroImageAlt: project.heroImageAlt ?? null,
            gallery: project.gallery ? json(project.gallery) : undefined,
            relatedServiceHrefs: project.relatedServiceHrefs
              ? json(project.relatedServiceHrefs)
              : undefined,
            relatedWorkSlugs: project.relatedSlugs
              ? json(project.relatedSlugs)
              : undefined,
            featured: Boolean(project.featured),
            featuredHomepage: Boolean(project.featured),
            featuredWorkArchive: Boolean(project.featured),
            displayOrder: index,
            heroStatement: project.heroStatement ?? null,
            challenges: project.challenges ? json(project.challenges) : undefined,
            approachSteps: project.approachSteps
              ? json(project.approachSteps)
              : undefined,
            solutionPoints: project.solutionPoints
              ? json(project.solutionPoints)
              : undefined,
            highlights: project.highlights ? json(project.highlights) : undefined,
            platformContext: project.platformContext ?? null,
            outcomeHeading: project.outcomeHeading ?? null,
            seoTitle: project.metaTitle,
            seoDescription: project.metaDescription,
            status: project.published ? "PUBLISHED" : "DRAFT",
            publishedAt: project.published ? new Date() : null,
          },
          update: FORCE
            ? {
                name: project.name,
                title: project.title ?? null,
                challenge: project.challenge,
                solution: project.solution,
                platformId: platform?.id ?? null,
                platformLabel: project.platform ?? null,
                coverImagePath: project.image ?? null,
                heroImagePath: project.heroImage ?? null,
                seoTitle: project.metaTitle,
                seoDescription: project.metaDescription,
                status: project.published ? "PUBLISHED" : "DRAFT",
              }
            : {},
        });
        workBySlug.set(project.slug, row.id);
        workCount += 1;

        if (project.image) {
          await tx.assetReference.upsert({
            where: { path: project.image },
            create: {
              path: project.image,
              alt: project.imageAlt ?? null,
              kind: "work-cover",
              entityHint: project.slug,
            },
            update: { alt: project.imageAlt ?? null },
          });
        }
        if (project.heroImage) {
          await tx.assetReference.upsert({
            where: { path: project.heroImage },
            create: {
              path: project.heroImage,
              alt: project.heroImageAlt ?? null,
              kind: "work-hero",
              entityHint: project.slug,
            },
            update: { alt: project.heroImageAlt ?? null },
          });
        }
      }
      report.work = workCount;

      // Industries
      let industryCount = 0;
      for (const [index, industry] of industriesCatalog.entries()) {
        const hasVerified = industry.group === "proven";
        const row = await tx.industry.upsert({
          where: { slug: industry.slug },
          create: {
            slug: industry.slug,
            name: industry.name,
            description: industry.description,
            icon: industry.icon,
            group: industry.group,
            featured: Boolean(industry.featured),
            displayOrder: index,
            hasVerifiedProjectExperience: hasVerified,
            relatedServiceLinks: json(industry.relatedServices ?? []),
            relatedSolutionSlugs: json([]),
            status: "PUBLISHED",
            publishedAt: new Date(),
          },
          update: FORCE
            ? {
                name: industry.name,
                description: industry.description,
                hasVerifiedProjectExperience: hasVerified,
                relatedServiceLinks: json(industry.relatedServices ?? []),
                group: industry.group,
                displayOrder: index,
              }
            : {},
        });

        await tx.industryWork.deleteMany({ where: { industryId: row.id } });
        for (const [sortOrder, projectSlug] of (
          industry.projectSlugs ?? []
        ).entries()) {
          const workId = workBySlug.get(projectSlug);
          if (!workId) {
            throw new Error(
              `Industry ${industry.slug} references missing work ${projectSlug}`,
            );
          }
          await tx.industryWork.create({
            data: { industryId: row.id, workId, sortOrder },
          });
        }
        industryCount += 1;
      }
      report.industries = industryCount;

      // Testimonials
      let testimonialCount = 0;
      for (const [index, item] of testimonials.entries()) {
        const workId = item.projectSlug
          ? workBySlug.get(item.projectSlug) ?? null
          : null;
        await tx.testimonial.upsert({
          where: { legacyId: item.id },
          create: {
            legacyId: item.id,
            quote: item.quote,
            name: item.name,
            role: item.role ?? null,
            company: item.company,
            serviceLabel: item.service,
            workProjectId: workId,
            verified: true,
            displayOrder: index,
            internalSource: item.source ?? null,
            internalSourceUrl: item.sourceUrl ?? null,
            status: item.published ? "PUBLISHED" : "DRAFT",
            publishedAt: item.published ? new Date() : null,
          },
          update: FORCE
            ? {
                quote: item.quote,
                name: item.name,
                company: item.company,
                workProjectId: workId,
                verified: true,
                status: item.published ? "PUBLISHED" : "DRAFT",
              }
            : {},
        });
        testimonialCount += 1;
      }
      report.testimonials = testimonialCount;
      report.testimonialsVerified = testimonialCount;

      // Insights from markdown
      const blogDir = path.join(process.cwd(), "content/blog");
      const files = fs
        .readdirSync(blogDir)
        .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"));
      let insightCount = 0;
      let missingHero = 0;
      const importedSlugs: string[] = [];

      for (const file of files) {
        const slug = file.replace(/\.mdx?$/, "");
        const raw = fs.readFileSync(path.join(blogDir, file), "utf8");
        const { data, content } = matter(raw);
        const stats = readingTime(content);
        const publishedAt = new Date(
          String(data.publishedAt ?? new Date().toISOString()),
        );
        if (Number.isNaN(publishedAt.getTime())) {
          throw new Error(`Invalid publishedAt for insight ${slug}`);
        }
        if (!content.trim()) {
          throw new Error(`Empty body for insight ${slug}`);
        }
        if (!data.heroImage) missingHero += 1;

        await tx.insight.upsert({
          where: { slug },
          create: {
            slug,
            title: String(data.title ?? slug),
            description: String(data.description ?? ""),
            bodyMarkdown: content,
            categoryLabel: String(data.category ?? "Digital Marketing"),
            author: data.author ? String(data.author) : "Smartlance Designs",
            readingTime: stats.text,
            heroImagePath: data.heroImage ? String(data.heroImage) : null,
            heroImageAlt: data.heroImageAlt ? String(data.heroImageAlt) : null,
            relatedServiceHrefs: Array.isArray(data.relatedServiceHrefs)
              ? json(data.relatedServiceHrefs.map(String))
              : json([]),
            tags: Array.isArray(data.tags) ? json(data.tags.map(String)) : undefined,
            featured: Boolean(data.featured),
            legacyUrl: data.legacyUrl ? String(data.legacyUrl) : null,
            originalPublishedAt: publishedAt,
            materialUpdatedAt: data.updatedAt
              ? new Date(String(data.updatedAt))
              : null,
            seoTitle: data.seoTitle ? String(data.seoTitle) : null,
            seoDescription: data.seoDescription
              ? String(data.seoDescription)
              : null,
            canonicalOverride: data.canonicalUrl
              ? String(data.canonicalUrl)
              : null,
            status: data.published === false ? "DRAFT" : "PUBLISHED",
            publishedAt: data.published === false ? null : publishedAt,
          },
          update: FORCE
            ? {
                title: String(data.title ?? slug),
                description: String(data.description ?? ""),
                bodyMarkdown: content,
                categoryLabel: String(data.category ?? "Digital Marketing"),
                originalPublishedAt: publishedAt,
                readingTime: stats.text,
                heroImagePath: data.heroImage ? String(data.heroImage) : null,
              }
            : {},
        });

        if (data.heroImage) {
          await tx.assetReference.upsert({
            where: { path: String(data.heroImage) },
            create: {
              path: String(data.heroImage),
              alt: data.heroImageAlt ? String(data.heroImageAlt) : null,
              kind: "insight-hero",
              entityHint: slug,
            },
            update: {},
          });
        }

        importedSlugs.push(slug);
        insightCount += 1;
      }
      report.insights = insightCount;
      report.insightsExpected = 59;
      report.insightsMissingHero = missingHero;
      report.insightsSlugs = importedSlugs.length;

      // Legacy blog redirects into Redirect table
      let redirectCount = 0;
      for (const [source, destination] of Object.entries(legacyBlogRedirects)) {
        await tx.redirect.upsert({
          where: { sourcePath: source },
          create: {
            sourcePath: source,
            destination,
            type: "PERMANENT_301",
            status: "ACTIVE",
            reason: "legacy-blog-root",
          },
          update: FORCE
            ? { destination, status: "ACTIVE", reason: "legacy-blog-root" }
            : {},
        });
        redirectCount += 1;
      }
      report.legacyBlogRedirects = redirectCount;

      // Resources
      const upsertResource = async (input: {
        type: "guide" | "comparison" | "checklist" | "glossary" | "template" | "tool";
        slug: string;
        title: string;
        description: string;
        deck?: string;
        payload: unknown;
        featured?: boolean;
        featuredOnResources?: boolean;
        featuredOrder?: number;
        readingTime?: string;
        author?: string;
        heroImagePath?: string;
        heroImageAlt?: string;
        relatedServiceHrefs?: string[];
        relatedSolutionSlugs?: string[];
        relatedPlatformSlugs?: string[];
        relatedInsightSlugs?: string[];
        relatedResourceIds?: string[];
        aliases?: string[];
        acronym?: string;
        shortDefinition?: string;
        seoTitle?: string;
        seoDescription?: string;
        publishedAt: string;
        updatedAt?: string;
        topicIds?: string[];
      }) => {
        const href = resourceHref(input.type, input.slug);
        const row = await tx.cmsResource.upsert({
          where: {
            type_slug: { type: input.type, slug: input.slug },
          },
          create: {
            type: input.type,
            slug: input.slug,
            title: input.title,
            description: input.description,
            deck: input.deck ?? null,
            href,
            payload: json(input.payload),
            featured: Boolean(input.featured),
            featuredOnResources: Boolean(input.featuredOnResources ?? input.featured),
            featuredOrder: input.featuredOrder ?? 0,
            readingTime: input.readingTime ?? null,
            author: input.author ?? null,
            heroImagePath: input.heroImagePath ?? null,
            heroImageAlt: input.heroImageAlt ?? null,
            relatedServiceHrefs: input.relatedServiceHrefs
              ? json(input.relatedServiceHrefs)
              : undefined,
            relatedSolutionSlugs: input.relatedSolutionSlugs
              ? json(input.relatedSolutionSlugs)
              : undefined,
            relatedPlatformSlugs: input.relatedPlatformSlugs
              ? json(input.relatedPlatformSlugs)
              : undefined,
            relatedInsightSlugs: input.relatedInsightSlugs
              ? json(input.relatedInsightSlugs)
              : undefined,
            relatedResourceIds: input.relatedResourceIds
              ? json(input.relatedResourceIds)
              : undefined,
            aliases: input.aliases ? json(input.aliases) : undefined,
            acronym: input.acronym ?? null,
            shortDefinition: input.shortDefinition ?? null,
            seoTitle: input.seoTitle ?? null,
            seoDescription: input.seoDescription ?? null,
            status: "PUBLISHED",
            publishedAt: new Date(input.publishedAt),
            materialUpdatedAt: input.updatedAt
              ? new Date(input.updatedAt)
              : null,
          },
          update: FORCE
            ? {
                title: input.title,
                description: input.description,
                payload: json(input.payload),
                href,
              }
            : {},
        });

        if (input.topicIds?.length) {
          await tx.cmsResourceTopic.deleteMany({ where: { resourceId: row.id } });
          for (const topicSlug of input.topicIds) {
            const topic = await tx.topic.findUnique({ where: { slug: topicSlug } });
            if (topic) {
              await tx.cmsResourceTopic.create({
                data: { resourceId: row.id, topicId: topic.id },
              });
            }
          }
        }
        return row;
      };

      for (const [order, guide] of getPublishedGuides().entries()) {
        await upsertResource({
          type: "guide",
          slug: guide.slug,
          title: guide.title,
          description: guide.description,
          deck: guide.deck,
          payload: guide,
          featured: guide.featured,
          featuredOnResources: true,
          featuredOrder: order,
          readingTime: guide.readingTime,
          author: guide.author,
          heroImagePath: guide.heroImage,
          heroImageAlt: guide.heroImageAlt,
          relatedServiceHrefs: guide.relatedServiceHrefs,
          relatedSolutionSlugs: guide.relatedSolutionSlugs,
          relatedInsightSlugs: guide.relatedInsightSlugs,
          relatedResourceIds: guide.relatedResourceIds,
          seoTitle: guide.seoTitle,
          seoDescription: guide.seoDescription,
          publishedAt: guide.publishedAt,
          updatedAt: guide.updatedAt,
          topicIds: guide.topicIds,
        });
      }
      report.guides = getPublishedGuides().length;

      for (const [order, comparison] of getPublishedComparisons().entries()) {
        await upsertResource({
          type: "comparison",
          slug: comparison.slug,
          title: comparison.title,
          description: comparison.description,
          deck: comparison.deck,
          payload: comparison,
          featured: comparison.featured,
          featuredOnResources: true,
          featuredOrder: 10 + order,
          readingTime: comparison.readingTime,
          relatedServiceHrefs: comparison.relatedServiceHrefs,
          relatedSolutionSlugs: comparison.relatedSolutionSlugs,
          relatedPlatformSlugs: comparison.relatedPlatformSlugs,
          relatedInsightSlugs: comparison.relatedInsightSlugs,
          seoTitle: comparison.seoTitle,
          seoDescription: comparison.seoDescription,
          publishedAt: comparison.publishedAt,
          updatedAt: comparison.updatedAt,
          topicIds: comparison.topicIds,
        });
      }
      report.comparisons = getPublishedComparisons().length;

      for (const checklist of getPublishedChecklists()) {
        let itemCount = 0;
        for (const section of checklist.sections) {
          itemCount += section.items?.length ?? 0;
          for (const g of section.subgroups ?? []) {
            itemCount += g.items?.length ?? 0;
          }
        }
        report.checklistItems = itemCount;
        await upsertResource({
          type: "checklist",
          slug: checklist.slug,
          title: checklist.title,
          description: checklist.description,
          payload: checklist,
          featured: checklist.featured,
          relatedServiceHrefs: checklist.relatedServiceHrefs,
          relatedSolutionSlugs: checklist.relatedSolutionSlugs,
          relatedInsightSlugs: checklist.relatedInsightSlugs,
          seoTitle: checklist.seoTitle,
          seoDescription: checklist.seoDescription,
          publishedAt: checklist.publishedAt,
          updatedAt: checklist.updatedAt,
          topicIds: checklist.topicIds,
        });
      }
      report.checklists = getPublishedChecklists().length;

      for (const entry of getPublishedGlossaryEntries()) {
        await upsertResource({
          type: "glossary",
          slug: entry.slug,
          title: entry.term,
          description: entry.shortDefinition,
          payload: entry,
          featured: entry.featured,
          aliases: entry.aliases,
          acronym: entry.acronym,
          shortDefinition: entry.shortDefinition,
          relatedServiceHrefs: entry.relatedServiceHrefs,
          relatedSolutionSlugs: entry.relatedSolutionSlugs,
          seoTitle: entry.seoTitle,
          seoDescription: entry.seoDescription,
          publishedAt: entry.publishedAt,
          updatedAt: entry.updatedAt,
          topicIds: entry.topicIds,
        });
      }
      report.glossary = getPublishedGlossaryEntries().length;

      for (const template of getPublishedTemplates()) {
        let fieldCount = 0;
        for (const section of template.sections) {
          fieldCount += section.fields?.length ?? 0;
        }
        report.templateFields = fieldCount;
        report.templateSections = template.sections.length;
        await upsertResource({
          type: "template",
          slug: template.slug,
          title: template.title,
          description: template.description,
          payload: template,
          featured: template.featured,
          relatedServiceHrefs: template.relatedServiceHrefs,
          relatedSolutionSlugs: template.relatedSolutionSlugs,
          seoTitle: template.seoTitle,
          seoDescription: template.seoDescription,
          publishedAt: template.publishedAt,
          updatedAt: template.updatedAt,
          topicIds: template.topicIds,
        });
      }
      report.templates = getPublishedTemplates().length;

      for (const tool of getPublishedTools()) {
        await upsertResource({
          type: "tool",
          slug: tool.slug,
          title: tool.title,
          description: tool.description,
          payload: tool,
          featured: tool.featured,
          relatedServiceHrefs: tool.relatedServiceHrefs,
          relatedSolutionSlugs: tool.relatedSolutionSlugs,
          relatedPlatformSlugs: undefined,
          seoTitle: tool.seoTitle,
          seoDescription: tool.seoDescription,
          publishedAt: tool.publishedAt,
          updatedAt: tool.updatedAt,
          topicIds: tool.topicIds,
        });
      }
      report.tools = getPublishedTools().length;

      await tx.contentImportMarker.upsert({
        where: { id: MARKER_ID },
        create: {
          id: MARKER_ID,
          version: MARKER_VERSION,
          report: json(report),
        },
        update: {
          version: MARKER_VERSION,
          report: json(report),
          completedAt: new Date(),
        },
      });
    }, {
      // Neon cold starts + full Phase 3 import exceed the default 5s interactive timeout
      maxWait: 60_000,
      timeout: 300_000,
    });

    // Validation summary
    const mismatches: string[] = [];
    if (report.insights !== 59) mismatches.push(`insights ${report.insights} != 59`);
    if (report.work !== 9) mismatches.push(`work ${report.work} != 9`);
    if (report.testimonials !== 7) mismatches.push(`testimonials ${report.testimonials} != 7`);
    if (report.guides !== 1) mismatches.push(`guides ${report.guides} != 1`);
    if (report.comparisons !== 1) mismatches.push(`comparisons != 1`);
    if (report.checklists !== 1) mismatches.push(`checklists != 1`);
    if (report.checklistItems !== 127) {
      mismatches.push(`checklist items ${report.checklistItems} != 127`);
    }
    if (report.glossary !== 12) mismatches.push(`glossary != 12`);
    if (report.templates !== 1) mismatches.push(`templates != 1`);
    if (report.tools !== 1) mismatches.push(`tools != 1`);
    if (report.legacyBlogRedirects !== 56) {
      mismatches.push(`legacy redirects ${report.legacyBlogRedirects} != 56`);
    }
    report.mismatches = mismatches;
    report.completedAt = new Date().toISOString();
    report.ok = mismatches.length === 0;

    console.log(JSON.stringify(report, null, 2));
    if (mismatches.length) {
      throw new Error(`Phase 3 import mismatches: ${mismatches.join("; ")}`);
    }
    console.log("Phase 3 content import completed successfully.");
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
