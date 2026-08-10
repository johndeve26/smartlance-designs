#!/usr/bin/env npx tsx
/**
 * Read-only SEO indexability acceptance verification (local or production).
 *
 * Usage:
 *   npx tsx scripts/run-seo-production-verification.ts
 *   SITE_URL=https://smartlancedesigns.com npx tsx scripts/run-seo-production-verification.ts
 */
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import {
  AI_AUTOMATION_HUB,
  aiAutomationSlugs,
  legacyAiServiceRedirects,
} from "../lib/public/ai-automation-routes";
import { operationsSolutionSlugs } from "../lib/public/operations-solutions-content";

const base = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
const canonicalOrigin = (
  process.env.CANONICAL_ORIGIN ||
  (base.includes("localhost") ? "https://smartlancedesigns.com" : base)
).replace(/\/$/, "");
const CONCURRENCY = 4;
const SITEMAP_SAMPLE_SIZE = 50;

const priorityPaths = [
  "/",
  "/services",
  "/services/website-redesign",
  "/solutions",
  "/solutions/website-not-generating-leads",
  "/platforms",
  "/platforms/wordpress",
  "/industries",
  "/industries/short-term-rentals",
  "/industries/professional-services",
  "/work",
  "/work/the-coast",
  "/work?capability=websites",
  "/work?capability=ai",
  "/work?capability=automation",
  "/work?capability=random",
  "/blog",
  "/blog/technical-seo-foundations",
  "/guides/website-redesign-guide",
  "/compare/wordpress-vs-webflow",
  "/checklists/website-redesign-checklist",
  "/glossary/cta",
  "/templates/website-project-brief-template",
  "/tools/website-platform-selector",
  "/how-we-work",
  "/pricing",
  "/about",
  "/free-tools",
  "/free-website-review",
  "/website-brief",
  "/project-planner",
  AI_AUTOMATION_HUB,
  ...aiAutomationSlugs.map((slug) => `/ai-automation/${slug}`),
  ...operationsSolutionSlugs.map((slug) => `/solutions/${slug}`),
  "/ai-automation/not-real",
  "/solutions/not-real",
  "/robots.txt",
  "/sitemap.xml",
];

const redirectChecks = Object.entries(legacyAiServiceRedirects).map(
  ([from, to]) => ({ from, expectedTo: to }),
);

type PageCheckResult = {
  path: string;
  status: number;
  ok: boolean;
  title: string | null;
  description: string | null;
  canonical: string | null;
  robots: string | null;
  xRobotsTag: string | null;
  h1: string | null;
  ogTitle: string | null;
  ogImage: string | null;
  hasBreadcrumb: boolean;
  hasJsonLd: boolean;
  expectedCanonical?: string;
  canonicalMatch?: boolean;
  noindexDetected?: boolean;
  error?: string;
};

type RedirectCheckResult = {
  from: string;
  expectedTo: string;
  status: number;
  location: string | null;
  ok: boolean;
  singleHop: boolean;
  error?: string;
};

type SitemapAudit = {
  validXml: boolean;
  urlCount: number;
  includesAiHub: boolean;
  includesAllAiChildren: boolean;
  includesAllOpsSolutions: boolean;
  excludesLegacyAiServices: boolean;
  missingPriorityUrls: string[];
  sample404s: string[];
};

function extractMeta(html: string, name: string, attr: "name" | "property" = "name") {
  const re = new RegExp(
    `<meta[^>]+${attr}=["']${name}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const match = html.match(re);
  if (match) return match[1];
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${name}["']`,
    "i",
  );
  return html.match(re2)?.[1] ?? null;
}

function extractTitle(html: string) {
  return html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? null;
}

function extractCanonical(html: string) {
  return (
    html.match(
      /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,
    )?.[1] ??
    html.match(
      /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i,
    )?.[1] ??
    null
  );
}

function extractRobots(html: string) {
  return extractMeta(html, "robots");
}

function extractH1(html: string) {
  return html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "").trim() ?? null;
}

function hasNoindex(robots: string | null, xRobotsTag: string | null): boolean {
  const combined = `${robots ?? ""} ${xRobotsTag ?? ""}`.toLowerCase();
  return combined.includes("noindex");
}

function expectedCanonicalForPath(route: string): string | undefined {
  if (route === "/robots.txt" || route === "/sitemap.xml") return undefined;
  if (route.startsWith("/work?")) return `${canonicalOrigin}/work`;
  if (route === "/ai-automation/not-real" || route === "/solutions/not-real") {
    return undefined;
  }
  const [pathname] = route.split("?");
  return `${canonicalOrigin}${pathname}`;
}

