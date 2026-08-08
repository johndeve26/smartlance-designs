import { prisma, hasDatabaseUrl } from "@/lib/db";

export type KnowledgeFactKind =
  | "VERIFIED_SITE_FACT"
  | "EDITORIAL_CONTENT"
  | "PROJECT_PROOF"
  | "TESTIMONIAL"
  | "GENERAL_WEB_RESEARCH";

export type KnowledgeItem = {
  kind: KnowledgeFactKind;
  entityType: string;
  id: string;
  title: string;
  path: string;
  summary: string;
  published: boolean;
};

/**
 * Retrieves relevant Smartlance site context for editorial prompts.
 * Never includes Enquiries, private notes, Admin passwords, or testimonial internal notes.
 */
export class EditorialKnowledgeService {
  async searchSiteKnowledge(query: string, limit = 12): Promise<KnowledgeItem[]> {
    if (!hasDatabaseUrl()) return [];
    const q = query.trim();
    const tokens = q
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 2)
      .slice(0, 6);

    const routes = await this.listPublishedInternalRoutes();
    const items: KnowledgeItem[] = routes.map((r) => ({
      kind: kindForEntity(r.entityType),
      entityType: r.entityType,
      id: r.id,
      title: r.title,
      path: r.path,
      summary: r.summary,
      published: true,
    }));

    const settings = await prisma.siteSettings.findFirst({
      select: {
        siteName: true,
        businessName: true,
        defaultSiteDescription: true,
        contactEmail: true,
        publisherName: true,
      },
    });
    if (settings) {
      items.unshift({
        kind: "VERIFIED_SITE_FACT",
        entityType: "SiteSettings",
        id: "site",
        title: settings.siteName || settings.businessName || "Smartlance Designs",
        path: "/",
        summary: [
          settings.defaultSiteDescription,
          settings.contactEmail,
          settings.publisherName,
        ]
          .filter(Boolean)
          .join(" · "),
        published: true,
      });
    }

    const testimonials = await prisma.testimonial.findMany({
      where: { status: "PUBLISHED", verified: true },
      select: {
        id: true,
        quote: true,
        name: true,
        role: true,
        company: true,
      },
      take: 20,
    });
    for (const t of testimonials) {
      items.push({
        kind: "TESTIMONIAL",
        entityType: "Testimonial",
        id: t.id,
        title: [t.name, t.company].filter(Boolean).join(" · "),
        path: "/#testimonials",
        summary: t.quote.slice(0, 280),
        published: true,
      });
    }

    if (!q) return items.slice(0, limit);

    const scored = items
      .map((item) => ({
        item,
        score: scoreItem(item, tokens, q.toLowerCase()),
      }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);

    // Cap by family to avoid flooding prompts with unrelated context
    const caps: Record<string, number> = {
      Insight: 5,
      Service: 3,
      Solution: 3,
      Platform: 2,
      Industry: 2,
      WorkProject: 3,
      CmsResource: 4,
      Glossary: 3,
      Testimonial: 2,
      SiteSettings: 1,
    };
    const perFamily: Record<string, number> = {};
    const limited: typeof scored = [];
    for (const row of scored) {
      const fam = row.item.entityType;
      perFamily[fam] = (perFamily[fam] || 0) + 1;
      if ((perFamily[fam] || 0) > (caps[fam] ?? 3)) continue;
      limited.push(row);
      if (limited.length >= limit) break;
    }

    return limited.length
      ? limited.map((x) => x.item)
      : items.slice(0, Math.min(limit, 8));
  }

  formatForPrompt(items: KnowledgeItem[]): string {
    if (!items.length) return "No matching verified site knowledge found.";
    return items
      .map(
        (i) =>
          `[${i.kind}] ${i.entityType} id=${i.id} path=${i.path}\nTitle: ${i.title}\nSummary: ${i.summary}`,
      )
      .join("\n\n");
  }

