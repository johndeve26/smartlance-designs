import { hasDatabaseUrl, prisma } from "@/lib/db";

export type SeoIssueSeverity = "error" | "warning" | "info";

export type SeoIssue = {
  code: string;
  severity: SeoIssueSeverity;
  message: string;
  pageKey: string;
};

export type SeoInventoryRow = {
  key: string;
  page: string;
  type: string;
  route: string;
  status: string;
  seoTitle: string | null;
  seoDescription: string | null;
  canonical: string | null;
  indexable: boolean;
  ogImage: string | null;
  inSitemapExpected: boolean;
  lastUpdated: Date | null;
  editHref: string | null;
  issues: SeoIssue[];
};

function titleLenWarning(title: string | null): SeoIssue | null {
  if (!title?.trim()) return null;
  const len = title.trim().length;
  if (len < 30) {
    return {
      code: "title_short",
      severity: "warning",
      message: `SEO title is short (${len} characters). This is guidance, not a hard requirement.`,
      pageKey: "",
    };
  }
  if (len > 65) {
    return {
      code: "title_long",
      severity: "warning",
      message: `SEO title is long (${len} characters). This is guidance, not a hard requirement.`,
      pageKey: "",
    };
  }
  return null;
}

function descLenWarning(desc: string | null): SeoIssue | null {
  if (!desc?.trim()) return null;
  const len = desc.trim().length;
  if (len < 50) {
    return {
      code: "desc_short",
      severity: "warning",
      message: `Meta description is short (${len} characters). Guidance only.`,
      pageKey: "",
    };
  }
  if (len > 165) {
    return {
      code: "desc_long",
      severity: "warning",
      message: `Meta description is long (${len} characters). Guidance only.`,
      pageKey: "",
    };
  }
  return null;
}

function attachIssues(
  row: Omit<SeoInventoryRow, "issues">,
  extra: SeoIssue[],
  defaultOg: string | null,
): SeoInventoryRow {
  const issues: SeoIssue[] = [];
  if (!row.seoTitle?.trim()) {
    issues.push({
      code: "missing_title",
      severity: "error",
      message: "Missing SEO title.",
      pageKey: row.key,
    });
  } else {
    const tw = titleLenWarning(row.seoTitle);
    if (tw) issues.push({ ...tw, pageKey: row.key });
  }
  if (!row.seoDescription?.trim()) {
    issues.push({
      code: "missing_description",
      severity: "error",
      message: "Missing meta description.",
      pageKey: row.key,
    });
  } else {
    const dw = descLenWarning(row.seoDescription);
    if (dw) issues.push({ ...dw, pageKey: row.key });
  }
  if (!row.ogImage && !defaultOg) {
    issues.push({
      code: "missing_og",
      severity: "warning",
      message: "No page OG image and no default OG configured.",
      pageKey: row.key,
    });
  } else if (!row.ogImage && defaultOg) {
    issues.push({
      code: "og_fallback",
      severity: "info",
      message: "Using default OG image fallback.",
      pageKey: row.key,
    });
  }
  if (
    !row.indexable &&
    row.status === "PUBLISHED" &&
    ["service", "solution", "platform", "work", "pricing", "contact"].includes(
      row.type,
    )
  ) {
    issues.push({
      code: "noindex_commercial",
      severity: "warning",
      message: "Published commercial page is set to noindex.",
      pageKey: row.key,
    });
  }
  if (row.canonical && row.canonical !== row.route && !row.canonical.startsWith("http")) {
    issues.push({
      code: "canonical_override",
      severity: "info",
      message: `Canonical override set to ${row.canonical}.`,
      pageKey: row.key,
    });
  }
  if (row.canonical?.startsWith("http") && !row.canonical.includes(row.route)) {
    issues.push({
      code: "canonical_external",
      severity: "warning",
      message: "Canonical points to an external or unrelated URL.",
      pageKey: row.key,
    });
  }
  issues.push(...extra.map((i) => ({ ...i, pageKey: row.key })));
  return { ...row, issues };
}

