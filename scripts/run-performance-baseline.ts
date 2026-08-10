#!/usr/bin/env npx tsx
/**
 * Performance baseline capture (local prod build or Vercel preview/staging).
 *
 * Usage:
 *   npx tsx scripts/run-performance-baseline.ts
 *   SITE_URL=https://your-preview.vercel.app npx tsx scripts/run-performance-baseline.ts
 *   SITE_URL=https://your-preview.vercel.app RUN_LABEL=before npx tsx scripts/run-performance-baseline.ts
 */
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import {
  AI_AUTOMATION_HUB,
  aiAutomationSlugs,
} from "../lib/public/ai-automation-routes";

const base = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
const runLabel = process.env.RUN_LABEL || "baseline";
const CONCURRENCY = 4;
const UA = "SmartlancePerformanceBaseline/1.0";

const publicRoutes = [
  "/",
  "/services",
  "/services/website-redesign",
  "/solutions",
  "/solutions/website-not-generating-leads",
  "/platforms",
  "/platforms/wordpress",
  "/work",
  "/work/the-coast",
  "/about",
  "/how-we-work",
  "/free-tools",
  "/free-website-review",
  "/blog",
  "/blog/technical-seo-foundations",
  AI_AUTOMATION_HUB,
  "/ai-automation/ai-agents",
  "/ai-automation/workflow-automation",
];

const privateRoutes = ["/admin", "/portal", "/workspace"];

type RouteMeasurement = {
  path: string;
  kind: "public" | "private" | "static";
  status: number;
  ok: boolean;
  ttfbMs: number | null;
  totalMs: number | null;
  htmlBytes: number | null;
  cacheControl: string | null;
  cdnCacheControl: string | null;
  vercelCdnCacheControl: string | null;
  xVercelCache: string | null;
  age: string | null;
  cfCacheStatus: string | null;
  contentType: string | null;
  error?: string;
};

function pickHeaders(response: Response) {
  return {
    cacheControl: response.headers.get("cache-control"),
    cdnCacheControl: response.headers.get("cdn-cache-control"),
    vercelCdnCacheControl: response.headers.get("vercel-cdn-cache-control"),
    xVercelCache: response.headers.get("x-vercel-cache"),
    age: response.headers.get("age"),
    cfCacheStatus: response.headers.get("cf-cache-status"),
    contentType: response.headers.get("content-type"),
  };
}

async function measureRoute(
  route: string,
  kind: RouteMeasurement["kind"],
): Promise<RouteMeasurement> {
  const url = `${base}${route}`;
  const start = performance.now();
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": UA },
    });
    const ttfbMs = performance.now() - start;
    const body =
      kind === "static" ? null : await response.arrayBuffer();
    const totalMs = performance.now() - start;
    const headers = pickHeaders(response);

    return {
      path: route,
      kind,
      status: response.status,
      ok:
        kind === "private"
          ? response.status >= 200 && response.status < 500
          : response.status >= 200 && response.status < 400,
      ttfbMs: Math.round(ttfbMs),
      totalMs: Math.round(totalMs),
      htmlBytes: body ? body.byteLength : null,
      ...headers,
    };
  } catch (error) {
    return {
      path: route,
      kind,
      status: 0,
      ok: false,
      ttfbMs: null,
      totalMs: Math.round(performance.now() - start),
      htmlBytes: null,
      cacheControl: null,
      cdnCacheControl: null,
      vercelCdnCacheControl: null,
      xVercelCache: null,
      age: null,
      cfCacheStatus: null,
      contentType: null,
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
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, worker),
  );
  return results;
}

async function discoverStaticAsset(): Promise<string | null> {
  try {
    const home = await fetch(`${base}/`, { headers: { "User-Agent": UA } });
    const html = await home.text();
    const match = html.match(/\/_next\/static\/[^"']+\/_next\/static\/chunks\/[^"']+\.js/);
    if (match) return match[0];
    const fallback = html.match(/\/_next\/static\/chunks\/[^"']+\.js/);
    return fallback?.[0] ?? null;
  } catch {
    return null;
  }
}

async function main() {
  const staticPath = (await discoverStaticAsset()) ?? "/favicon.ico";
  const staticRoutes = [staticPath];

  const [publicResults, privateResults, staticResults] = await Promise.all([
    mapPool(publicRoutes, (r) => measureRoute(r, "public"), CONCURRENCY),
    mapPool(privateRoutes, (r) => measureRoute(r, "private"), CONCURRENCY),
    mapPool(staticRoutes, (r) => measureRoute(r, "static"), 1),
  ]);

  const allResults = [...publicResults, ...privateResults, ...staticResults];

  const privateCacheLeaks = privateResults.filter(
    (r) =>
      r.cfCacheStatus?.toUpperCase() === "HIT" ||
      (r.xVercelCache?.toUpperCase() === "HIT" &&
        !r.cacheControl?.includes("no-store")),
  );

  const summary = {
    base,
    runLabel,
    checked: allResults.length,
    publicOk: publicResults.filter((r) => r.ok).length,
    privateOk: privateResults.filter((r) => r.ok).length,
    staticOk: staticResults.filter((r) => r.ok).length,
    failed: allResults.filter((r) => !r.ok).map((r) => r.path),
    avgPublicTtfbMs: Math.round(
      publicResults
        .filter((r) => r.ttfbMs != null)
        .reduce((sum, r) => sum + (r.ttfbMs ?? 0), 0) /
        Math.max(publicResults.filter((r) => r.ttfbMs != null).length, 1),
    ),
    privateCacheLeaks: privateCacheLeaks.map((r) => r.path),
    staticImmutable:
      staticResults[0]?.cacheControl?.includes("immutable") ?? false,
  };

  const artifact = {
    generatedAt: new Date().toISOString(),
    acceptanceVersion: "PERFORMANCE_BASELINE_V1",
    nextVersion: "16.3.0",
    reactVersion: "19.2.8",
    runLabel,
    base,
    aiAutomationChildCount: aiAutomationSlugs.length,
    routes: allResults,
    summary,
    notes: [
      "Use local `next build && next start` for DB query profiling (PERF_PROFILE=1).",
      "Use Vercel preview/staging for realistic CDN header and CWV measurements.",
      "Do not compare against WordPress production as the Next.js BEFORE baseline.",
    ],
  };

  const outDir = path.join(process.cwd(), "docs/audit-artifacts");
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, `performance-${runLabel}.json`);
  await writeFile(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");

  const latestPath = path.join(outDir, "performance-baseline.json");
  await writeFile(latestPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");

  console.log(`Performance baseline written to ${outPath}`);
  console.log(`Base: ${base} (${runLabel})`);
  console.log(
    `Public OK: ${summary.publicOk}/${publicRoutes.length}, avg TTFB: ${summary.avgPublicTtfbMs}ms`,
  );
  console.log(`Private OK: ${summary.privateOk}/${privateRoutes.length}`);
  if (summary.privateCacheLeaks.length) {
    console.log(`Private cache leaks: ${summary.privateCacheLeaks.join(", ")}`);
  }
  if (summary.failed.length) {
    console.log(`Failed: ${summary.failed.join(", ")}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
