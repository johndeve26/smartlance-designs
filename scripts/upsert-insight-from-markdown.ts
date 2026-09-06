/**
 * One-off: upsert a single Insight from content/blog/<slug>.md into Postgres.
 * Usage: npx tsx scripts/upsert-insight-from-markdown.ts ai-powered-website-builder
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env" });
loadEnv({ path: ".env.local" });

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function json(value: unknown) {
  return value as object;
}

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    throw new Error("Usage: npx tsx scripts/upsert-insight-from-markdown.ts <slug>");
  }
  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL missing — skip DB sync (markdown fallback may apply)");
    return;
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const publishedCount = await prisma.insight.count({
      where: { status: "PUBLISHED" },
    });
    console.log("publishedInsightsBefore", publishedCount);

    const file = path.join(process.cwd(), "content/blog", `${slug}.md`);
    if (!fs.existsSync(file)) {
      throw new Error(`Missing markdown file: ${file}`);
    }
    const raw = fs.readFileSync(file, "utf8");
    const { data, content } = matter(raw);
    const stats = readingTime(content);
    const publishedAt = new Date(String(data.publishedAt));
    const materialUpdatedAt = data.updatedAt
      ? new Date(String(data.updatedAt))
      : publishedAt;
    const isPublished = data.published !== false;

    const payload = {
      title: String(data.title ?? slug),
      description: String(data.description ?? ""),
      bodyMarkdown: content,
      categoryLabel: String(data.category ?? "Website Design"),
      author: data.author ? String(data.author) : "Smartlance Designs",
      readingTime: stats.text,
      heroImagePath: data.heroImage ? String(data.heroImage) : null,
      heroImageAlt: data.heroImageAlt ? String(data.heroImageAlt) : null,
      relatedServiceHrefs: Array.isArray(data.relatedServiceHrefs)
        ? json(data.relatedServiceHrefs.map(String))
        : json([]),
      tags: Array.isArray(data.tags) ? json(data.tags.map(String)) : undefined,
      featured: Boolean(data.featured),
      originalPublishedAt: publishedAt,
      materialUpdatedAt,
      seoTitle: data.seoTitle ? String(data.seoTitle) : null,
      seoDescription: data.seoDescription
        ? String(data.seoDescription)
        : String(data.description ?? ""),
      canonicalOverride: data.canonicalUrl ? String(data.canonicalUrl) : null,
      status: isPublished ? ("PUBLISHED" as const) : ("DRAFT" as const),
      publishedAt: isPublished ? publishedAt : null,
    };

    const row = await prisma.insight.upsert({
      where: { slug },
      create: { slug, ...payload },
      update: payload,
      select: {
        slug: true,
        status: true,
        title: true,
        seoTitle: true,
        canonicalOverride: true,
      },
    });

    if (data.heroImage) {
      await prisma.assetReference.upsert({
        where: { path: String(data.heroImage) },
        create: {
          path: String(data.heroImage),
          alt: data.heroImageAlt ? String(data.heroImageAlt) : null,
          kind: "insight-hero",
          entityHint: slug,
        },
        update: {
          alt: data.heroImageAlt ? String(data.heroImageAlt) : null,
        },
      });
    }

    console.log("upserted", row);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
