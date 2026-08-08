/** Canonical public route helpers for CMS content families. */

export const contentRoutes = {
  service: (slug: string) => `/services/${slug}`,
  solution: (slug: string) => `/solutions/${slug}`,
  platform: (slug: string) => `/platforms/${slug}`,
  work: (slug: string) => `/work/${slug}`,
  workArchive: "/work",
  industries: "/industries",
  blog: (slug: string) => `/blog/${slug}`,
  blogArchive: "/blog",
  guide: (slug: string) => `/guides/${slug}`,
  guidesArchive: "/guides",
  comparison: (slug: string) => `/compare/${slug}`,
  comparisonsArchive: "/compare",
  checklist: (slug: string) => `/checklists/${slug}`,
  checklistsArchive: "/checklists",
  glossary: (slug: string) => `/glossary/${slug}`,
  glossaryArchive: "/glossary",
  template: (slug: string) => `/templates/${slug}`,
  templatesArchive: "/templates",
  tool: (slug: string) => `/tools/${slug}`,
  toolsArchive: "/tools",
  resources: "/resources",
  admin: {
    industry: (id: string) => `/admin/industries/${id}`,
    work: (id: string) => `/admin/work/${id}`,
    testimonial: (id: string) => `/admin/testimonials/${id}`,
    insight: (id: string) => `/admin/insights/${id}`,
    resource: (type: string, id: string) => `/admin/resources/${type}/${id}`,
    preview: (entity: string, id: string) => `/admin/preview/${entity}/${id}`,
  },
} as const;

export function resourceHref(
  type: "guide" | "comparison" | "checklist" | "glossary" | "template" | "tool",
  slug: string,
): string {
  switch (type) {
    case "guide":
      return contentRoutes.guide(slug);
    case "comparison":
      return contentRoutes.comparison(slug);
    case "checklist":
      return contentRoutes.checklist(slug);
    case "glossary":
      return contentRoutes.glossary(slug);
    case "template":
      return contentRoutes.template(slug);
    case "tool":
      return contentRoutes.tool(slug);
  }
}
