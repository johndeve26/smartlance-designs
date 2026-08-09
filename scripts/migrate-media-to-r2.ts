/**
 * One-time migration: upload public site media to Cloudflare R2 and register in MediaAsset.
 *
 * Usage:
 *   npm run media:migrate:r2
 *   npx tsx scripts/migrate-media-to-r2.ts --dry-run
 *   npx tsx scripts/migrate-media-to-r2.ts --force
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

import fs from "node:fs";
import path from "node:path";
import { imageSize } from "image-size";
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const FORCE = process.argv.includes("--force");
const DRY_RUN = process.argv.includes("--dry-run");
const MARKER_ID = "media-r2";
const MARKER_VERSION = "media-r2-v1";

const PUBLIC_SCAN_ROOTS = ["public/images", "public/og"];

type UploadReport = {
  uploaded: number;
  skippedExisting: number;
  mediaAssetsUpdated: number;
  dbPathsRewritten: number;
  errors: string[];
};

function guessMime(ext: string) {
  switch (ext.toLowerCase()) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "avif":
      return "image/avif";
    case "gif":
      return "image/gif";
    case "svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

function walkFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full));
    else out.push(full);
  }
  return out;
}

function toPublicPath(absPath: string) {
  const rel = path.relative(path.join(process.cwd(), "public"), absPath);
  return `/${rel.split(path.sep).join("/")}`;
}

function createS3Client() {
  const endpoint = process.env.MEDIA_S3_ENDPOINT;
  const region = process.env.MEDIA_S3_REGION || "auto";
  const accessKeyId = process.env.MEDIA_S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.MEDIA_S3_SECRET_ACCESS_KEY;
  const bucket = process.env.MEDIA_S3_BUCKET;
  const publicBase = process.env.MEDIA_PUBLIC_BASE_URL?.replace(/\/$/, "");

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket || !publicBase) {
    throw new Error(
      "R2 migration requires MEDIA_S3_ENDPOINT, MEDIA_S3_BUCKET, MEDIA_S3_ACCESS_KEY_ID, MEDIA_S3_SECRET_ACCESS_KEY, MEDIA_PUBLIC_BASE_URL",
    );
  }

  return {
    bucket,
    publicBase,
    client: new S3Client({
      region,
      endpoint,
      forcePathStyle: process.env.MEDIA_S3_FORCE_PATH_STYLE === "1",
      credentials: { accessKeyId, secretAccessKey },
    }),
  };
}

async function objectExists(
  client: S3Client,
  bucket: string,
  key: string,
): Promise<boolean> {
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

function replacePath(value: string, map: Map<string, string>) {
  if (map.has(value)) return map.get(value)!;
  let out = value;
  for (const [oldPath, newUrl] of map) {
    if (out.includes(oldPath)) out = out.split(oldPath).join(newUrl);
  }
  return out;
}

function replaceJsonPaths(value: unknown, map: Map<string, string>): unknown {
  if (typeof value === "string") return replacePath(value, map);
  if (Array.isArray(value)) return value.map((item) => replaceJsonPaths(item, map));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        replaceJsonPaths(item, map),
      ]),
    );
  }
  return value;
}

async function rewriteDatabasePaths(
  prisma: PrismaClient,
  map: Map<string, string>,
  dryRun: boolean,
) {
  let count = 0;
  const bump = (n = 1) => {
    count += n;
  };

  const settings = await prisma.siteSettings.findUnique({ where: { id: "site" } });
  if (settings) {
    const data = {
      defaultOgImagePath: settings.defaultOgImagePath
        ? replacePath(settings.defaultOgImagePath, map)
        : settings.defaultOgImagePath,
      primaryLogoPath: settings.primaryLogoPath
        ? replacePath(settings.primaryLogoPath, map)
        : settings.primaryLogoPath,
      logoOnDarkPath: settings.logoOnDarkPath
        ? replacePath(settings.logoOnDarkPath, map)
        : settings.logoOnDarkPath,
      brandMarkPath: settings.brandMarkPath
        ? replacePath(settings.brandMarkPath, map)
        : settings.brandMarkPath,
      faviconPath: settings.faviconPath
        ? replacePath(settings.faviconPath, map)
        : settings.faviconPath,
    };
    if (!dryRun) await prisma.siteSettings.update({ where: { id: "site" }, data });
    bump();
  }

  const homepage = await prisma.homepageContent.findUnique({ where: { id: "home" } });
  if (homepage) {
    const data = {
      ogImagePath: homepage.ogImagePath
        ? replacePath(homepage.ogImagePath, map)
        : homepage.ogImagePath,
      sections: replaceJsonPaths(homepage.sections, map) as never,
    };
    if (!dryRun) {
      await prisma.homepageContent.update({ where: { id: "home" }, data });
    }
    bump();
  }

  const workRows = await prisma.workProject.findMany();
  for (const row of workRows) {
    const data = {
      coverImagePath: row.coverImagePath
        ? replacePath(row.coverImagePath, map)
        : row.coverImagePath,
      heroImagePath: row.heroImagePath
        ? replacePath(row.heroImagePath, map)
        : row.heroImagePath,
      ogImagePath: row.ogImagePath
        ? replacePath(row.ogImagePath, map)
        : row.ogImagePath,
      gallery: replaceJsonPaths(row.gallery, map) as never,
    };
    if (!dryRun) await prisma.workProject.update({ where: { id: row.id }, data });
    bump();
  }

  const insights = await prisma.insight.findMany();
  for (const row of insights) {
    const data = {
      heroImagePath: row.heroImagePath
        ? replacePath(row.heroImagePath, map)
        : row.heroImagePath,
      ogImagePath: row.ogImagePath
        ? replacePath(row.ogImagePath, map)
        : row.ogImagePath,
      bodyMarkdown: replacePath(row.bodyMarkdown, map),
    };
    if (!dryRun) await prisma.insight.update({ where: { id: row.id }, data });
    bump();
  }

  const managed = await prisma.managedPage.findMany();
  for (const row of managed) {
    if (!row.ogImagePath) continue;
    const ogImagePath = replacePath(row.ogImagePath, map);
    if (!dryRun) {
      await prisma.managedPage.update({
        where: { id: row.id },
        data: { ogImagePath },
      });
    }
    bump();
  }

  const refs = await prisma.assetReference.findMany();
  for (const row of refs) {
    const nextPath = replacePath(row.path, map);
    if (!dryRun) {
      await prisma.assetReference.update({
        where: { id: row.id },
        data: { path: nextPath },
      });
    }
    bump();
  }

  const cmsTables = [
    prisma.service,
    prisma.solution,
    prisma.platform,
    prisma.industry,
    prisma.cmsResource,
    prisma.testimonial,
  ] as const;

  for (const table of cmsTables) {
    const rows = await table.findMany();
    for (const row of rows) {
      const patch: Record<string, unknown> = {};
      if ("ogImagePath" in row && row.ogImagePath) {
        patch.ogImagePath = replacePath(String(row.ogImagePath), map);
      }
      if ("heroImagePath" in row && row.heroImagePath) {
        patch.heroImagePath = replacePath(String(row.heroImagePath), map);
      }
      if ("avatarPath" in row && row.avatarPath) {
        patch.avatarPath = replacePath(String(row.avatarPath), map);
      }
      if (Object.keys(patch).length) {
        if (!dryRun) {
          await table.update({ where: { id: row.id }, data: patch as never });
        }
        bump();
      }
    }
  }

  return count;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required");

  const { client, bucket, publicBase } = createS3Client();
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const report: UploadReport = {
    uploaded: 0,
    skippedExisting: 0,
    mediaAssetsUpdated: 0,
    dbPathsRewritten: 0,
    errors: [],
  };

  try {
    const marker = await prisma.contentImportMarker.findUnique({
      where: { id: MARKER_ID },
    });
    if (marker && !FORCE) {
      console.log(
        `Media R2 migration already completed (${marker.version} @ ${marker.completedAt.toISOString()}). Use --force to re-run.`,
      );
      return;
    }

    const files = PUBLIC_SCAN_ROOTS.flatMap((root) =>
      walkFiles(path.join(process.cwd(), root)),
    ).sort();

    console.log(`Found ${files.length} public media files to migrate.`);

    const pathMap = new Map<string, string>();

    for (const absPath of files) {
      const publicPath = toPublicPath(absPath);
      const storageKey = publicPath.slice(1);
      const publicUrl = `${publicBase}${publicPath}`;
      pathMap.set(publicPath, publicUrl);

      const ext = (path.basename(absPath).split(".").pop() || "").toLowerCase();
      const mimeType = guessMime(ext);
      const buffer = fs.readFileSync(absPath);
      let width: number | null = null;
      let height: number | null = null;
      if (mimeType !== "image/svg+xml") {
        try {
          const dims = imageSize(buffer);
          width = dims.width ?? null;
          height = dims.height ?? null;
        } catch {
          // optional
        }
      }

      const exists = await objectExists(client, bucket, storageKey);
      if (exists && !FORCE) {
        report.skippedExisting += 1;
      } else if (!DRY_RUN) {
        await client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: storageKey,
            Body: buffer,
            ContentType: mimeType,
          }),
        );
        report.uploaded += 1;
      } else {
        report.uploaded += 1;
      }

      if (!DRY_RUN) {
        const filename = path.basename(absPath);
        await prisma.mediaAsset.upsert({
          where: { storageKey },
          create: {
            filename,
            originalFilename: filename,
            storageProvider: "s3",
            storageKey,
            publicUrl,
            mimeType,
            extension: ext,
            byteSize: buffer.byteLength,
            width,
            height,
            sourceType: "UPLOADED",
            status: "ACTIVE",
            title: filename,
          },
          update: {
            storageProvider: "s3",
            publicUrl,
            mimeType,
            extension: ext,
            byteSize: buffer.byteLength,
            width,
            height,
            sourceType: "UPLOADED",
            status: "ACTIVE",
          },
        });
        report.mediaAssetsUpdated += 1;

        const legacyKey = `static:${publicPath}`;
        const legacy = await prisma.mediaAsset.findUnique({
          where: { storageKey: legacyKey },
        });
        if (legacy) {
          await prisma.mediaAsset.delete({ where: { id: legacy.id } });
        }
      }
    }

    // Local admin uploads (if any)
    const localUploadRoot = path.join(process.cwd(), "storage/media");
    for (const absPath of walkFiles(localUploadRoot)) {
      const rel = path.relative(localUploadRoot, absPath).split(path.sep).join("/");
      const storageKey = rel.startsWith("uploads/") ? rel : `uploads/${rel}`;
      const buffer = fs.readFileSync(absPath);
      const ext = (path.basename(absPath).split(".").pop() || "").toLowerCase();
      const mimeType = guessMime(ext);

      if (!DRY_RUN) {
        await client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: storageKey,
            Body: buffer,
            ContentType: mimeType,
          }),
        );
        report.uploaded += 1;
      }
    }

    report.dbPathsRewritten = await rewriteDatabasePaths(prisma, pathMap, DRY_RUN);

    if (!DRY_RUN) {
      await prisma.contentImportMarker.upsert({
        where: { id: MARKER_ID },
        create: {
          id: MARKER_ID,
          version: MARKER_VERSION,
          completedAt: new Date(),
          report: report as never,
        },
        update: {
          version: MARKER_VERSION,
          completedAt: new Date(),
          report: report as never,
        },
      });
    }

    console.log(JSON.stringify({ dryRun: DRY_RUN, ...report }, null, 2));
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
