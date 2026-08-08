import { hasDatabaseUrl, prisma } from "@/lib/db";
import type { Industry as PublicIndustry, IndustryPublicDetail } from "@/types";
import type { Prisma, PublishStatus } from "@prisma/client";
import {
  createContentRevision,
  revalidateIndustries,
} from "@/lib/admin/publishing";
import { writeAuditLog } from "@/lib/repositories/auditRepository";
import { industriesCatalog } from "@/data/industries";

const published: PublishStatus = "PUBLISHED";

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function catalogToDetail(item: PublicIndustry): IndustryPublicDetail {
  return {
    ...item,
    hasVerifiedProjectExperience:
      item.group === "proven" && Boolean(item.projectSlugs?.length),
    relatedSolutionSlugs: [],
  };
}

export function toPublicIndustry(
  row: {
    slug: string;
    name: string;
    description: string;
    icon: string;
    group: "proven" | "supported";
    featured: boolean;
    relatedServiceLinks: unknown;
    workLinks?: { work: { slug: string; status: PublishStatus } }[];
  },
  opts?: { includeDraftWork?: boolean },
): PublicIndustry {
  const projectSlugs = (row.workLinks ?? [])
    .filter((link) =>
      opts?.includeDraftWork ? true : link.work.status === published,
    )
    .map((link) => link.work.slug);

  return {
    slug: row.slug,
    name: row.name,
    description: row.description,
    icon: row.icon,
    group: row.group,
    featured: row.featured || undefined,
    projectSlugs: projectSlugs.length ? projectSlugs : undefined,
    relatedServices: asArray(row.relatedServiceLinks),
  };
}

export function toPublicIndustryDetail(row: {
  slug: string;
  name: string;
  description: string;
  icon: string;
  group: "proven" | "supported";
  featured: boolean;
  hasVerifiedProjectExperience: boolean;
  relatedServiceLinks: unknown;
  relatedSolutionSlugs?: unknown;
  seoTitle?: string | null;
  seoDescription?: string | null;
  noIndex?: boolean;
  canonicalOverride?: string | null;
  ogImagePath?: string | null;
  workLinks?: { work: { slug: string; status: PublishStatus } }[];
}): IndustryPublicDetail {
  const base = toPublicIndustry(row);
  return {
    ...base,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    noIndex: row.noIndex,
    canonicalOverride: row.canonicalOverride,
    ogImagePath: row.ogImagePath,
    hasVerifiedProjectExperience: row.hasVerifiedProjectExperience,
    relatedSolutionSlugs: asArray<string>(row.relatedSolutionSlugs),
  };
}

export async function getPublishedIndustryBySlug(slug: string) {
  if (!hasDatabaseUrl()) {
    const item = industriesCatalog.find((i) => i.slug === slug);
    return item ? catalogToDetail(item) : null;
  }
  const row = await prisma.industry.findFirst({
    where: { slug, status: published },
    include: {
      workLinks: {
        orderBy: { sortOrder: "asc" },
        include: { work: { select: { slug: true, status: true } } },
      },
    },
  });
  if (row) return toPublicIndustryDetail(row);
  const probe = await prisma.industry.count({ where: { status: published } });
  if (!probe) {
    const item = industriesCatalog.find((i) => i.slug === slug);
    return item ? catalogToDetail(item) : null;
  }
  return null;
}

export async function listPublishedIndustries() {
  if (!hasDatabaseUrl()) return [];
  const rows = await prisma.industry.findMany({
    where: { status: published },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    include: {
      workLinks: {
        orderBy: { sortOrder: "asc" },
        include: { work: { select: { slug: true, status: true } } },
      },
    },
  });
  return rows.map((row) => toPublicIndustry(row));
}

export async function listAllIndustriesAdmin() {
  return prisma.industry.findMany({
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    include: {
      workLinks: {
        include: { work: { select: { id: true, slug: true, name: true, status: true } } },
      },
    },
  });
}

export async function getIndustryByIdAdmin(id: string) {
  return prisma.industry.findUnique({
    where: { id },
    include: {
      workLinks: {
        include: { work: { select: { id: true, slug: true, name: true, status: true } } },
      },
    },
  });
}

export async function countIndustriesByStatus() {
  if (!hasDatabaseUrl()) return { DRAFT: 0, PUBLISHED: 0, ARCHIVED: 0 };
  const groups = await prisma.industry.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const counts = { DRAFT: 0, PUBLISHED: 0, ARCHIVED: 0 };
  for (const g of groups) counts[g.status] = g._count._all;
  return counts;
}

export async function saveIndustry(input: {
  id?: string;
  data: Prisma.IndustryUncheckedCreateInput | Prisma.IndustryUncheckedUpdateInput;
  workIds?: string[];
  actorId: string;
}) {
  const workIds = input.workIds ?? [];
  const hasVerified =
    Boolean(
      (input.data as { hasVerifiedProjectExperience?: boolean })
        .hasVerifiedProjectExperience,
    ) || false;

  if (hasVerified && workIds.length === 0) {
    throw new Error(
      "Verified project experience requires at least one related Work item.",
    );
  }

  const row = input.id
    ? await prisma.industry.update({
        where: { id: input.id },
        data: {
          ...(input.data as Prisma.IndustryUncheckedUpdateInput),
          updatedById: input.actorId,
        },
      })
    : await prisma.industry.create({
        data: {
          ...(input.data as Prisma.IndustryUncheckedCreateInput),
          createdById: input.actorId,
          updatedById: input.actorId,
        },
      });

  if (input.workIds) {
    await prisma.industryWork.deleteMany({ where: { industryId: row.id } });
    if (workIds.length) {
      await prisma.industryWork.createMany({
        data: workIds.map((workId, sortOrder) => ({
          industryId: row.id,
          workId,
          sortOrder,
        })),
      });
    }
  }

  await createContentRevision({
    entityType: "Industry",
    entityId: row.id,
    snapshot: JSON.parse(JSON.stringify(row)),
    createdById: input.actorId,
  });
  await writeAuditLog({
    actorId: input.actorId,
    action: input.id ? "industry.update" : "industry.create",
    entityType: "Industry",
    entityId: row.id,
    metadata: { slug: row.slug },
  });
  revalidateIndustries(row.slug);
  return row;
}

export async function publishIndustry(input: { id: string; actorId: string }) {
  const current = await prisma.industry.findUniqueOrThrow({
    where: { id: input.id },
    include: { workLinks: { include: { work: true } } },
  });
  if (
    current.hasVerifiedProjectExperience &&
    !current.workLinks.some((l) => l.work.status === published)
  ) {
    throw new Error(
      "Cannot publish verified-experience Industry without a published Work relation.",
    );
  }
  const row = await prisma.industry.update({
    where: { id: input.id },
    data: {
      status: published,
      publishedAt: new Date(),
      updatedById: input.actorId,
    },
  });
  await writeAuditLog({
    actorId: input.actorId,
    action: "industry.publish",
    entityType: "Industry",
    entityId: row.id,
    metadata: { slug: row.slug },
  });
  revalidateIndustries(row.slug);
  return row;
}

export async function unpublishIndustry(input: {
  id: string;
  actorId: string;
}) {
  const row = await prisma.industry.update({
    where: { id: input.id },
    data: { status: "ARCHIVED", updatedById: input.actorId },
  });
  await writeAuditLog({
    actorId: input.actorId,
    action: "industry.unpublish",
    entityType: "Industry",
    entityId: row.id,
    metadata: { slug: row.slug },
  });
  revalidateIndustries(row.slug);
  return row;
}
