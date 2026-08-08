import { hasDatabaseUrl, prisma } from "@/lib/db";
import type { Prisma, PublishStatus, Service } from "@prisma/client";
import { toPublicService } from "@/lib/repositories/mappers";
import {
  createContentRevision,
  revalidateService,
} from "@/lib/admin/publishing";
import { writeAuditLog } from "@/lib/repositories/auditRepository";
import { upsertSlugRedirect } from "@/lib/repositories/redirectsRepository";

const published: PublishStatus = "PUBLISHED";

export async function listPublishedServices() {
  if (!hasDatabaseUrl()) return [];
  const rows = await prisma.service.findMany({
    where: { status: published },
    orderBy: [{ displayOrder: "asc" }, { title: "asc" }],
  });
  return rows.map(toPublicService);
}

export async function listAllServicesAdmin() {
  return prisma.service.findMany({
    orderBy: [{ displayOrder: "asc" }, { title: "asc" }],
  });
}

export async function getPublishedServiceBySlug(slug: string) {
  if (!hasDatabaseUrl()) return null;
  const row = await prisma.service.findFirst({
    where: { slug, status: published },
  });
  return row ? toPublicService(row) : null;
}

export async function getServiceBySlugAdmin(slug: string) {
  return prisma.service.findUnique({ where: { slug } });
}

export async function getServiceByIdAdmin(id: string) {
  return prisma.service.findUnique({ where: { id } });
}

export async function getServiceForPreview(id: string) {
  const row = await prisma.service.findUnique({ where: { id } });
  return row ? toPublicService(row) : null;
}

export async function getRelatedPublishedServices(slugs: string[]) {
  if (!slugs.length || !hasDatabaseUrl()) return [];
  const rows = await prisma.service.findMany({
    where: { slug: { in: slugs }, status: published },
  });
  const map = new Map(rows.map((r) => [r.slug, toPublicService(r)]));
  return slugs.map((s) => map.get(s)).filter(Boolean) as ReturnType<
    typeof toPublicService
  >[];
}

export async function countServicesByStatus() {
  const groups = await prisma.service.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const counts = { DRAFT: 0, PUBLISHED: 0, ARCHIVED: 0 };
  for (const g of groups) {
    counts[g.status] = g._count._all;
  }
  return counts;
}

export type ServiceWriteInput = Omit<
  Prisma.ServiceCreateInput,
  "createdBy" | "updatedBy" | "id"
> & {
  id?: string;
};

function snapshotService(row: Service): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(row)) as Prisma.InputJsonValue;
}

export async function saveServiceDraft(input: {
  id?: string;
  data: Prisma.ServiceUncheckedCreateInput | Prisma.ServiceUncheckedUpdateInput;
  actorId: string;
}) {
  let row: Service;
  if (input.id) {
    row = await prisma.service.update({
      where: { id: input.id },
      data: {
        ...input.data,
        status: "DRAFT",
        updatedById: input.actorId,
      } as Prisma.ServiceUncheckedUpdateInput,
    });
  } else {
    row = await prisma.service.create({
      data: {
        ...(input.data as Prisma.ServiceUncheckedCreateInput),
        status: "DRAFT",
        createdById: input.actorId,
        updatedById: input.actorId,
      },
    });
  }

  await createContentRevision({
    entityType: "Service",
    entityId: row.id,
    snapshot: snapshotService(row),
    createdById: input.actorId,
  });
  await writeAuditLog({
    actorId: input.actorId,
    action: "service.save_draft",
    entityType: "Service",
    entityId: row.id,
    metadata: { slug: row.slug },
  });
  return row;
}

export async function publishService(input: {
  id: string;
  actorId: string;
}) {
  const row = await prisma.service.update({
    where: { id: input.id },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
      updatedById: input.actorId,
    },
  });
  await createContentRevision({
    entityType: "Service",
    entityId: row.id,
    snapshot: snapshotService(row),
    createdById: input.actorId,
  });
  await writeAuditLog({
    actorId: input.actorId,
    action: "service.publish",
    entityType: "Service",
    entityId: row.id,
    metadata: { slug: row.slug },
  });
  revalidateService(row.slug, row.href);
  return row;
}

export async function unpublishService(input: {
  id: string;
  actorId: string;
}) {
  const row = await prisma.service.update({
    where: { id: input.id },
    data: {
      status: "ARCHIVED",
      updatedById: input.actorId,
    },
  });
  await createContentRevision({
    entityType: "Service",
    entityId: row.id,
    snapshot: snapshotService(row),
    createdById: input.actorId,
  });
  await writeAuditLog({
    actorId: input.actorId,
    action: "service.unpublish",
    entityType: "Service",
    entityId: row.id,
    metadata: { slug: row.slug },
  });
  revalidateService(row.slug, row.href);
  return row;
}

export async function changeServiceSlug(input: {
  id: string;
  newSlug: string;
  actorId: string;
}) {
  const existing = await prisma.service.findUniqueOrThrow({
    where: { id: input.id },
  });
  const newSlug = input.newSlug.trim();
  if (newSlug === existing.slug) return existing;

  const conflict = await prisma.service.findUnique({ where: { slug: newSlug } });
  if (conflict) throw new Error("Slug already in use");

  const oldHref = existing.href;
  const newHref = `/services/${newSlug}`;

  const row = await prisma.service.update({
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
      reason: "service-slug-change",
    });
  }

  await writeAuditLog({
    actorId: input.actorId,
    action: "service.slug_change",
    entityType: "Service",
    entityId: row.id,
    metadata: { from: existing.slug, to: newSlug },
  });

  revalidateService(existing.slug, oldHref);
  revalidateService(row.slug, row.href);
  return row;
}
