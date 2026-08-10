/**
 * Phase 3 public content loaders — DB first, typed/markdown fallback when empty.
 * Work listing/detail uses `resolveWorkContentRuntime()` (Phase 2) — no typed merge.
 */
import { hasDatabaseUrl } from "@/lib/db";
import {
  countPublishedInsights,
  type InsightPublic,
} from "@/lib/repositories/insightsRepository";
import {
  listPublishedInsights,
  getPublishedInsightBySlug,
} from "@/lib/repositories/insightsRepository";
import {
  resolveCmsContentRuntime,
  CmsDatabaseUnavailableError,
} from "@/lib/content/content-source";
import {
  resolveWorkContentRuntime,
  WorkDatabaseUnavailableError,
} from "@/lib/content/work-source";
import {
  listPublishedWork,
  getPublishedWorkBySlug,
  getAdjacentPublicWork,
  listRelatedPublicWork,
} from "@/lib/repositories/workRepository";
import { getAdjacentProjects } from "@/lib/case-study";
import {
  catalogToDetail,
  getPublishedIndustryBySlug,
  listPublishedIndustries,
} from "@/lib/repositories/industriesRepository";
import {
  listPublishedTestimonials,
  getTestimonialForWorkSlug,
  getPublishedTestimonialByLegacyId,
} from "@/lib/repositories/testimonialsRepository";
import {
  getPublishedResourceBySlug,
  listAllPublishedResourceListingRows,
  listPublishedResourceListingRows,
  resourcePayload,
} from "@/lib/repositories/resourcesRepository";
import type {
  GuideContent,
  ComparisonContent,
  ChecklistContent,
  GlossaryContent,
  TemplateContent,
  ToolContent,
} from "@/data/resource-content-types";
import { getAllPosts as getMarkdownPosts, getPostBySlug as getMarkdownPost } from "@/lib/blog";
import {
  getProjectBySlug as getTypedProject,
  getRelatedProjects as getTypedRelatedProjects,
  getVisibleProjects,
} from "@/data/portfolio";
import { industriesCatalog } from "@/data/industries";
import { getPublishedTestimonials as getTypedTestimonials, getTestimonialById } from "@/data/testimonials";
import { getPublishedGuides, getGuideBySlug } from "@/data/guides";
import { getPublishedComparisons, getComparisonBySlug } from "@/data/comparisons";
import { getPublishedChecklists, getChecklistBySlug } from "@/data/checklists";
import { getPublishedGlossaryEntries, getGlossaryEntryBySlug } from "@/data/glossary";
import { getPublishedTemplates, getTemplateBySlug } from "@/data/templates";
import { getPublishedTools, getToolBySlug } from "@/data/tools";
import type { BlogPost } from "@/lib/blog";
import {
  countResourcesByType,
  mapResourceListingRow,
  toPublicResourceCard,
  type PublicResourceCard,
  type ResourceDiscoveryCounts,
} from "@/lib/resources/discovery";
import type { IndustryPublicDetail, Project } from "@/types";

export async function loadPublishedInsights(): Promise<BlogPost[]> {
  if (!hasDatabaseUrl()) return getMarkdownPosts();
  const rows = await listPublishedInsights();
  if (!rows.length) return getMarkdownPosts();
  return rows as BlogPost[];
}

export async function loadInsightBySlug(slug: string): Promise<BlogPost | null> {
  if (!hasDatabaseUrl()) return getMarkdownPost(slug);
  const row = await getPublishedInsightBySlug(slug);
  if (row) return row as BlogPost;
  // Fallback only when DB has zero insights (pre-import)
  const count = await countPublishedInsights();
  if (!count) return getMarkdownPost(slug);
  return null;
}

export async function loadPublishedWork(): Promise<Project[]> {
  try {
    const runtime = await resolveWorkContentRuntime();
    if (runtime === "typed-fallback") {
      return getVisibleProjects();
    }

    try {
      return await listPublishedWork();
    } catch (error) {
      console.error("[phase3-public] loadPublishedWork failed", error);
      return [];
    }
  } catch (error) {
    if (error instanceof WorkDatabaseUnavailableError) {
      console.error("[phase3-public] work runtime unavailable", error);
      return [];
    }
    throw error;
  }
}

