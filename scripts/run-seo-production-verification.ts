#!/usr/bin/env npx tsx
/**
 * Read-only SEO verification against a running site (local or production).
 *
 * Usage:
 *   npx tsx scripts/run-seo-production-verification.ts
 *   SITE_URL=https://smartlancedesigns.com npx tsx scripts/run-seo-production-verification.ts
 */
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const base = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");

const paths = [
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
  "/blog",
  "/blog/technical-seo-foundations",
  "/guides/website-redesign-guide",
  "/compare/wordpress-vs-webflow",
  "/checklists/website-redesign-checklist",
  "/glossary/call-to-action",
  "/templates/website-project-brief",
  "/tools/platform-selector",
  "/robots.txt",
  "/sitemap.xml",
];

type CheckResult = {
  path: string;
  status: number;
  ok: boolean;
  title: string | null;
  description: string | null;
  canonical: string | null;
  robots: string | null;
  h1: string | null;
  ogTitle: string | null;
  ogImage: string | null;
  hasBreadcrumb: boolean;
  hasJsonLd: boolean;
  error?: string;
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

async function checkPath(route: string): Promise<CheckResult> {
  const url = `${base}${route}`;
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": "SmartlanceSeoVerification/1.0" },
    });
    const html = await response.text();
    return {
      path: route,
      status: response.status,
      ok: response.status >= 200 && response.status < 400,
      title: extractTitle(html),
      description: extractMeta(html, "description"),
      canonical: extractCanonical(html),
      robots: extractRobots(html),
      h1: extractH1(html),
      ogTitle: extractMeta(html, "og:title", "property"),
      ogImage: extractMeta(html, "og:image", "property"),
      hasBreadcrumb: /BreadcrumbList|"@type":"BreadcrumbList"/.test(html),
      hasJsonLd: /application\/ld\+json/.test(html),
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
      h1: null,
      ogTitle: null,
      ogImage: null,
      hasBreadcrumb: false,
      hasJsonLd: false,
      error: error instanceof Error ? error.message : "fetch failed",
    };
  }
}

async function main() {
  const results = await Promise.all(paths.map((route) => checkPath(route)));
  const sitemap = results.find((r) => r.path === "/sitemap.xml");
  const sitemap404s: string[] = [];

  if (sitemap?.ok && sitemap.status === 200) {
    const xml = await fetch(`${base}/sitemap.xml`).then((r) => r.text());
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    for (const loc of locs.slice(0, 40)) {
      try {
        const res = await fetch(loc, { method: "HEAD", redirect: "follow" });
        if (res.status === 404) sitemap404s.push(loc);
      } catch {
        sitemap404s.push(loc);
      }
    }
  }

  const artifact = {
    generatedAt: new Date().toISOString(),
    base,
    results,
    summary: {
      checked: results.length,
      ok: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).map((r) => r.path),
      missingTitle: results.filter((r) => r.ok && !r.title).map((r) => r.path),
      missingDescription: results.filter((r) => r.ok && !r.description).map((r) => r.path),
      missingCanonical: results.filter((r) => r.ok && !r.canonical).map((r) => r.path),
      sitemapSample404s: sitemap404s,
    },
  };

  const outDir = path.join(process.cwd(), "docs/audit-artifacts");
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, "seo-production-verification.json");
  await writeFile(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");

  console.log(`Verification written to ${outPath}`);
  console.log(`Base: ${base}`);
  console.log(`OK: ${artifact.summary.ok}/${artifact.summary.checked}`);
  if (artifact.summary.failed.length) {
    console.log(`Failed: ${artifact.summary.failed.join(", ")}`);
  }
  if (sitemap404s.length) {
    console.log(`Sitemap sample 404s: ${sitemap404s.length}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
