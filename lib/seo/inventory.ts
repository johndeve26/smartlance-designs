/**
 * SEO URL inventory for baseline audits and admin operations.
 */
import { seoServices } from "@/data/seo";
import { buildSeoInventory } from "@/lib/ops/seo-health";
import { KNOWN_MANAGED_PAGES } from "@/lib/repositories/managedPagesRepository";

export type UrlClassification =
  | "INDEX"
  | "NOINDEX"
  | "REDIRECT"
  | "404"
  | "ARCHIVED"
  | "DUPLICATE_CANONICAL"
  | "MISSING_ROUTE";

export type SeoUrlInventoryRow = {
  url: string;
  path: string;
  family: string;
  classification: UrlClassification;
  inSitemapExpected: boolean;
  canonical: string | null;
  title: string | null;
  description: string | null;
  notes: string[];
};

export async function buildSeoUrlInventory(): Promise<{
  rows: SeoUrlInventoryRow[];
  summary: Record<UrlClassification, number>;
}> {
  const rows: SeoUrlInventoryRow[] = [];
  const inventory = await buildSeoInventory();

  for (const page of inventory.pages) {
    const classification: UrlClassification =
      page.status === "ARCHIVED"
        ? "ARCHIVED"
        : !page.indexable
          ? "NOINDEX"
          : page.status === "PUBLISHED"
            ? "INDEX"
            : "NOINDEX";

    rows.push({
      url: page.route,
      path: page.route,
      family: page.type,
      classification,
      inSitemapExpected: page.inSitemapExpected,
      canonical: page.canonical,
      title: page.seoTitle,
      description: page.seoDescription,
      notes: page.issues.map((i) => `${i.severity}:${i.code}`),
    });
  }

  for (const href of seoServices.map((s) => s.href)) {
    if (rows.some((r) => r.path === href)) continue;
    rows.push({
      url: href,
      path: href,
      family: "seo-topic",
      classification: "INDEX",
      inSitemapExpected: true,
      canonical: href,
      title: null,
      description: null,
      notes: ["static-seo-topic"],
    });
  }

  for (const page of KNOWN_MANAGED_PAGES) {
    if (rows.some((r) => r.path === page.route)) continue;
    rows.push({
      url: page.route,
      path: page.route,
      family: page.key.includes("legal") ? "legal" : page.key,
      classification: "INDEX",
      inSitemapExpected: true,
      canonical: page.route,
      title: page.seoTitle ?? null,
      description: page.seoDescription ?? null,
      notes: ["known-managed-page"],
    });
  }

  const summary = rows.reduce(
    (acc, row) => {
      acc[row.classification] = (acc[row.classification] ?? 0) + 1;
      return acc;
    },
    {} as Record<UrlClassification, number>,
  );

  return { rows, summary };
}

export async function buildSitemapPathSet(): Promise<Set<string>> {
  const { buildPublicSitemapEntries } = await import("@/lib/seo/sitemap-entries");
  const entries = await buildPublicSitemapEntries();
  const paths = new Set<string>();
  for (const entry of entries) {
    try {
      const url = new URL(entry.url);
      paths.add(url.pathname || "/");
    } catch {
      paths.add(entry.url);
    }
  }
  return paths;
}

export async function compareInventoryToSitemap(): Promise<
  Array<{ path: string; issue: string }>
> {
  const { rows } = await buildSeoUrlInventory();
  const sitemapPaths = await buildSitemapPathSet();
  const mismatches: Array<{ path: string; issue: string }> = [];

  for (const row of rows) {
    if (row.classification !== "INDEX") {
      if (sitemapPaths.has(row.path)) {
        mismatches.push({
          path: row.path,
          issue: "Listed in sitemap but classified as non-indexable",
        });
      }
      continue;
    }
    if (row.inSitemapExpected && !sitemapPaths.has(row.path)) {
      mismatches.push({
        path: row.path,
        issue: "Expected in sitemap but missing",
      });
    }
  }

  return mismatches;
}