async function checkPath(route: string): Promise<PageCheckResult> {
  const url = `${base}${route}`;
  const expectedCanonical = expectedCanonicalForPath(route);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": "SmartlanceSeoIndexabilityAcceptance/1.0" },
    });
    const html = await response.text();
    const canonical = extractCanonical(html);
    const robots = extractRobots(html);
    const xRobotsTag = response.headers.get("x-robots-tag");
    const isInvalidSlug =
      route === "/ai-automation/not-real" || route === "/solutions/not-real";
    const ok = isInvalidSlug
      ? response.status === 404
      : response.status >= 200 && response.status < 400;

    return {
      path: route,
      status: response.status,
      ok,
      title: extractTitle(html),
      description: extractMeta(html, "description"),
      canonical,
      robots,
      xRobotsTag,
      h1: extractH1(html),
      ogTitle: extractMeta(html, "og:title", "property"),
      ogImage: extractMeta(html, "og:image", "property"),
      hasBreadcrumb: /BreadcrumbList|"@type":"BreadcrumbList"/.test(html),
      hasJsonLd: /application\/ld\+json/.test(html),
      expectedCanonical,
      canonicalMatch: expectedCanonical
        ? canonical?.replace(/\/$/, "") === expectedCanonical.replace(/\/$/, "")
        : undefined,
      noindexDetected:
        !isInvalidSlug &&
        route !== "/robots.txt" &&
        route !== "/sitemap.xml" &&
        hasNoindex(robots, xRobotsTag),
    };
  } catch (error) {
    return {
      path: route,
      status: 0,
      ok: false,
      title: null,
      description: null,
      canonical: null,
      robots: null,
      xRobotsTag: null,
      h1: null,
      ogTitle: null,
      ogImage: null,
      hasBreadcrumb: false,
      hasJsonLd: false,
      expectedCanonical,
      error: error instanceof Error ? error.message : "fetch failed",
    };
  }
}

async function checkRedirect(from: string, expectedTo: string): Promise<RedirectCheckResult> {
  const url = `${base}${from}`;
  try {
    const response = await fetch(url, {
      redirect: "manual",
      headers: { "User-Agent": "SmartlanceSeoIndexabilityAcceptance/1.0" },
    });
    const location = response.headers.get("location");
    const normalizedLocation = location
      ? new URL(location, base).pathname.replace(/\/$/, "") || "/"
      : null;
    const normalizedExpected = expectedTo.replace(/\/$/, "") || "/";
    const ok =
      (response.status === 308 || response.status === 301) &&
      normalizedLocation === normalizedExpected;

    return {
      from,
      expectedTo,
      status: response.status,
      location: normalizedLocation,
      ok,
      singleHop: response.status === 308 || response.status === 301,
    };
  } catch (error) {
    return {
      from,
      expectedTo,
      status: 0,
      location: null,
      ok: false,
      singleHop: false,
      error: error instanceof Error ? error.message : "fetch failed",
    };
  }
}