export async function loadWorkBySlug(slug: string): Promise<Project | null> {
  try {
    const runtime = await resolveWorkContentRuntime();
    if (runtime === "typed-fallback") {
      return getTypedProject(slug) ?? null;
    }

    try {
      return await getPublishedWorkBySlug(slug);
    } catch (error) {
      console.error("[phase3-public] loadWorkBySlug failed", error);
      return null;
    }
  } catch (error) {
    if (error instanceof WorkDatabaseUnavailableError) {
      console.error("[phase3-public] work runtime unavailable", error);
      return null;
    }
    throw error;
  }
}

export async function loadAdjacentWork(slug: string): Promise<{
  previous: Project | null;
  next: Project | null;
}> {
  try {
    const runtime = await resolveWorkContentRuntime();
    if (runtime === "typed-fallback") {
      return getAdjacentProjects(slug);
    }

    try {
      const catalog = await listPublishedWork();
      return getAdjacentPublicWork(slug, catalog);
    } catch (error) {
      console.error("[phase3-public] loadAdjacentWork failed", error);
      return { previous: null, next: null };
    }
  } catch (error) {
    if (error instanceof WorkDatabaseUnavailableError) {
      console.error("[phase3-public] work runtime unavailable", error);
      return { previous: null, next: null };
    }
    throw error;
  }
}

export async function loadRelatedWork(
  project: Project,
  limit = 2,
): Promise<Project[]> {
  try {
    const runtime = await resolveWorkContentRuntime();
    if (runtime === "typed-fallback") {
      return getTypedRelatedProjects(project.relatedSlugs)
        .filter((item) => item.slug !== project.slug)
        .slice(0, limit);
    }

    try {
      const catalog = await listPublishedWork();
      return listRelatedPublicWork(project, catalog, limit);
    } catch (error) {
      console.error("[phase3-public] loadRelatedWork failed", error);
      return [];
    }
  } catch (error) {
    if (error instanceof WorkDatabaseUnavailableError) {
      console.error("[phase3-public] work runtime unavailable", error);
      return [];
    }
    throw error;
  }
}

export async function loadPublishedIndustries() {
  try {
    const runtime = await resolveCmsContentRuntime();
    if (runtime === "typed-fallback") {
      return industriesCatalog;
    }

    try {
      return await listPublishedIndustries();
    } catch (error) {
      console.error("[phase3-public] loadPublishedIndustries failed", error);
      return [];
    }
  } catch (error) {
    if (error instanceof CmsDatabaseUnavailableError) {
      console.error("[phase3-public] industries runtime unavailable", error);
      return [];
    }
    throw error;
  }
}

export async function loadIndustryBySlug(
  slug: string,
): Promise<IndustryPublicDetail | null> {
  try {
    const runtime = await resolveCmsContentRuntime();
    if (runtime === "typed-fallback") {
      const item = industriesCatalog.find((entry) => entry.slug === slug);
      return item ? catalogToDetail(item) : null;
    }

    try {
      return await getPublishedIndustryBySlug(slug);
    } catch (error) {
      console.error("[phase3-public] loadIndustryBySlug failed", error);
      return null;
    }
  } catch (error) {
    if (error instanceof CmsDatabaseUnavailableError) {
      console.error("[phase3-public] industries runtime unavailable", error);
      return null;
    }
    throw error;
  }
}

export async function loadPublishedTestimonials() {
  if (!hasDatabaseUrl()) return getTypedTestimonials();
  const rows = await listPublishedTestimonials();
  if (!rows.length) return getTypedTestimonials();
  return rows;
}

export async function loadTestimonialForWork(workSlug: string) {
  if (!hasDatabaseUrl()) {
    const project = getTypedProject(workSlug);
    if (!project?.testimonialId) return null;
    return getTestimonialById(project.testimonialId) ?? null;
  }
  const row = await getTestimonialForWorkSlug(workSlug);
  if (row) return row;
  const probe = await listPublishedTestimonials();
  if (!probe.length) {
    const project = getTypedProject(workSlug);
    if (!project?.testimonialId) return null;
    return getTestimonialById(project.testimonialId) ?? null;
  }
  return null;
}

