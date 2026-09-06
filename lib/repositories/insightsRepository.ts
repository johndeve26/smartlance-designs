import { hasDatabaseUrl, prisma } from "@/lib/db";
import type { BlogCategory } from "@/types";
import type { Insight, Prisma, PublishStatus } from "@prisma/client";
import {
  createContentRevision,
  revalidateInsight,
} from "@/lib/admin/publishing";
import { writeAuditLog } from "@/lib/repositories/auditRepository";
import { upsertSlugRedirect } from "@/lib/repositories/redirectsRepository";
import { contentRoutes } from "@/lib/content-routes";
import { resolveMediaUrl } from "@/lib/media/urls";
import readingTime from "reading-time";

const published: PublishStatus = "PUBLISHED";

export type InsightPublic = {
  slug: string;
  title: string;
  description: string;
  category: BlogCategory;
  author?: string;
  publishedAt: string;
  updatedAt?: string;
  readingTime: string;
  heroImage?: string;
  heroImageAlt?: string;
  relatedServiceHrefs: string[];
  featured?: boolean;
  published: boolean;
  legacyUrl?: string;
  canonicalUrl?: string;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  noIndex?: boolean;
  content: string;
};

/** Public fields for Homepage Insight cards — no article body. */
export type HomepageInsightCard = Omit<InsightPublic, "content">;

const homepageInsightSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  categoryLabel: true,
  author: true,
  readingTime: true,
  heroImagePath: true,
  heroImageAlt: true,
  featured: true,
  originalPublishedAt: true,
  publishedAt: true,
  materialUpdatedAt: true,
  relatedServiceHrefs: true,
  tags: true,
  seoTitle: true,
  seoDescription: true,
  legacyUrl: true,
  canonicalOverride: true,
  status: true,
} as const;

export function toHomepageInsightCard(row: Insight): HomepageInsightCard {
  const full = toPublicInsight(row);
  const { content: _content, ...card } = full;
  return card;
}

export function toPublicInsight(row: Insight): InsightPublic {
  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    category: row.categoryLabel as BlogCategory,
    author: row.author ?? undefined,
    publishedAt: (row.publishedAt ?? row.originalPublishedAt).toISOString(),
    updatedAt: row.materialUpdatedAt?.toISOString(),
    readingTime:
      row.readingTime || readingTime(row.bodyMarkdown).text,
    heroImage: row.heroImagePath
      ? resolveMediaUrl(row.heroImagePath)
      : undefined,
    heroImageAlt: row.heroImageAlt ?? undefined,
    relatedServiceHrefs: Array.isArray(row.relatedServiceHrefs)
      ? (row.relatedServiceHrefs as string[])
      : [],
    featured: row.featured || undefined,
    published: row.status === published,
    legacyUrl: row.legacyUrl ?? undefined,
    canonicalUrl: row.canonicalOverride ?? undefined,
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : undefined,
    seoTitle: row.seoTitle ?? undefined,
    seoDescription: row.seoDescription ?? undefined,
    noIndex: row.noIndex,
    content: row.bodyMarkdown,
  };
}

export async function countPublishedInsights() {
  if (!hasDatabaseUrl()) return 0;
  return prisma.insight.count({ where: { status: published } });
}

export async function listPublishedInsightsMeta() {
  if (!hasDatabaseUrl()) return [];
  return prisma.insight.findMany({
    where: { status: published },
    orderBy: { originalPublishedAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      categoryLabel: true,
      author: true,
      readingTime: true,
      heroImagePath: true,
      heroImageAlt: true,
      featured: true,
      originalPublishedAt: true,
      publishedAt: true,
      materialUpdatedAt: true,
      relatedServiceHrefs: true,
      tags: true,
      seoTitle: true,
      seoDescription: true,
      legacyUrl: true,
      canonicalOverride: true,
      status: true,
      // Intentionally omit bodyMarkdown — archives must not load full article bodies
    },
  });
}

export async function listPublishedInsights() {
  const rows = await listPublishedInsightsMeta();
  return rows.map((row) =>
    toPublicInsight({
      ...(row as unknown as Insight),
      bodyMarkdown: "",
    } as Insight),
  );
}

/** Homepage strip: published only, featured-first, capped — no full bodies loaded. */
export async function listHomepageInsights(limit = 3): Promise<HomepageInsightCard[]> {
  if (!hasDatabaseUrl()) return [];
  const rows = await prisma.insight.findMany({
    where: { status: published },
    orderBy: [
      { featured: "desc" },
      { publishedAt: "desc" },
      { originalPublishedAt: "desc" },
      { slug: "asc" },
    ],
    take: limit,
    select: homepageInsightSelect,
  });
  return rows.map((row) =>
    toHomepageInsightCard({
      ...(row as unknown as Insight),
      bodyMarkdown: "",
    } as Insight),
  );
}

export async function getPublishedInsightBySlug(slug: string) {
  if (!hasDatabaseUrl()) return null;
  const row = await prisma.insight.findFirst({
    where: { slug, status: published },
  });
  return row ? toPublicInsight(row) : null;
}

export async function getInsightByIdAdmin(id: string) {
  return prisma.insight.findUnique({
    where: { id },
    include: { topics: { include: { topic: true } } },
  });
}

