import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export const CACHE_TAGS = {
  homepage: "homepage",
  sitemap: "sitemap",
  servicesHub: "services-hub",
  solutionsHub: "solutions-hub",
  platformsHub: "platforms-hub",
  service: (slug: string) => `service:${slug}`,
  solution: (slug: string) => `solution:${slug}`,
  platform: (slug: string) => `platform:${slug}`,
  services: "service",
  solutions: "solution",
  platforms: "platform",
  industries: "industries",
  work: "work",
  workItem: (slug: string) => `work:${slug}`,
  workHub: "work-hub",
  testimonials: "testimonials",
  insights: "insight",
  insight: (slug: string) => `insight:${slug}`,
  blogHub: "blog-hub",
  resources: "resources",
  resource: (type: string, slug: string) => `resource:${type}:${slug}`,
  resourcesHub: "resources-hub",
  navigation: "navigation",
  siteSettings: "site-settings",
  redirects: "redirects",
  media: (id: string) => `media:${id}`,
  seo: (page: string) => `seo:${page}`,
  managedPage: (key: string) => `managed-page:${key}`,
  cmsRuntime: "cms-runtime",
} as const;

export async function createContentRevision(input: {
  entityType: string;
  entityId: string;
  snapshot: Prisma.InputJsonValue;
  createdById?: string | null;
}) {
  const latest = await prisma.contentRevision.findFirst({
    where: {
      entityType: input.entityType,
      entityId: input.entityId,
    },
    orderBy: { revision: "desc" },
    select: { revision: true },
  });
  const revision = (latest?.revision ?? 0) + 1;
  return prisma.contentRevision.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      revision,
      snapshot: input.snapshot,
      createdById: input.createdById ?? null,
    },
  });
}

export function revalidateService(slug: string, href?: string) {
  revalidateTag(CACHE_TAGS.service(slug), "max");
  revalidateTag(CACHE_TAGS.services, "max");
  revalidateTag(CACHE_TAGS.servicesHub, "max");
  revalidateTag(CACHE_TAGS.sitemap, "max");
  revalidatePath("/services");
  revalidatePath(href ?? `/services/${slug}`);
  revalidatePath("/sitemap.xml");
}

export function revalidateSolution(slug: string) {
  revalidateTag(CACHE_TAGS.solution(slug), "max");
  revalidateTag(CACHE_TAGS.solutions, "max");
  revalidateTag(CACHE_TAGS.solutionsHub, "max");
  revalidateTag(CACHE_TAGS.sitemap, "max");
  revalidatePath("/solutions");
  revalidatePath(`/solutions/${slug}`);
  revalidatePath("/sitemap.xml");
}

export function revalidatePlatform(slug: string, href?: string) {
  revalidateTag(CACHE_TAGS.platform(slug), "max");
  revalidateTag(CACHE_TAGS.platforms, "max");
  revalidateTag(CACHE_TAGS.platformsHub, "max");
  revalidateTag(CACHE_TAGS.sitemap, "max");
  revalidatePath("/platforms");
  revalidatePath(href ?? `/platforms/${slug}`);
  revalidatePath("/sitemap.xml");
}

export function revalidateHomepage() {
  revalidateTag(CACHE_TAGS.homepage, "max");
  revalidatePath("/");
}

export function revalidateIndustries(slug?: string) {
  revalidateTag(CACHE_TAGS.industries, "max");
  revalidateTag(CACHE_TAGS.sitemap, "max");
  revalidatePath("/industries");
  revalidatePath("/sitemap.xml");
  if (slug) {
    revalidatePath(`/industries/${slug}`);
  }
}

export function revalidateWork(slug?: string) {
  revalidateTag(CACHE_TAGS.work, "max");
  revalidateTag(CACHE_TAGS.workHub, "max");
  revalidateTag(CACHE_TAGS.sitemap, "max");
  revalidatePath("/work");
  if (slug) {
    revalidateTag(CACHE_TAGS.workItem(slug), "max");
    revalidatePath(`/work/${slug}`);
  }
  revalidatePath("/sitemap.xml");
  revalidateHomepage();
  revalidateIndustries();
}

export function revalidateTestimonials() {
  revalidateTag(CACHE_TAGS.testimonials, "max");
  revalidateHomepage();
}

export function revalidateInsight(slug: string) {
  revalidateTag(CACHE_TAGS.insight(slug), "max");
  revalidateTag(CACHE_TAGS.insights, "max");
  revalidateTag(CACHE_TAGS.blogHub, "max");
  revalidateTag(CACHE_TAGS.resourcesHub, "max");
  revalidateTag(CACHE_TAGS.sitemap, "max");
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/resources");
  revalidatePath("/sitemap.xml");
  revalidateHomepage();
}

export function revalidateCmsResource(
  type: string,
  slug: string,
  href: string,
) {
  revalidateTag(CACHE_TAGS.resource(type, slug), "max");
  revalidateTag(CACHE_TAGS.resources, "max");
  revalidateTag(CACHE_TAGS.resourcesHub, "max");
  revalidateTag(CACHE_TAGS.sitemap, "max");
  revalidatePath("/resources");
  revalidatePath(href);
  const archives: Record<string, string> = {
    guide: "/guides",
    comparison: "/compare",
    checklist: "/checklists",
    glossary: "/glossary",
    template: "/templates",
    tool: "/tools",
  };
  if (archives[type]) revalidatePath(archives[type]);
  revalidatePath("/sitemap.xml");
}

export function revalidateNavigation() {
  revalidateTag(CACHE_TAGS.navigation, "max");
  revalidatePath("/", "layout");
}

export function revalidateSiteSettings() {
  revalidateTag(CACHE_TAGS.siteSettings, "max");
  revalidatePath("/", "layout");
  revalidatePath("/contact");
  revalidatePath("/free-website-review");
  revalidatePath("/pricing");
  revalidatePath("/sitemap.xml");
}

export function revalidateRedirects() {
  revalidateTag(CACHE_TAGS.redirects, "max");
}

const MANAGED_PAGE_ROUTES: Record<string, string> = {
  about: "/about",
  contact: "/contact",
  pricing: "/pricing",
  "project-planner": "/project-planner",
  "free-website-review": "/free-website-review",
  resources: "/resources",
  "legal-terms": "/legal/terms-and-condition",
  "legal-privacy": "/legal/privacy-statement",
  "legal-accessibility": "/legal/accessibility-statement",
};

export function revalidateManagedPage(key: string) {
  revalidateTag(CACHE_TAGS.managedPage(key), "max");
  revalidateTag(CACHE_TAGS.sitemap, "max");
  const route = MANAGED_PAGE_ROUTES[key];
  if (route) revalidatePath(route);
  revalidatePath("/sitemap.xml");
}