async function mapPool<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency: number,
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const current = index++;
      results[current] = await fn(items[current]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

async function auditSitemap(priorityUrls: string[]): Promise<SitemapAudit> {
  const audit: SitemapAudit = {
    validXml: false,
    urlCount: 0,
    includesAiHub: false,
    includesAllAiChildren: false,
    includesAllOpsSolutions: false,
    excludesLegacyAiServices: true,
    missingPriorityUrls: [],
    sample404s: [],
  };

  try {
    const response = await fetch(`${base}/sitemap.xml`, {
      headers: { "User-Agent": "SmartlanceSeoIndexabilityAcceptance/1.0" },
    });
    const xml = await response.text();
    audit.validXml = response.ok && xml.includes("<urlset") && xml.includes("<loc>");
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    audit.urlCount = locs.length;

    const normalized = locs.map((u) => u.replace(/\/$/, ""));
    audit.includesAiHub = normalized.some((u) => u.endsWith("/ai-automation"));
    audit.includesAllAiChildren = aiAutomationSlugs.every((slug) =>
      normalized.some((u) => u.endsWith(`/ai-automation/${slug}`)),
    );
    audit.includesAllOpsSolutions = operationsSolutionSlugs.every((slug) =>
      normalized.some((u) => u.endsWith(`/solutions/${slug}`)),
    );
    audit.excludesLegacyAiServices = !normalized.some((u) =>
      /\/services\/ai-/.test(u),
    );

    for (const priority of priorityUrls) {
      if (priority.includes("?") || priority.includes("not-real")) continue;
      const expected = `${canonicalOrigin}${priority}`.replace(/\/$/, "");
      if (!normalized.some((u) => u === expected || u === `${expected}/`)) {
        audit.missingPriorityUrls.push(priority);
      }
    }

    const sample = locs.slice(0, SITEMAP_SAMPLE_SIZE);
    for (const loc of sample) {
      const fetchUrl =
        base.includes("localhost") && loc.startsWith(canonicalOrigin)
          ? loc.replace(canonicalOrigin, base)
          : loc;
      try {
        const res = await fetch(fetchUrl, {
          method: "HEAD",
          redirect: "follow",
          headers: { "User-Agent": "SmartlanceSeoIndexabilityAcceptance/1.0" },
        });
        if (res.status === 404) audit.sample404s.push(loc);
      } catch {
        audit.sample404s.push(loc);
      }
    }
  } catch {
    audit.validXml = false;
  }

  return audit;
}

async function main() {
  const pageResults = await mapPool(priorityPaths, checkPath, CONCURRENCY);
  const redirectResults = await mapPool(
    redirectChecks,
    (r) => checkRedirect(r.from, r.expectedTo),
    CONCURRENCY,
  );

  const sitemapPriorityUrls = [
    AI_AUTOMATION_HUB,
    ...aiAutomationSlugs.map((slug) => `/ai-automation/${slug}`),
    ...operationsSolutionSlugs.map((slug) => `/solutions/${slug}`),
  ];
  const sitemapAudit = await auditSitemap(sitemapPriorityUrls);

  const publicPages = pageResults.filter(
    (r) => r.path !== "/robots.txt" && r.path !== "/sitemap.xml" && !r.path.includes("not-real"),
  );

  const summary = {
    checked: pageResults.length,
    ok: pageResults.filter((r) => r.ok).length,
    failed: pageResults.filter((r) => !r.ok).map((r) => r.path),
    missingTitle: publicPages.filter((r) => r.ok && !r.title).map((r) => r.path),
    missingDescription: publicPages.filter((r) => r.ok && !r.description).map((r) => r.path),
    missingCanonical: publicPages
      .filter((r) => r.ok && !r.canonical && !r.path.startsWith("/work?"))
      .map((r) => r.path),
    canonicalMismatches: publicPages
      .filter((r) => r.ok && r.canonicalMatch === false)
      .map((r) => r.path),
    noindexPages: publicPages.filter((r) => r.ok && r.noindexDetected).map((r) => r.path),
    missingH1: publicPages.filter((r) => r.ok && !r.h1).map((r) => r.path),
    redirectsOk: redirectResults.filter((r) => r.ok).length,
    redirectsFailed: redirectResults.filter((r) => !r.ok).map((r) => r.from),
    sitemap: sitemapAudit,
  };

  const artifact = {
    generatedAt: new Date().toISOString(),
    base,
    canonicalOrigin,
    acceptanceVersion: "SEO_INDEXABILITY_ACCEPTANCE_V1",
    pageResults,
    redirectResults,
    sitemapAudit,
    summary,
    verdict:
      summary.failed.length === 0 &&
      summary.canonicalMismatches.length === 0 &&
      summary.noindexPages.length === 0 &&
      summary.redirectsFailed.length === 0 &&
      sitemapAudit.validXml &&
      sitemapAudit.includesAiHub &&
      sitemapAudit.includesAllAiChildren &&
      sitemapAudit.includesAllOpsSolutions &&
      sitemapAudit.excludesLegacyAiServices &&
      sitemapAudit.sample404s.length === 0
        ? "TECHNICAL_SEO_PASS"
        : "TECHNICAL_SEO_ISSUES_FOUND",
  };

  const outDir = path.join(process.cwd(), "docs/audit-artifacts");
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, "seo-indexability-acceptance.json");
  await writeFile(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");

  // Keep legacy artifact for backward compatibility
  const legacyPath = path.join(outDir, "seo-production-verification.json");
  await writeFile(
    legacyPath,
    `${JSON.stringify(
      {
        generatedAt: artifact.generatedAt,
        base,
        results: pageResults,
        summary: {
          checked: summary.checked,
          ok: summary.ok,
          failed: summary.failed,
          missingTitle: summary.missingTitle,
          missingDescription: summary.missingDescription,
          missingCanonical: summary.missingCanonical,
          sitemapSample404s: sitemapAudit.sample404s,
        },
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  console.log(`Acceptance report written to ${outPath}`);
  console.log(`Base: ${base}`);
  console.log(`Verdict: ${artifact.verdict}`);
  console.log(`Pages OK: ${summary.ok}/${summary.checked}`);
  console.log(`Redirects OK: ${summary.redirectsOk}/${redirectResults.length}`);
  if (summary.failed.length) console.log(`Failed pages: ${summary.failed.join(", ")}`);
  if (summary.canonicalMismatches.length) {
    console.log(`Canonical mismatches: ${summary.canonicalMismatches.join(", ")}`);
  }
  if (summary.noindexPages.length) {
    console.log(`Unexpected noindex: ${summary.noindexPages.join(", ")}`);
  }
  if (summary.redirectsFailed.length) {
    console.log(`Failed redirects: ${summary.redirectsFailed.join(", ")}`);
  }
  if (sitemapAudit.sample404s.length) {
    console.log(`Sitemap sample 404s: ${sitemapAudit.sample404s.length}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