export async function listInsightsAdmin(input?: {
  q?: string;
  status?: PublishStatus;
  category?: string;
  take?: number;
  skip?: number;
}) {
  const where: Prisma.InsightWhereInput = {};
  if (input?.status) where.status = input.status;
  if (input?.category) where.categoryLabel = input.category;
  if (input?.q) {
    where.OR = [
      { title: { contains: input.q, mode: "insensitive" } },
      { slug: { contains: input.q, mode: "insensitive" } },
    ];
  }
  const take = Math.min(input?.take ?? 50, 100);
  const skip = input?.skip ?? 0;
  const [items, total] = await Promise.all([
    prisma.insight.findMany({
      where,
      orderBy: { originalPublishedAt: "desc" },
      take,
      skip,
      select: {
        id: true,
        slug: true,
        title: true,
        categoryLabel: true,
        status: true,
        publishedAt: true,
        originalPublishedAt: true,
        updatedAt: true,
        featured: true,
      },
    }),
    prisma.insight.count({ where }),
  ]);
  return { items, total, take, skip };
}

export async function countInsightsByStatus() {
  if (!hasDatabaseUrl()) return { DRAFT: 0, PUBLISHED: 0, ARCHIVED: 0 };
  const groups = await prisma.insight.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const counts = { DRAFT: 0, PUBLISHED: 0, ARCHIVED: 0 };
  for (const g of groups) counts[g.status] = g._count._all;
  return counts;
}

export async function saveInsightDraft(input: {
  id?: string;
  data: Prisma.InsightUncheckedCreateInput | Prisma.InsightUncheckedUpdateInput;
  actorId: string;
}) {
  const row = input.id
    ? await prisma.insight.update({
        where: { id: input.id },
        data: {
          ...(input.data as Prisma.InsightUncheckedUpdateInput),
          status: "DRAFT",
          updatedById: input.actorId,
        },
      })
    : await prisma.insight.create({
        data: {
          ...(input.data as Prisma.InsightUncheckedCreateInput),
          status: "DRAFT",
          createdById: input.actorId,
          updatedById: input.actorId,
        },
      });

  await createContentRevision({
    entityType: "Insight",
    entityId: row.id,
    snapshot: JSON.parse(JSON.stringify(row)),
    createdById: input.actorId,
  });
  await writeAuditLog({
    actorId: input.actorId,
    action: "insight.save_draft",
    entityType: "Insight",
    entityId: row.id,
    metadata: { slug: row.slug },
  });
  return row;
}

export async function publishInsight(input: { id: string; actorId: string }) {
  const existing = await prisma.insight.findUniqueOrThrow({
    where: { id: input.id },
  });
  if (!existing.title.trim() || !existing.bodyMarkdown.trim()) {
    throw new Error("Title and body are required to publish.");
  }
  const row = await prisma.insight.update({
    where: { id: input.id },
    data: {
      status: published,
      publishedAt: existing.publishedAt ?? existing.originalPublishedAt,
      updatedById: input.actorId,
    },
  });
  await createContentRevision({
    entityType: "Insight",
    entityId: row.id,
    snapshot: JSON.parse(JSON.stringify(row)),
    createdById: input.actorId,
  });
  await writeAuditLog({
    actorId: input.actorId,
    action: "insight.publish",
    entityType: "Insight",
    entityId: row.id,
    metadata: { slug: row.slug },
  });
  revalidateInsight(row.slug);
  return row;
}

export async function unpublishInsight(input: {
  id: string;
  actorId: string;
}) {
  const row = await prisma.insight.update({
    where: { id: input.id },
    data: { status: "ARCHIVED", updatedById: input.actorId },
  });
  await writeAuditLog({
    actorId: input.actorId,
    action: "insight.unpublish",
    entityType: "Insight",
    entityId: row.id,
    metadata: { slug: row.slug },
  });
  revalidateInsight(row.slug);
  return row;
}

export async function changeInsightSlug(input: {
  id: string;
  newSlug: string;
  actorId: string;
}) {
  const existing = await prisma.insight.findUniqueOrThrow({
    where: { id: input.id },
  });
  const newSlug = input.newSlug.trim();
  if (newSlug === existing.slug) return existing;
  const conflict = await prisma.insight.findUnique({ where: { slug: newSlug } });
  if (conflict) throw new Error("Slug already in use");

  const oldPath = contentRoutes.blog(existing.slug);
  const newPath = contentRoutes.blog(newSlug);
  const row = await prisma.insight.update({
    where: { id: input.id },
    data: { slug: newSlug, updatedById: input.actorId },
  });

  if (existing.status === published) {
    await upsertSlugRedirect({
      sourcePath: oldPath,
      destination: newPath,
      createdById: input.actorId,
      reason: "insight-slug-change",
    });
    // Update root legacy redirect target to new canonical when present
    const legacy = await prisma.redirect.findFirst({
      where: { destination: oldPath, status: "ACTIVE" },
    });
    if (legacy) {
      await prisma.redirect.update({
        where: { id: legacy.id },
        data: { destination: newPath, reason: "insight-slug-change-legacy-retarget" },
      });
    }
  }

  await writeAuditLog({
    actorId: input.actorId,
    action: "insight.slug_change",
    entityType: "Insight",
    entityId: row.id,
    metadata: { from: existing.slug, to: newSlug },
  });
  revalidateInsight(existing.slug);
  revalidateInsight(row.slug);
  return row;
}