export async function buildSeoInventory(): Promise<{
  pages: SeoInventoryRow[];
  issues: SeoIssue[];
  summary: { errors: number; warnings: number; infos: number };
}> {
  if (!hasDatabaseUrl()) {
    return { pages: [], issues: [], summary: { errors: 0, warnings: 0, infos: 0 } };
  }

  const settings = await prisma.siteSettings.findUnique({ where: { id: "site" } });
  const defaultOg = settings?.defaultOgImagePath ?? null;
  const pages: SeoInventoryRow[] = [];

  const home = await prisma.homepageContent.findUnique({ where: { id: "home" } });
  if (home) {
    pages.push(
      attachIssues(
        {
          key: "home",
          page: "Homepage",
          type: "homepage",
          route: "/",
          status: "PUBLISHED",
          seoTitle: home.seoTitle || home.metaTitle,
          seoDescription: home.seoDescription || home.metaDescription,
          canonical: home.canonicalOverride || "/",
          indexable: !home.noIndex,
          ogImage: home.ogImagePath,
          inSitemapExpected: !home.noIndex,
          lastUpdated: home.updatedAt,
          editHref: "/admin/homepage",
        },
        [],
        defaultOg,
      ),
    );
  }

  const services = await prisma.service.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      href: true,
      status: true,
      seoTitle: true,
      seoDescription: true,
      ogImagePath: true,
      noIndex: true,
      canonicalOverride: true,
      updatedAt: true,
    },
  });
  for (const s of services) {
    pages.push(
      attachIssues(
        {
          key: `service:${s.slug}`,
          page: s.title,
          type: "service",
          route: s.href || `/services/${s.slug}`,
          status: s.status,
          seoTitle: s.seoTitle,
          seoDescription: s.seoDescription,
          canonical: s.canonicalOverride || s.href || `/services/${s.slug}`,
          indexable: !s.noIndex,
          ogImage: s.ogImagePath,
          inSitemapExpected: s.status === "PUBLISHED" && !s.noIndex,
          lastUpdated: s.updatedAt,
          editHref: `/admin/services/${s.id}`,
        },
        [],
        defaultOg,
      ),
    );
  }

  const solutions = await prisma.solution.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      seoTitle: true,
      seoDescription: true,
      ogImagePath: true,
      noIndex: true,
      canonicalOverride: true,
      updatedAt: true,
    },
  });
  for (const s of solutions) {
    pages.push(
      attachIssues(
        {
          key: `solution:${s.slug}`,
          page: s.title,
          type: "solution",
          route: `/solutions/${s.slug}`,
          status: s.status,
          seoTitle: s.seoTitle,
          seoDescription: s.seoDescription,
          canonical: s.canonicalOverride || `/solutions/${s.slug}`,
          indexable: !s.noIndex,
          ogImage: s.ogImagePath,
          inSitemapExpected: s.status === "PUBLISHED" && !s.noIndex,
          lastUpdated: s.updatedAt,
          editHref: `/admin/solutions/${s.id}`,
        },
        [],
        defaultOg,
      ),
    );
  }

  const platforms = await prisma.platform.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      href: true,
      status: true,
      seoTitle: true,
      seoDescription: true,
      ogImagePath: true,
      noIndex: true,
      canonicalOverride: true,
      updatedAt: true,
    },
  });
  for (const s of platforms) {
    pages.push(
      attachIssues(
        {
          key: `platform:${s.slug}`,
          page: s.title,
          type: "platform",
          route: s.href || `/platforms/${s.slug}`,
          status: s.status,
          seoTitle: s.seoTitle,
          seoDescription: s.seoDescription,
          canonical: s.canonicalOverride || s.href || `/platforms/${s.slug}`,
          indexable: !s.noIndex,
          ogImage: s.ogImagePath,
          inSitemapExpected: s.status === "PUBLISHED" && !s.noIndex,
          lastUpdated: s.updatedAt,
          editHref: `/admin/platforms/${s.id}`,
        },
        [],
        defaultOg,
      ),
    );
  }

  const industries = await prisma.industry.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      seoTitle: true,
      seoDescription: true,
      ogImagePath: true,
      noIndex: true,
      updatedAt: true,
    },
  });
  for (const s of industries) {
    pages.push(
      attachIssues(
        {
          key: `industry:${s.slug}`,
          page: s.name,
          type: "industry",
          route: `/industries/${s.slug}`,
          status: s.status,
          seoTitle: s.seoTitle,
          seoDescription: s.seoDescription,
          canonical: `/industries/${s.slug}`,
          indexable: !s.noIndex,
          ogImage: s.ogImagePath,
          inSitemapExpected: s.status === "PUBLISHED" && !s.noIndex,
          lastUpdated: s.updatedAt,
          editHref: `/admin/industries/${s.id}`,
        },
        [],
        defaultOg,
      ),
    );
  }

  const work = await prisma.workProject.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      seoTitle: true,
      seoDescription: true,
      ogImagePath: true,
      coverImagePath: true,
      noIndex: true,
      canonicalOverride: true,
      updatedAt: true,
    },
  });
  for (const s of work) {
    pages.push(
      attachIssues(
        {
          key: `work:${s.slug}`,
          page: s.name,
          type: "work",
          route: `/work/${s.slug}`,
          status: s.status,
          seoTitle: s.seoTitle,
          seoDescription: s.seoDescription,
          canonical: s.canonicalOverride || `/work/${s.slug}`,
          indexable: !s.noIndex,
          ogImage: s.ogImagePath || s.coverImagePath,
          inSitemapExpected: s.status === "PUBLISHED" && !s.noIndex,
          lastUpdated: s.updatedAt,
          editHref: `/admin/work/${s.id}`,
        },
        [],
        defaultOg,
      ),
    );
  }

  const insights = await prisma.insight.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      seoTitle: true,
      seoDescription: true,
      ogImagePath: true,
      heroImagePath: true,
      noIndex: true,
      canonicalOverride: true,
      updatedAt: true,
    },
  });
  for (const s of insights) {
    pages.push(
      attachIssues(
        {
          key: `insight:${s.slug}`,
          page: s.title,
          type: "insight",
          route: `/blog/${s.slug}`,
          status: s.status,
          seoTitle: s.seoTitle,
          seoDescription: s.seoDescription,
          canonical: s.canonicalOverride || `/blog/${s.slug}`,
          indexable: !s.noIndex,
          ogImage: s.ogImagePath || s.heroImagePath,
          inSitemapExpected: s.status === "PUBLISHED" && !s.noIndex,
          lastUpdated: s.updatedAt,
          editHref: `/admin/insights/${s.id}`,
        },
        [],
        defaultOg,
      ),
    );
  }

  const resources = await prisma.cmsResource.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      type: true,
      href: true,
      status: true,
      seoTitle: true,
      seoDescription: true,
      ogImagePath: true,
      noIndex: true,
      updatedAt: true,
    },
  });
  for (const s of resources) {
    pages.push(
      attachIssues(
        {
          key: `resource:${s.type}:${s.slug}`,
          page: s.title,
          type: s.type.toLowerCase(),
          route: s.href,
          status: s.status,
          seoTitle: s.seoTitle,
          seoDescription: s.seoDescription,
          canonical: s.href,
          indexable: !s.noIndex,
          ogImage: s.ogImagePath,
          inSitemapExpected: s.status === "PUBLISHED" && !s.noIndex,
          lastUpdated: s.updatedAt,
          editHref: `/admin/resources/${s.id}`,
        },
        [],
        defaultOg,
      ),
    );
  }

  const managed = await prisma.managedPage.findMany();
  for (const s of managed) {
    pages.push(
      attachIssues(
        {
          key: `managed:${s.key}`,
          page: s.displayName,
          type: s.key.includes("legal") ? "legal" : s.key,
          route: s.route,
          status: s.status,
          seoTitle: s.seoTitle,
          seoDescription: s.seoDescription,
          canonical: s.canonicalOverride || s.route,
          indexable: !s.noIndex,
          ogImage: s.ogImagePath,
          inSitemapExpected: s.status === "PUBLISHED" && !s.noIndex,
          lastUpdated: s.updatedAt,
          editHref: `/admin/seo?page=${s.key}`,
        },
        [],
        defaultOg,
      ),
    );
  }

  // Duplicate title detection among indexable published pages
  const titleMap = new Map<string, string[]>();
  for (const p of pages) {
    if (p.status !== "PUBLISHED" || !p.indexable || !p.seoTitle?.trim()) continue;
    const t = p.seoTitle.trim().toLowerCase();
    const list = titleMap.get(t) || [];
    list.push(p.key);
    titleMap.set(t, list);
  }
  for (const [, keys] of titleMap) {
    if (keys.length < 2) continue;
    for (const key of keys) {
      const page = pages.find((p) => p.key === key);
      if (!page) continue;
      page.issues.push({
        code: "duplicate_title",
        severity: "warning",
        message: `Duplicate SEO title shared with ${keys.length - 1} other page(s).`,
        pageKey: key,
      });
    }
  }

  const issues = pages.flatMap((p) => p.issues);
  const summary = {
    errors: issues.filter((i) => i.severity === "error").length,
    warnings: issues.filter((i) => i.severity === "warning").length,
    infos: issues.filter((i) => i.severity === "info").length,
  };
  return { pages, issues, summary };
}