export async function loadTestimonialByLegacyId(id: string) {
  if (!hasDatabaseUrl()) return getTestimonialById(id) ?? null;
  const row = await getPublishedTestimonialByLegacyId(id);
  if (row) return row;
  const probe = await listPublishedTestimonials();
  if (!probe.length) return getTestimonialById(id) ?? null;
  return null;
}

async function loadResourcePayload<T>(
  type: "guide" | "comparison" | "checklist" | "glossary" | "template" | "tool",
  slug: string,
  typedGet: (slug: string) => T | undefined,
): Promise<T | null> {
  try {
    const runtime = await resolveCmsContentRuntime();
    if (runtime === "typed-fallback") {
      return typedGet(slug) ?? null;
    }

    try {
      const row = await getPublishedResourceBySlug(type, slug);
      if (row) return resourcePayload<T>(row);
      return null;
    } catch (error) {
      console.error(`[phase3-public] loadResourcePayload(${type}) failed`, error);
      return null;
    }
  } catch (error) {
    if (error instanceof CmsDatabaseUnavailableError) {
      console.error("[phase3-public] resource runtime unavailable", error);
      return null;
    }
    throw error;
  }
}

async function loadResourceList<T>(
  type: "guide" | "comparison" | "checklist" | "glossary" | "template" | "tool",
  typedList: () => T[],
): Promise<T[]> {
  try {
    const runtime = await resolveCmsContentRuntime();
    if (runtime === "typed-fallback") {
      return typedList();
    }

    try {
      const rows = await listPublishedResourceListingRows(type);
      return rows.map(
        (row) => mapResourceListingRow(type, row) as T,
      );
    } catch (error) {
      console.error(`[phase3-public] loadResourceList(${type}) failed`, error);
      return [];
    }
  } catch (error) {
    if (error instanceof CmsDatabaseUnavailableError) {
      console.error("[phase3-public] resource runtime unavailable", error);
      return [];
    }
    throw error;
  }
}

