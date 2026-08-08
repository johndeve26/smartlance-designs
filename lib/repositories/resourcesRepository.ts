import { hasDatabaseUrl, prisma } from "@/lib/db";
import type { CmsResource, Prisma, PublishStatus, ResourceKind } from "@prisma/client";
import {
  createContentRevision,
  revalidateCmsResource,
} from "@/lib/admin/publishing";
import { writeAuditLog } from "@/lib/repositories/auditRepository";
import { upsertSlugRedirect } from "@/lib/repositories/redirectsRepository";
import { resourceHref } from "@/lib/content-routes";

const published: PublishStatus = "PUBLISHED";

export async function listPublishedResourcesByType(type: ResourceKind) {
  if (!hasDatabaseUrl()) return [];
  return prisma.cmsResource.findMany({
    where: { type, status: published },
    orderBy: [{ featuredOrder: "asc" }, { title: "asc" }],
  });
}

export async function getPublishedResourceBySlug(
  type: ResourceKind,
  slug: string,
) {
  if (!hasDatabaseUrl()) return null;
  return prisma.cmsResource.findFirst({
    where: { type, slug, status: published },
  });
}

export async function listResourcesAdmin(type?: ResourceKind) {
  return prisma.cmsResource.findMany({
    where: type ? { type } : undefined,
    orderBy: [{ type: "asc" }, { title: "asc" }],
  });
}

export async function getResourceByIdAdmin(id: string) {
  return prisma.cmsResource.findUnique({
    where: { id },
    include: { topics: { include: { topic: true } } },
  });
}

export async function countResourcesByType() {
  if (!hasDatabaseUrl()) {
    return {} as Record<ResourceKind, { DRAFT: number; PUBLISHED: number; ARCHIVED: number }>;
  }
  const rows = await prisma.cmsResource.groupBy({
    by: ["type", "status"],
    _count: { _all: true },
  });
  const result = {} as Record<
    ResourceKind,
    { DRAFT: number; PUBLISHED: number; ARCHIVED: number }
  >;
  for (const row of rows) {
    if (!result[row.type]) {
      result[row.type] = { DRAFT: 0, PUBLISHED: 0, ARCHIVED: 0 };
    }
    result[row.type][row.status] = row._count._all;
  }
  return result;
}

export function resourcePayload<T>(row: CmsResource): T {
  return row.payload as T;
}

export async function saveResourceDraft(input: {
  id?: string;
  data: Prisma.CmsResourceUncheckedCreateInput | Prisma.CmsResourceUncheckedUpdateInput;
  actorId: string;
}) {
  const row = input.id
    ? await prisma.cmsResource.update({
        where: { id: input.id },
        data: {
          ...(input.data as Prisma.CmsResourceUncheckedUpdateInput),
          status: "DRAFT",
          updatedById: input.actorId,
        },
      })
    : await prisma.cmsResource.create({
        data: {
          ...(input.data as Prisma.CmsResourceUncheckedCreateInput),
          status: "DRAFT",
          createdById: input.actorId,
          updatedById: input.actorId,
        },
      });

  await createContentRevision({
    entityType: "CmsResource",
    entityId: row.id,
    snapshot: JSON.parse(JSON.stringify(row)),
    createdById: input.actorId,
  });
  await writeAuditLog({
    actorId: input.actorId,
    action: "resource.save_draft",
    entityType: "CmsResource",
    entityId: row.id,
    metadata: { type: row.type, slug: row.slug },
  });
  return row;
}

export async function publishResource(input: { id: string; actorId: string }) {
  const existing = await prisma.cmsResource.findUniqueOrThrow({
    where: { id: input.id },
  });
  if (!existing.title.trim() || !existing.payload) {
    throw new Error("Title and subtype content are required.");
  }
  const row = await prisma.cmsResource.update({
    where: { id: input.id },
    data: {
      status: published,
      publishedAt: existing.publishedAt ?? new Date(),
      updatedById: input.actorId,
    },
  });
  await createContentRevision({
    entityType: "CmsResource",
    entityId: row.id,
    snapshot: JSON.parse(JSON.stringify(row)),
    createdById: input.actorId,
  });
  await writeAuditLog({
    actorId: input.actorId,
    action: "resource.publish",
    entityType: "CmsResource",
    entityId: row.id,
    metadata: { type: row.type, slug: row.slug },
  });
  revalidateCmsResource(row.type, row.slug, row.href);
  return row;
}

export async function unpublishResource(input: {
  id: string;
  actorId: string;
}) {
  const row = await prisma.cmsResource.update({
    where: { id: input.id },
    data: { status: "ARCHIVED", updatedById: input.actorId },
  });
  await writeAuditLog({
    actorId: input.actorId,
    action: "resource.unpublish",
    entityType: "CmsResource",
    entityId: row.id,
    metadata: { type: row.type, slug: row.slug },
  });
  revalidateCmsResource(row.type, row.slug, row.href);
  return row;
}

export async function changeResourceSlug(input: {
  id: string;
  newSlug: string;
  actorId: string;
}) {
  const existing = await prisma.cmsResource.findUniqueOrThrow({
    where: { id: input.id },
  });
  const newSlug = input.newSlug.trim();
  if (newSlug === existing.slug) return existing;
  const conflict = await prisma.cmsResource.findUnique({
    where: { type_slug: { type: existing.type, slug: newSlug } },
  });
  if (conflict) throw new Error("Slug already in use for this resource type");

  const oldHref = existing.href;
  const newHref = resourceHref(existing.type, newSlug);
  const row = await prisma.cmsResource.update({
    where: { id: input.id },
    data: {
      slug: newSlug,
      href: newHref,
      updatedById: input.actorId,
    },
  });

  if (existing.status === published) {
    await upsertSlugRedirect({
      sourcePath: oldHref,
      destination: newHref,
      createdById: input.actorId,
      reason: `${existing.type}-slug-change`,
    });
  }

  await writeAuditLog({
    actorId: input.actorId,
    action: "resource.slug_change",
    entityType: "CmsResource",
    entityId: row.id,
    metadata: { type: row.type, from: existing.slug, to: newSlug },
  });
  revalidateCmsResource(existing.type, existing.slug, oldHref);
  revalidateCmsResource(row.type, row.slug, row.href);
  return row;
}
