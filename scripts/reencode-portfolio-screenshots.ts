/**
 * Re-encode product case-study screenshots from PNG sources and upload to R2.
 * WebP quality is clamped to at least 60 (default 92).
 *
 *   npx tsx scripts/reencode-portfolio-screenshots.ts
 *   PORTFOLIO_WEBP_QUALITY=90 npx tsx scripts/reencode-portfolio-screenshots.ts
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const MIN_WEBP_QUALITY = 60;
const DEFAULT_WEBP_QUALITY = 92;
const quality = Math.max(
  MIN_WEBP_QUALITY,
  Math.min(
    100,
    Number(process.env.PORTFOLIO_WEBP_QUALITY || DEFAULT_WEBP_QUALITY),
  ),
);

const assetsDir = path.join(
  process.cwd(),
  ".cursor",
  "projects",
  "Users-abiodun-Documents-SmartlanceDesigns",
  "assets",
);

/** Fallback when assets live in Cursor's global assets path. */
const cursorAssetsDir =
  "/Users/abiodun/.cursor/projects/Users-abiodun-Documents-SmartlanceDesigns/assets";

function resolveAssetsDir() {
  if (fs.existsSync(cursorAssetsDir)) return cursorAssetsDir;
  if (fs.existsSync(assetsDir)) return assetsDir;
  throw new Error("Could not find Cursor assets directory with PNG sources.");
}

const SOURCE_MAP: Array<{
  png: string;
  project: string;
  targets: string[];
}> = [
  {
    png: "image-a8801e32-aa89-4fe4-9fef-744ff772427b.png",
    project: "padeya",
    targets: ["hero.webp", "cover.webp"],
  },
  {
    png: "image-158f1359-a864-463f-92d1-6087c52e03d9.png",
    project: "padeya",
    targets: ["discovery.webp"],
  },
  {
    png: "image-d44e5984-cca9-4fe4-847c-a3d1894d86c3.png",
    project: "padeya",
    targets: ["event-marketplace.webp"],
  },
  {
    png: "image-46772ad2-dd21-4cfd-8e49-6a5d835c6972.png",
    project: "padeya",
    targets: ["event-detail.webp"],
  },
  {
    png: "image-2481a50e-ca6e-4123-8453-eb7b634e150c.png",
    project: "padeya",
    targets: ["fan-passport.webp"],
  },
  {
    png: "image-f196336e-e6a5-4096-a2b7-520b4c57556d.png",
    project: "padeya",
    targets: ["memories.webp"],
  },
  {
    png: "image-36278033-2d3a-499f-89d3-806288546be2.png",
    project: "padeya",
    targets: ["legacy.webp"],
  },
  {
    png: "image-9aec6d31-071e-49a1-aef6-f537b088c75d.png",
    project: "freelance-os",
    targets: ["hero.webp", "cover.webp"],
  },
  {
    png: "image-0726e424-b0dc-4550-a4f1-a9359141128c.png",
    project: "freelance-os",
    targets: ["discovery.webp"],
  },
];

function createS3Client() {
  return new S3Client({
    region: process.env.MEDIA_S3_REGION || "auto",
    endpoint: process.env.MEDIA_S3_ENDPOINT,
    forcePathStyle: process.env.MEDIA_S3_FORCE_PATH_STYLE === "1",
    credentials: {
      accessKeyId: process.env.MEDIA_S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.MEDIA_S3_SECRET_ACCESS_KEY!,
    },
  });
}

async function main() {
  const dir = resolveAssetsDir();
  const client = createS3Client();
  const bucket = process.env.MEDIA_S3_BUCKET!;
  const publicBase = process.env.MEDIA_PUBLIC_BASE_URL!.replace(/\/$/, "");

  console.log(`Encoding at WebP quality ${quality} (min ${MIN_WEBP_QUALITY})`);

  for (const item of SOURCE_MAP) {
    const input = path.join(dir, item.png);
    if (!fs.existsSync(input)) {
      console.warn(`Skip missing source: ${item.png}`);
      continue;
    }

    const webp = await sharp(fs.readFileSync(input))
      .webp({ quality, effort: 6, smartSubsample: false })
      .toBuffer();
    const meta = await sharp(webp).metadata();

    for (const name of item.targets) {
      const localPath = path.join(
        process.cwd(),
        "public/images/projects",
        item.project,
        name,
      );
      fs.writeFileSync(localPath, webp);

      const key = `images/projects/${item.project}/${name}`;
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: webp,
          ContentType: "image/webp",
          CacheControl: "public, max-age=31536000, immutable",
        }),
      );

      console.log(
        `${item.project}/${name}: ${webp.length} bytes (${meta.width}x${meta.height}) q${quality}`,
      );
      console.log(`  ${publicBase}/${key}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
