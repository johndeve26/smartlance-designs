/**
 * Phase 4 one-time site operations import.
 *
 * Safe behavior:
 * - Skips entirely if ContentImportMarker id=phase4 exists (unless --force)
 * - Does NOT overwrite Admin-edited settings/navigation when re-run without --force
 * - Registers known static media without moving files
 * - Marks legacy redirects origin=LEGACY_MIGRATION
 *
 * Usage:
 *   npm run content:import:phase4
 *   npx tsx scripts/import-phase4-ops.ts --force
 *
 * WARNING: --force can overwrite live Admin edits. Do not use casually in production.
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { legacyBlogRedirects } from "../data/legacy-blog-redirects";
import { projects } from "../data/portfolio";
import { siteConfig } from "../lib/site";

const FORCE = process.argv.includes("--force");
const MARKER_ID = "phase4";
const MARKER_VERSION = "phase4-v1";

type Report = Record<string, unknown>;

function json(value: unknown) {
  return value as never;
}

async function main() {
  if (FORCE) {
    console.warn(
      "\n⚠  --force enabled: may overwrite Admin-edited settings/navigation. Not recommended for production.\n",
    );
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const report: Report = {};

  try {
    const existing = await prisma.contentImportMarker.findUnique({
      where: { id: MARKER_ID },
    });
    if (existing && !FORCE) {
      console.log(
        `Phase 4 marker already present (${existing.version} @ ${existing.completedAt.toISOString()}). Skipping. Use --force to re-run.`,
      );
      return;
    }

    // --- Site settings seed (skip contact overwrite if already set unless force) ---
    const settingsExisting = await prisma.siteSettings.findUnique({
      where: { id: "site" },
    });
    const host = (() => {
      try {
        return new URL(siteConfig.url).host;
      } catch {
        return "smartlancedesigns.com";
      }
    })();

    const settingsData = {
      id: "site" as const,
      siteName: siteConfig.name,
      businessName: siteConfig.legalName,
      defaultSiteDescription: siteConfig.description,
      defaultMetaTitle: `${siteConfig.name} | ${siteConfig.tagline}`,
      defaultMetaDescription: siteConfig.description,
      defaultOgImagePath: siteConfig.ogImage,
      defaultLocale: "en",
      timezone: "Africa/Lagos",
      canonicalHost: host,
      contactEmail: siteConfig.email,
      contactPhone: siteConfig.phone,
      whatsapp: siteConfig.whatsapp || null,
      primaryLogoPath: "/images/brand/smartlance-logo.png",
      logoOnDarkPath: "/images/brand/smartlance-logo-on-dark.png",
      brandMarkPath: "/images/brand/smartlance-mark.png",
      faviconPath: "/images/brand/favicon-32.png",
      publisherName: siteConfig.name,
      defaultTitleTemplate: `%s | ${siteConfig.name}`,
      gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || null,
      gtmContainerId: process.env.NEXT_PUBLIC_GTM_ID || null,
      clarityProjectId: process.env.NEXT_PUBLIC_CLARITY_ID || null,
      showPublicPricing: false,
      socialLinks: json([
        {
          platform: "instagram",
          url: "https://www.instagram.com/smartlance_designs/",
          enabled: true,
          displayOrder: 0,
        },
      ]),
    };

    if (!settingsExisting?.contactEmail || FORCE) {
      await prisma.siteSettings.upsert({
        where: { id: "site" },
        create: settingsData,
        update: settingsData,
      });
      report.settingsImported = true;
    } else {
      report.settingsImported = false;
      report.settingsSkipped = "contact already present";
    }

    // --- Navigation seed ---
    const { seedNavigationFromCode } = await import(
      "../lib/repositories/navigationRepository"
    );
    // Use prisma from script context — seed uses shared prisma from lib/db.
    // Call via dynamic ensuring DATABASE_URL is set (already is).
    const nav = await seedNavigationFromCode({ force: FORCE });
    report.navigationMenus = nav.imported;
    report.navigationSkipped = nav.skipped;

    // --- Managed pages ---
    const { seedKnownManagedPages } = await import(
      "../lib/repositories/managedPagesRepository"
    );
    report.managedPages = await seedKnownManagedPages(FORCE);

    // --- Media registration ---
    const mediaPaths = new Set<string>([
      "/images/brand/smartlance-logo.png",
      "/images/brand/smartlance-logo-on-dark.png",
      "/images/brand/smartlance-mark.png",
      "/images/brand/favicon-32.png",
      "/images/brand/apple-touch-icon.png",
      "/images/og/default.svg",
    ]);

    for (const project of projects) {
      const p = project as {
        heroImage?: string;
        coverImage?: string;
        gallery?: Array<string | { src: string }>;
      };
      if (p.coverImage) mediaPaths.add(p.coverImage);
      if (p.heroImage) mediaPaths.add(p.heroImage);
      // cover often mirrors hero path pattern
      if (p.heroImage?.includes("/hero.")) {
        mediaPaths.add(p.heroImage.replace("/hero.", "/cover."));
      }
      for (const g of p.gallery || []) {
        if (typeof g === "string") mediaPaths.add(g);
        else if (g && typeof g === "object" && "src" in g) {
          mediaPaths.add(String(g.src));
        }
      }
    }

    // Blog heroes from public/images/blog
    const blogRoot = path.join(process.cwd(), "public/images/blog");
    if (fs.existsSync(blogRoot)) {
      for (const dir of fs.readdirSync(blogRoot)) {
        const hero = path.join(blogRoot, dir, "hero.webp");
        if (fs.existsSync(hero)) {
          mediaPaths.add(`/images/blog/${dir}/hero.webp`);
        }
      }
    }

    // AssetReference paths
    const refs = await prisma.assetReference.findMany({ select: { path: true } });
    for (const ref of refs) mediaPaths.add(ref.path);

    let mediaRegistered = 0;
    for (const publicUrl of mediaPaths) {
      const filename = publicUrl.split("/").pop() || publicUrl;
      const extension = (filename.split(".").pop() || "").toLowerCase();
      const mime =
        extension === "png"
          ? "image/png"
          : extension === "webp"
            ? "image/webp"
            : extension === "svg"
              ? "image/svg+xml"
              : extension === "jpg" || extension === "jpeg"
                ? "image/jpeg"
                : "application/octet-stream";
      await prisma.mediaAsset.upsert({
        where: { storageKey: `static:${publicUrl}` },
        create: {
          filename,
          originalFilename: filename,
          storageProvider: "static",
          storageKey: `static:${publicUrl}`,
          publicUrl,
          mimeType: mime,
          extension,
          byteSize: 0,
          sourceType: "STATIC_EXISTING",
          status: "ACTIVE",
          title: filename,
        },
        update: FORCE
          ? {
              publicUrl,
              mimeType: mime,
            }
          : {},
      });
      mediaRegistered += 1;
    }
    report.mediaAssetsRegistered = mediaRegistered;

    // --- Legacy redirect origin tagging ---
    let legacyTagged = 0;
    for (const source of Object.keys(legacyBlogRedirects)) {
      const row = await prisma.redirect.findUnique({
        where: { sourcePath: source },
      });
      if (row) {
        await prisma.redirect.update({
          where: { id: row.id },
          data: { origin: "LEGACY_MIGRATION" },
        });
        legacyTagged += 1;
      }
    }
    report.legacyRedirectsTagged = legacyTagged;
    report.legacyRedirectsExpected = Object.keys(legacyBlogRedirects).length;

    // Tag slug-change style reasons
    const slugTagged = await prisma.redirect.updateMany({
      where: {
        OR: [
          { reason: { contains: "slug" } },
          { reason: "slug-change" },
        ],
        origin: "MANUAL",
      },
      data: { origin: "SLUG_CHANGE" },
    });
    report.slugRedirectsTagged = slugTagged.count;

    const redirectCount = await prisma.redirect.count();
    report.redirectsVerified = redirectCount;

    await prisma.contentImportMarker.upsert({
      where: { id: MARKER_ID },
      create: {
        id: MARKER_ID,
        version: MARKER_VERSION,
        report: json(report),
      },
      update: {
        version: MARKER_VERSION,
        report: json(report),
        completedAt: new Date(),
      },
    });

    console.log("Phase 4 import complete:");
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
