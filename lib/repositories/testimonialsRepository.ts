import { hasDatabaseUrl, prisma } from "@/lib/db";
import type { Testimonial as PublicTestimonial } from "@/types";
import type { Prisma, PublishStatus, Testimonial } from "@prisma/client";
import {
  createContentRevision,
  revalidateTestimonials,
  revalidateWork,
} from "@/lib/admin/publishing";
import { writeAuditLog } from "@/lib/repositories/auditRepository";

const published: PublishStatus = "PUBLISHED";

export function toPublicTestimonial(row: Testimonial): PublicTestimonial {
  return {
    id: row.legacyId,
    name: row.name,
    company: row.company,
    role: row.role ?? undefined,
    service: row.serviceLabel ?? "",
    quote: row.quote,
    avatar: row.avatarPath ?? undefined,
    projectSlug: undefined,
    published: row.status === published && row.verified,
  };
}

export async function listPublishedTestimonials() {
  if (!hasDatabaseUrl()) return [];
  const rows = await prisma.testimonial.findMany({
    where: { status: published, verified: true },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    include: { workProject: { select: { slug: true } } },
  });
  return rows.map((row) => ({
    ...toPublicTestimonial(row),
    projectSlug: row.workProject?.slug,
  }));
}

export async function getPublishedTestimonialByLegacyId(legacyId: string) {
  if (!hasDatabaseUrl()) return null;
  const row = await prisma.testimonial.findFirst({
    where: { legacyId, status: published, verified: true },
    include: { workProject: { select: { slug: true } } },
  });
  if (!row) return null;
  return {
    ...toPublicTestimonial(row),
    projectSlug: row.workProject?.slug,
  };
}

export async function getTestimonialForWorkSlug(workSlug: string) {
  if (!hasDatabaseUrl()) return null;
  const row = await prisma.testimonial.findFirst({
    where: {
      status: published,
      verified: true,
      workProject: { slug: workSlug, status: published },
    },
  });
  return row ? toPublicTestimonial(row) : null;
}

export async function listAllTestimonialsAdmin() {
  return prisma.testimonial.findMany({
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    include: {
      workProject: { select: { id: true, slug: true, name: true, status: true } },
    },
  });
}

export async function getTestimonialByIdAdmin(id: string) {
  return prisma.testimonial.findUnique({
    where: { id },
    include: {
      workProject: { select: { id: true, slug: true, name: true, status: true } },
    },
  });
}

export async function countTestimonials() {
  if (!hasDatabaseUrl()) {
    return { DRAFT: 0, PUBLISHED: 0, ARCHIVED: 0, verified: 0 };
  }
  const [groups, verified] = await Promise.all([
    prisma.testimonial.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.testimonial.count({ where: { verified: true } }),
  ]);
  const counts = { DRAFT: 0, PUBLISHED: 0, ARCHIVED: 0, verified };
  for (const g of groups) counts[g.status] = g._count._all;
  return counts;
}

export async function saveTestimonial(input: {
  id?: string;
  data: Prisma.TestimonialUncheckedCreateInput | Prisma.TestimonialUncheckedUpdateInput;
  actorId: string;
}) {
  const data = { ...input.data } as Prisma.TestimonialUncheckedUpdateInput;
  if (data.status === published && data.verified === false) {
    throw new Error("Cannot publish an unverified testimonial.");
  }

  const row = input.id
    ? await prisma.testimonial.update({
        where: { id: input.id },
        data: { ...data, updatedById: input.actorId },
      })
    : await prisma.testimonial.create({
        data: {
          ...(input.data as Prisma.TestimonialUncheckedCreateInput),
          createdById: input.actorId,
          updatedById: input.actorId,
        },
      });

  await createContentRevision({
    entityType: "Testimonial",
    entityId: row.id,
    snapshot: {
      id: row.id,
      legacyId: row.legacyId,
      name: row.name,
      company: row.company,
      verified: row.verified,
      status: row.status,
      // intentionally omit internal notes / full quote history dump in audit path;
      // full snapshot for restore excludes nothing critical except we keep quote
      quote: row.quote,
      workProjectId: row.workProjectId,
    },
    createdById: input.actorId,
  });
  await writeAuditLog({
    actorId: input.actorId,
    action: input.id ? "testimonial.update" : "testimonial.create",
    entityType: "Testimonial",
    entityId: row.id,
    metadata: {
      legacyId: row.legacyId,
      verified: row.verified,
      status: row.status,
    },
  });
  revalidateTestimonials();
  return row;
}

export async function publishTestimonial(input: {
  id: string;
  actorId: string;
}) {
  const existing = await prisma.testimonial.findUniqueOrThrow({
    where: { id: input.id },
    include: { workProject: true },
  });
  if (!existing.verified) {
    throw new Error("Only verified testimonials can be published.");
  }
  const row = await prisma.testimonial.update({
    where: { id: input.id },
    data: {
      status: published,
      publishedAt: existing.publishedAt ?? new Date(),
      updatedById: input.actorId,
    },
  });
  await writeAuditLog({
    actorId: input.actorId,
    action: "testimonial.publish",
    entityType: "Testimonial",
    entityId: row.id,
    metadata: { legacyId: row.legacyId },
  });
  revalidateTestimonials();
  if (existing.workProject?.slug) revalidateWork(existing.workProject.slug);
  return row;
}

export async function unpublishTestimonial(input: {
  id: string;
  actorId: string;
}) {
  const existing = await prisma.testimonial.findUniqueOrThrow({
    where: { id: input.id },
    include: { workProject: true },
  });
  const row = await prisma.testimonial.update({
    where: { id: input.id },
    data: { status: "ARCHIVED", updatedById: input.actorId },
  });
  await writeAuditLog({
    actorId: input.actorId,
    action: "testimonial.unpublish",
    entityType: "Testimonial",
    entityId: row.id,
    metadata: { legacyId: row.legacyId },
  });
  revalidateTestimonials();
  if (existing.workProject?.slug) revalidateWork(existing.workProject.slug);
  return row;
}

export async function setTestimonialVerified(input: {
  id: string;
  verified: boolean;
  actorId: string;
  note?: string;
}) {
  const row = await prisma.testimonial.update({
    where: { id: input.id },
    data: {
      verified: input.verified,
      internalVerificationNote: input.note,
      // unverified cannot remain published
      status: input.verified ? undefined : "DRAFT",
      updatedById: input.actorId,
    },
  });
  await writeAuditLog({
    actorId: input.actorId,
    action: "testimonial.verified_change",
    entityType: "Testimonial",
    entityId: row.id,
    metadata: { verified: input.verified },
  });
  return row;
}