  async listPublishedInternalRoutes(): Promise<
    Array<{
      path: string;
      title: string;
      entityType: string;
      id: string;
      summary: string;
    }>
  > {
    if (!hasDatabaseUrl()) return [];
    const [insights, services, solutions, platforms, industries, work, resources] =
      await Promise.all([
        prisma.insight.findMany({
          where: { status: "PUBLISHED" },
          select: { id: true, slug: true, title: true, description: true },
        }),
        prisma.service.findMany({
          where: { status: "PUBLISHED" },
          select: { id: true, href: true, title: true, summary: true },
        }),
        prisma.solution.findMany({
          where: { status: "PUBLISHED" },
          select: {
            id: true,
            slug: true,
            title: true,
            shortDescription: true,
          },
        }),
        prisma.platform.findMany({
          where: { status: "PUBLISHED" },
          select: { id: true, slug: true, title: true, summary: true, href: true },
        }),
        prisma.industry.findMany({
          where: { status: "PUBLISHED" },
          select: { id: true, slug: true, name: true, description: true },
        }),
        prisma.workProject.findMany({
          where: { status: "PUBLISHED" },
          select: {
            id: true,
            slug: true,
            name: true,
            title: true,
            clientName: true,
            shortDescription: true,
            resultSummary: true,
          },
        }),
        prisma.cmsResource.findMany({
          where: { status: "PUBLISHED" },
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            type: true,
            href: true,
          },
        }),
      ]);

    return [
      ...insights.map((i) => ({
        path: `/insights/${i.slug}`,
        title: i.title,
        entityType: "Insight",
        id: i.id,
        summary: i.description,
      })),
      ...services.map((s) => ({
        path: s.href.startsWith("/") ? s.href : `/${s.href}`,
        title: s.title,
        entityType: "Service",
        id: s.id,
        summary: s.summary,
      })),
      ...solutions.map((s) => ({
        path: `/solutions/${s.slug}`,
        title: s.title,
        entityType: "Solution",
        id: s.id,
        summary: s.shortDescription,
      })),
      ...platforms.map((p) => ({
        path: p.href.startsWith("/") ? p.href : `/platforms/${p.slug}`,
        title: p.title,
        entityType: "Platform",
        id: p.id,
        summary: p.summary,
      })),
      ...industries.map((i) => ({
        path: `/industries/${i.slug}`,
        title: i.name,
        entityType: "Industry",
        id: i.id,
        summary: i.description.slice(0, 400),
      })),
      ...work.map((w) => ({
        path: `/work/${w.slug}`,
        title: w.title || w.name,
        entityType: "WorkProject",
        id: w.id,
        summary: [
          w.clientName,
          w.shortDescription || w.resultSummary || "",
        ]
          .filter(Boolean)
          .join(" — ")
          .slice(0, 500),
      })),
      ...resources.map((r) => ({
        path: r.href.startsWith("/") ? r.href : resourcePath(r.type, r.slug),
        title: r.title,
        entityType: "CmsResource",
        id: r.id,
        summary: r.description.slice(0, 400),
      })),
    ];
  }
}

function kindForEntity(entityType: string): KnowledgeFactKind {
  if (entityType === "WorkProject") return "PROJECT_PROOF";
  if (entityType === "Insight" || entityType === "CmsResource") {
    return "EDITORIAL_CONTENT";
  }
  return "VERIFIED_SITE_FACT";
}

function resourcePath(type: string, slug: string): string {
  const map: Record<string, string> = {
    guide: `/resources/guides/${slug}`,
    comparison: `/resources/comparisons/${slug}`,
    checklist: `/resources/checklists/${slug}`,
    template: `/resources/templates/${slug}`,
    tool: `/resources/tools/${slug}`,
    glossary: `/resources/glossary/${slug}`,
  };
  return map[type] || `/resources/${slug}`;
}

function scoreItem(item: KnowledgeItem, tokens: string[], q: string): number {
  const hay = `${item.title} ${item.summary} ${item.path}`.toLowerCase();
  let score = 0;
  if (q && hay.includes(q)) score += 10;
  for (const t of tokens) {
    if (hay.includes(t)) score += 2;
  }
  if (item.kind === "VERIFIED_SITE_FACT") score += 1;
  return score;
}

export const editorialKnowledge = new EditorialKnowledgeService();