export async function loadPublishedResourceCards(): Promise<PublicResourceCard[]> {
  try {
    const runtime = await resolveCmsContentRuntime();
    if (runtime === "typed-fallback") {
      return [
        ...getPublishedGuides().map((item) => ({
          id: `guide-${item.slug}`,
          type: "guide" as const,
          slug: item.slug,
          title: item.title,
          description: item.description,
          deck: item.deck ?? null,
          href: `/guides/${item.slug}`,
          featured: Boolean(item.featured),
          featuredOnResources: Boolean(item.featured),
          featuredOrder: 0,
          readingTime: item.readingTime ?? null,
          heroImagePath: item.heroImage ?? null,
          heroImageAlt: item.heroImageAlt ?? null,
          publishedAt: item.publishedAt ?? null,
          acronym: null,
          shortDefinition: null,
        })),
        ...getPublishedComparisons().map((item) => ({
          id: `comparison-${item.slug}`,
          type: "comparison" as const,
          slug: item.slug,
          title: item.title,
          description: item.description,
          deck: item.deck ?? null,
          href: `/compare/${item.slug}`,
          featured: Boolean(item.featured),
          featuredOnResources: Boolean(item.featured),
          featuredOrder: 0,
          readingTime: item.readingTime ?? null,
          heroImagePath: null,
          heroImageAlt: null,
          publishedAt: item.publishedAt ?? null,
          acronym: null,
          shortDefinition: null,
        })),
        ...getPublishedChecklists().map((item) => ({
          id: `checklist-${item.slug}`,
          type: "checklist" as const,
          slug: item.slug,
          title: item.title,
          description: item.description,
          deck: item.subtitle ?? null,
          href: `/checklists/${item.slug}`,
          featured: Boolean(item.featured),
          featuredOnResources: Boolean(item.featured),
          featuredOrder: 0,
          readingTime: null,
          heroImagePath: null,
          heroImageAlt: null,
          publishedAt: item.publishedAt ?? null,
          acronym: null,
          shortDefinition: null,
        })),
        ...getPublishedGlossaryEntries().map((item) => ({
          id: `glossary-${item.slug}`,
          type: "glossary" as const,
          slug: item.slug,
          title: item.term,
          description: item.shortDefinition,
          deck: null,
          href: `/glossary/${item.slug}`,
          featured: Boolean(item.featured),
          featuredOnResources: Boolean(item.featured),
          featuredOrder: 0,
          readingTime: null,
          heroImagePath: null,
          heroImageAlt: null,
          publishedAt: item.publishedAt ?? null,
          acronym: item.acronym ?? null,
          shortDefinition: item.shortDefinition,
        })),
        ...getPublishedTemplates().map((item) => ({
          id: `template-${item.slug}`,
          type: "template" as const,
          slug: item.slug,
          title: item.title,
          description: item.description,
          deck: null,
          href: `/templates/${item.slug}`,
          featured: Boolean(item.featured),
          featuredOnResources: Boolean(item.featured),
          featuredOrder: 0,
          readingTime: null,
          heroImagePath: null,
          heroImageAlt: null,
          publishedAt: item.publishedAt ?? null,
          acronym: null,
          shortDefinition: null,
        })),
        ...getPublishedTools().map((item) => ({
          id: `tool-${item.slug}`,
          type: "tool" as const,
          slug: item.slug,
          title: item.title,
          description: item.description,
          deck: null,
          href: `/tools/${item.slug}`,
          featured: Boolean(item.featured),
          featuredOnResources: Boolean(item.featured),
          featuredOrder: 0,
          readingTime: null,
          heroImagePath: null,
          heroImageAlt: null,
          publishedAt: item.publishedAt ?? null,
          acronym: null,
          shortDefinition: null,
        })),
      ];
    }

    try {
      const rows = await listAllPublishedResourceListingRows();
      return rows.map(toPublicResourceCard);
    } catch (error) {
      console.error("[phase3-public] loadPublishedResourceCards failed", error);
      return [];
    }
  } catch (error) {
    if (error instanceof CmsDatabaseUnavailableError) {
      console.error("[phase3-public] resource cards runtime unavailable", error);
      return [];
    }
    throw error;
  }
}

export async function loadResourceDiscoveryCounts(): Promise<ResourceDiscoveryCounts> {
  const cards = await loadPublishedResourceCards();
  return countResourcesByType(cards);
}

export const loadPublishedGuides = () =>
  loadResourceList<GuideContent>("guide", getPublishedGuides);
export const loadGuideBySlug = (slug: string) =>
  loadResourcePayload<GuideContent>("guide", slug, getGuideBySlug);

export const loadPublishedComparisons = () =>
  loadResourceList<ComparisonContent>("comparison", getPublishedComparisons);
export const loadComparisonBySlug = (slug: string) =>
  loadResourcePayload<ComparisonContent>("comparison", slug, getComparisonBySlug);

export const loadPublishedChecklists = () =>
  loadResourceList<ChecklistContent>("checklist", getPublishedChecklists);
export const loadChecklistBySlug = (slug: string) =>
  loadResourcePayload<ChecklistContent>("checklist", slug, getChecklistBySlug);

export const loadPublishedGlossary = () =>
  loadResourceList<GlossaryContent>("glossary", getPublishedGlossaryEntries);
export const loadGlossaryBySlug = (slug: string) =>
  loadResourcePayload<GlossaryContent>("glossary", slug, getGlossaryEntryBySlug);

export const loadPublishedTemplates = () =>
  loadResourceList<TemplateContent>("template", getPublishedTemplates);
export const loadTemplateBySlug = (slug: string) =>
  loadResourcePayload<TemplateContent>("template", slug, getTemplateBySlug);

export const loadPublishedTools = () =>
  loadResourceList<ToolContent>("tool", getPublishedTools);
export const loadToolBySlug = (slug: string) =>
  loadResourcePayload<ToolContent>("tool", slug, getToolBySlug);

export type { InsightPublic };
