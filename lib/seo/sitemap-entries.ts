import type { MetadataRoute } from "next";
import { seoServices } from "@/data/seo";
import { industriesCatalog } from "@/data/industries";
import { hasDatabaseUrl, prisma } from "@/lib/db";
import {
  loadPublishedChecklists,
  loadPublishedComparisons,
  loadPublishedGlossary,
  loadPublishedGuides,
  loadPublishedInsights,
  loadPublishedTemplates,
  loadPublishedTools,
  loadPublishedWork,
} from "@/lib/content/phase3-public";
import { getSiteOrigin } from "@/lib/seo/canonical";
import { KNOWN_MANAGED_PAGES } from "@/lib/repositories/managedPagesRepository";

type SitemapEntry = MetadataRoute.Sitemap[number];

function entry(
  base: string,
  path: string,
  lastModified: Date,
  priority: number,
  changeFrequency: SitemapEntry["changeFrequency"] = "monthly",
): SitemapEntry {
  return {
    url: `${base}${path === "/" ? "" : path}`,
    lastModified,
    changeFrequency,
    priority,
  };
}

export async function buildPublicSitemapEntries(): Promise<SitemapEntry[]> {
  const base = await getSiteOrigin();
  const entries: SitemapEntry[] = [];
  const seen = new Set<string>();

  function add(
    path: string,
    lastModified: Date,
    priority: number,
    changeFrequency?: SitemapEntry["changeFrequency"],
  ) {
    const normalized = path === "" ? "/" : path.startsWith("/") ? path : `/${path}`;
    if (seen.has(normalized)) return;
    seen.add(normalized);
    entries.push(entry(base, normalized, lastModified, priority, changeFrequency));
  }

  const staticRoutes: Array<{ path: string; priority: number }> = [
    { path: "/", priority: 1 },
    { path: "/services", priority: 0.8 },
    { path: "/solutions", priority: 0.8 },
    { path: "/platforms", priority: 0.8 },
    { path: "/seo", priority: 0.8 },
    { path: "/work", priority: 0.8 },
    { path: "/industries", priority: 0.8 },
    { path: "/how-we-work", priority: 0.8 },
    { path: "/ai-automation", priority: 0.85 },
    { path: "/ai-automation/ai-agents", priority: 0.8 },
    { path: "/ai-automation/workflow-automation", priority: 0.8 },
    { path: "/ai-automation/voice-ai", priority: 0.8 },
    { path: "/ai-automation/integrations", priority: 0.8 },
    { path: "/ai-automation/crm-lead-automation", priority: 0.8 },
    { path: "/ai-automation/custom-ai-tools", priority: 0.8 },
    { path: "/free-tools", priority: 0.8 },
    { path: "/about", priority: 0.7 },
    { path: "/blog", priority: 0.8 },
    { path: "/resources", priority: 0.8 },
    { path: "/guides", priority: 0.8 },
    { path: "/compare", priority: 0.8 },
    { path: "/checklists", priority: 0.8 },
    { path: "/glossary", priority: 0.7 },
    { path: "/templates", priority: 0.7 },
    { path: "/tools", priority: 0.7 },
    { path: "/pricing", priority: 0.7 },
    { path: "/project-planner", priority: 0.7 },
    { path: "/contact", priority: 0.8 },
    { path: "/free-website-review", priority: 0.7 },
    { path: "/website-brief", priority: 0.7 },
    { path: "/solutions/respond-to-leads-faster", priority: 0.75 },
    { path: "/solutions/automate-repetitive-work", priority: 0.75 },
    { path: "/solutions/stop-leads-falling-through-the-cracks", priority: 0.75 },
    { path: "/solutions/automate-customer-enquiries", priority: 0.75 },
    { path: "/solutions/connect-business-tools", priority: 0.75 },
    { path: "/solutions/centralize-business-knowledge", priority: 0.75 },
  ];

  const managedNoIndex = new Set<string>();
  if (hasDatabaseUrl()) {
    const managed = await prisma.managedPage.findMany({
      select: { route: true, noIndex: true, status: true, updatedAt: true },
    });
    for (const page of managed) {
      if (page.status !== "PUBLISHED" || page.noIndex) {
        managedNoIndex.add(page.route);
      } else if (!staticRoutes.some((r) => r.path === page.route)) {
        add(page.route, page.updatedAt, 0.5);
      }
    }
  }

  for (const route of staticRoutes) {
    if (managedNoIndex.has(route.path)) continue;
    add(route.path, new Date(), route.priority, "weekly");
  }

  for (const page of KNOWN_MANAGED_PAGES) {
    if (page.route.startsWith("/legal/") && !managedNoIndex.has(page.route)) {
      add(page.route, new Date(), 0.3, "yearly");
    }
  }

  if (hasDatabaseUrl()) {
    const [services, solutions, platforms, industries, insights, resources, workRows] =
      await Promise.all([
        prisma.service.findMany({
          where: { status: "PUBLISHED", noIndex: false },
          select: { href: true, slug: true, updatedAt: true },
        }),
        prisma.solution.findMany({
          where: { status: "PUBLISHED", noIndex: false },
          select: { slug: true, updatedAt: true },
        }),
        prisma.platform.findMany({
          where: { status: "PUBLISHED", noIndex: false },
          select: { href: true, slug: true, updatedAt: true },
        }),
        prisma.industry.findMany({
          where: { status: "PUBLISHED", noIndex: false },
          select: { slug: true, updatedAt: true },
        }),
        prisma.insight.findMany({
          where: { status: "PUBLISHED", noIndex: false },
          select: {
            slug: true,
            canonicalOverride: true,
            materialUpdatedAt: true,
            publishedAt: true,
            originalPublishedAt: true,
          },
        }),
        prisma.cmsResource.findMany({
          where: { status: "PUBLISHED", noIndex: false },
          select: {
            href: true,
            materialUpdatedAt: true,
            publishedAt: true,
            updatedAt: true,
          },
        }),
        prisma.workProject.findMany({
          where: { status: "PUBLISHED", noIndex: false },
          select: { slug: true, updatedAt: true },
        }),
      ]);

    for (const service of services) {
      add(service.href || `/services/${service.slug}`, service.updatedAt, 0.7);
    }
    for (const solution of solutions) {
      add(`/solutions/${solution.slug}`, solution.updatedAt, 0.7);
    }
    for (const platform of platforms) {
      add(platform.href || `/platforms/${platform.slug}`, platform.updatedAt, 0.7);
    }
    for (const industry of industries) {
      add(`/industries/${industry.slug}`, industry.updatedAt, 0.6);
    }
    for (const insight of insights) {
      const lastModified =
        insight.materialUpdatedAt ??
        insight.publishedAt ??
        insight.originalPublishedAt ??
        new Date();
      add(
        insight.canonicalOverride || `/blog/${insight.slug}`,
        lastModified,
        0.6,
      );
    }
    for (const resource of resources) {
      const lastModified =
        resource.materialUpdatedAt ?? resource.publishedAt ?? resource.updatedAt;
      add(resource.href, lastModified, 0.6);
    }
    for (const project of workRows) {
      add(`/work/${project.slug}`, project.updatedAt, 0.6);
    }
  } else {
    const [work, posts, guides, comparisons, checklists, glossary, templates, tools] =
      await Promise.all([
        loadPublishedWork(),
        loadPublishedInsights(),
        loadPublishedGuides(),
        loadPublishedComparisons(),
        loadPublishedChecklists(),
        loadPublishedGlossary(),
        loadPublishedTemplates(),
        loadPublishedTools(),
      ]);

    for (const project of work) {
      if (project.published === false) continue;
      add(`/work/${project.slug}`, new Date(), 0.6);
    }
    for (const post of posts) {
      if (post.published === false) continue;
      add(
        post.canonicalUrl || `/blog/${post.slug}`,
        new Date(post.updatedAt ?? post.publishedAt),
        0.6,
      );
    }
    for (const guide of guides) {
      add(
        `/guides/${guide.slug}`,
        new Date(guide.updatedAt ?? guide.publishedAt),
        0.7,
      );
    }
    for (const comparison of comparisons) {
      add(
        `/compare/${comparison.slug}`,
        new Date(comparison.updatedAt ?? comparison.publishedAt),
        0.7,
      );
    }
    for (const checklist of checklists) {
      add(
        `/checklists/${checklist.slug}`,
        new Date(checklist.updatedAt ?? checklist.publishedAt),
        0.7,
      );
    }
    for (const term of glossary) {
      add(
        `/glossary/${term.slug}`,
        new Date(term.updatedAt ?? term.publishedAt),
        0.6,
      );
    }
    for (const template of templates) {
      add(
        `/templates/${template.slug}`,
        new Date(template.updatedAt ?? template.publishedAt),
        0.6,
      );
    }
    for (const tool of tools) {
      add(
        `/tools/${tool.slug}`,
        new Date(tool.updatedAt ?? tool.publishedAt),
        0.6,
      );
    }
    for (const industry of industriesCatalog) {
      add(`/industries/${industry.slug}`, new Date(), 0.6);
    }
  }

  for (const service of seoServices) {
    add(service.href, new Date(), 0.7);
  }

  return entries;
}
