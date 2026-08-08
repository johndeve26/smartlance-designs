#!/usr/bin/env npx tsx
/**
 * Generates SEO baseline artifacts for Smartlance.
 *
 * Usage: npx tsx scripts/run-seo-baseline-audit.ts
 */
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import {
  buildSeoUrlInventory,
  compareInventoryToSitemap,
} from "@/lib/seo/inventory";
import { buildSeoInventory } from "@/lib/ops/seo-health";
import { buildPublicSitemapEntries } from "@/lib/seo/sitemap-entries";
import { getSiteOrigin } from "@/lib/seo/canonical";
import { isIndexNowEnabled } from "@/lib/seo/indexnow";

async function main() {
  const origin = await getSiteOrigin();
  const [inventory, urlInventory, sitemapMismatches, sitemap, seoHealth] =
    await Promise.all([
      buildSeoUrlInventory(),
      buildSeoUrlInventory(),
      compareInventoryToSitemap(),
      buildPublicSitemapEntries(),
      buildSeoInventory(),
    ]);

  const artifact = {
    generatedAt: new Date().toISOString(),
    origin,
    indexNowEnabled: isIndexNowEnabled(),
    urlInventory: inventory,
    sitemap: {
      count: sitemap.length,
      urls: sitemap.map((e) => e.url),
    },
    sitemapMismatches,
    seoHealthSummary: seoHealth.summary,
    seoHealthIssueCodes: [...new Set(seoHealth.issues.map((i) => i.code))],
  };

  const outDir = path.join(process.cwd(), "docs/audit-artifacts");
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, "seo-baseline-audit.json");
  await writeFile(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");

  console.log(`SEO baseline written to ${outPath}`);
  console.log(`Origin: ${origin}`);
  console.log(`Sitemap URLs: ${sitemap.length}`);
  console.log(`Inventory rows: ${urlInventory.rows.length}`);
  console.log(`Sitemap mismatches: ${sitemapMismatches.length}`);
  console.log(
    `SEO health — errors: ${seoHealth.summary.errors}, warnings: ${seoHealth.summary.warnings}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
