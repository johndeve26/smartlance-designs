/**
 * Phase 3 public content loaders — DB first, typed/markdown fallback when empty.
 * Avoids per-request COUNT: list queries returning [] trigger fallback.
 */
import { hasDatabaseUrl } from "@/lib/db";
import {
  listPublishedInsights,
  getPublishedInsightBySlug,
  countPublishedInsights,
  type InsightPublic,
} from "@/lib/repositories/insightsRepository";
import { listPublishedWork, getPublishedWorkBySlug } from "@/lib/repositories/workRepository";
import {
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
  listPublishedResourcesByType,
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
import { getProjectBySlug as getTypedProject, getVisibleProjects } from "@/data/portfolio";
import { industriesCatalog } from "@/data/industries";
import { getPublishedTestimonials as getTypedTestimonials, getTestimonialById } from "@/data/testimonials";
import { getPublishedGuides, getGuideBySlug } from "@/data/guides";
import { getPublishedComparisons, getComparisonBySlug } from "@/data/comparisons";
import { getPublishedChecklists, getChecklistBySlug } from "@/data/checklists";
import { getPublishedGlossaryEntries, getGlossaryEntryBySlug } from "@/data/glossary";
import { getPublishedTemplates, getTemplateBySlug } from "@/data/templates";
import { getPublishedTools, getToolBySlug } from "@/data/tools";
import type { BlogPost } from "@/lib/blog";
import type { Project } from "@/types";

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
  if (!hasDatabaseUrl()) return getVisibleProjects();
  const rows = await listPublishedWork();
  if (!rows.length) return getVisibleProjects();
  const typed = getVisibleProjects();
  const dbSlugs = new Set(rows.map((row) => row.slug));
  const supplemental = typed.filter((project) => !dbSlugs.has(project.slug));
  if (!supplemental.length) return rows;
  return [...supplemental, ...rows].sort((a, b) => {
    const orderA = a.displayOrder ?? (a.featured ? 50 : 100);
    const orderB = b.displayOrder ?? (b.featured ? 50 : 100);
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name);
  });
}

export async function loadWorkBySlug(slug: string): Promise<Project | null> {
  if (!hasDatabaseUrl()) return getTypedProject(slug) ?? null;
  const row = await getPublishedWorkBySlug(slug);
  if (row) return row;
  return getTypedProject(slug) ?? null;
}

export async function loadPublishedIndustries() {
  if (!hasDatabaseUrl()) return industriesCatalog.filter(() => true);
  const rows = await listPublishedIndustries();
  if (!rows.length) return industriesCatalog;
  return rows;
}

export async function loadIndustryBySlug(slug: string) {
  return getPublishedIndustryBySlug(slug);
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
  _typedList: () => T[],
): Promise<T | null> {
  if (!hasDatabaseUrl()) return typedGet(slug) ?? null;
  const row = await getPublishedResourceBySlug(type, slug);
  if (row) return resourcePayload<T>(row);
  const probe = await listPublishedResourcesByType(type);
  if (!probe.length) return typedGet(slug) ?? null;
  return null;
}

async function loadResourceList<T>(
  type: "guide" | "comparison" | "checklist" | "glossary" | "template" | "tool",
  typedList: () => T[],
): Promise<T[]> {
  if (!hasDatabaseUrl()) return typedList();
  const rows = await listPublishedResourcesByType(type);
  if (!rows.length) return typedList();
  return rows.map((row) => resourcePayload<T>(row));
}

export const loadPublishedGuides = () =>
  loadResourceList<GuideContent>("guide", getPublishedGuides);
export const loadGuideBySlug = (slug: string) =>
  loadResourcePayload<GuideContent>("guide", slug, getGuideBySlug, getPublishedGuides);

export const loadPublishedComparisons = () =>
  loadResourceList<ComparisonContent>("comparison", getPublishedComparisons);
export const loadComparisonBySlug = (slug: string) =>
  loadResourcePayload<ComparisonContent>(
    "comparison",
    slug,
    getComparisonBySlug,
    getPublishedComparisons,
  );

export const loadPublishedChecklists = () =>
  loadResourceList<ChecklistContent>("checklist", getPublishedChecklists);
export const loadChecklistBySlug = (slug: string) =>
  loadResourcePayload<ChecklistContent>(
    "checklist",
    slug,
    getChecklistBySlug,
    getPublishedChecklists,
  );

export const loadPublishedGlossary = () =>
  loadResourceList<GlossaryContent>("glossary", getPublishedGlossaryEntries);
export const loadGlossaryBySlug = (slug: string) =>
  loadResourcePayload<GlossaryContent>(
    "glossary",
    slug,
    getGlossaryEntryBySlug,
    getPublishedGlossaryEntries,
  );

export const loadPublishedTemplates = () =>
  loadResourceList<TemplateContent>("template", getPublishedTemplates);
export const loadTemplateBySlug = (slug: string) =>
  loadResourcePayload<TemplateContent>(
    "template",
    slug,
    getTemplateBySlug,
    getPublishedTemplates,
  );

export const loadPublishedTools = () =>
  loadResourceList<ToolContent>("tool", getPublishedTools);
export const loadToolBySlug = (slug: string) =>
  loadResourcePayload<ToolContent>("tool", slug, getToolBySlug, getPublishedTools);

export type { InsightPublic };
