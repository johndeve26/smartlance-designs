import { hasDatabaseUrl, prisma } from "@/lib/db";
import type { Platform, Prisma, PublishStatus } from "@prisma/client";
import { toPublicPlatform } from "@/lib/repositories/mappers";
import {
  createContentRevision,
  revalidatePlatform,
} from "@/lib/admin/publishing";
import { writeAuditLog } from "@/lib/repositories/auditRepository";
import { upsertSlugRedirect } from "@/lib/repositories/redirectsRepository";

const published: PublishStatus = "PUBLISHED";

export async function listPublishedPlatforms() {
  if (!hasDatabaseUrl()) return [];
  const rows = await prisma.platform.findMany({
    where: { status: published },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });
  return rows.map(toPublicPlatform);
}

export async function listAllPlatformsAdmin() {
  return prisma.platform.findMany({
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });
}

export async function getPublishedPlatformBySlug(slug: string) {
  if (!hasDatabaseUrl()) return null;
  const row = await prisma.platform.findFirst({
    where: { slug, status: published },
  });
  return row ? toPublicPlatform(row) : null;
}

export async function getPlatformByIdAdmin(id: string) {
  return prisma.platform.findUnique({ where: { id } });
}

export async function getPlatformBySlugAdmin(slug: string) {
  return prisma.platform.findUnique({ where: { slug } });
}

export async function getPlatformForPreview(id: string) {
  const row = await prisma.platform.findUnique({ where: { id } });
  return row ? toPublicPlatform(row) : null;
}

export async function getPublishedPlatformBySlugPublic(slug: string) {
  return getPublishedPlatformBySlug(slug);
}

export async function countPlatformsByStatus() {
  const groups = await prisma.platform.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const counts = { DRAFT: 0, PUBLISHED: 0, ARCHIVED: 0 };
  for (const g of groups) {
    counts[g.status] = g._count._all;
  }
  return counts;
}

function snapshot(row: Platform): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(row)) as Prisma.InputJsonValue;
}

export async function savePlatformDraft(input: {
  id?: string;
  data: Prisma.PlatformUncheckedCreateInput | Prisma.PlatformUncheckedUpdateInput;
  actorId: string;
}) {
  const row = input.id
    ? await prisma.platform.update({
        where: { id: input.id },
        data: {
          ...(input.data as Prisma.PlatformUncheckedUpdateInput),
          status: "DRAFT",
          updatedById: input.actorId,
        },
      })
    : await prisma.platform.create({
        data: {
          ...(input.data as Prisma.PlatformUncheckedCreateInput),
          status: "DRAFT",
          createdById: input.actorId,
          updatedById: input.actorId,
        },
      });
  await createContentRevision({
    entityType: "Platform",
    entityId: row.id,
    snapshot: snapshot(row),
    createdById: input.actorId,
  });
  await writeAuditLog({
    actorId: input.actorId,
    action: "platform.save_draft",
    entityType: "Platform",
    entityId: row.id,
    metadata: { slug: row.slug },
  });
  return row;
}

export async function publishPlatform(input: { id: string; actorId: string }) {
  const row = await prisma.platform.update({
    where: { id: input.id },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
      updatedById: input.actorId,
    },
  });
  await createContentRevision({
    entityType: "Platform",
    entityId: row.id,
    snapshot: snapshot(row),
    createdById: input.actorId,
  });
  await writeAuditLog({
    actorId: input.actorId,
    action: "platform.publish",
    entityType: "Platform",
    entityId: row.id,
    metadata: { slug: row.slug },
  });
  revalidatePlatform(row.slug, row.href);
  return row;
}

export async function unpublishPlatform(input: {
  id: string;
  actorId: string;
}) {
  const row = await prisma.platform.update({
    where: { id: input.id },
    data: { status: "ARCHIVED", updatedById: input.actorId },
  });
  await createContentRevision({
    entityType: "Platform",
    entityId: row.id,
    snapshot: snapshot(row),
    createdById: input.actorId,
  });
  await writeAuditLog({
    actorId: input.actorId,
    action: "platform.unpublish",
    entityType: "Platform",
    entityId: row.id,
    metadata: { slug: row.slug },
  });
  revalidatePlatform(row.slug, row.href);
  return row;
}

export async function changePlatformSlug(input: {
  id: string;
  newSlug: string;
  actorId: string;
}) {
  const existing = await prisma.platform.findUniqueOrThrow({
    where: { id: input.id },
  });
  const newSlug = input.newSlug.trim();
  if (newSlug === existing.slug) return existing;

  const conflict = await prisma.platform.findUnique({
    where: { slug: newSlug },
  });
  if (conflict) throw new Error("Slug already in use");

  const oldHref = existing.href;
  const newHref = `/platforms/${newSlug}`;

  const row = await prisma.platform.update({
    where: { id: input.id },
    data: {
      slug: newSlug,
      href: newHref,
      updatedById: input.actorId,
    },
  });

  if (existing.status === "PUBLISHED") {
    await upsertSlugRedirect({
      sourcePath: oldHref,
      destination: newHref,
      createdById: input.actorId,
      reason: "platform-slug-change",
    });
  }

  await writeAuditLog({
    actorId: input.actorId,
    action: "platform.slug_change",
    entityType: "Platform",
    entityId: row.id,
    metadata: { from: existing.slug, to: newSlug },
  });

  revalidatePlatform(existing.slug, oldHref);
  revalidatePlatform(row.slug, row.href);
  return row;
}
