import { hasDatabaseUrl, prisma } from "@/lib/db";
import type { Project, ProjectCategory } from "@/types";
import type { Prisma, PublishStatus, WorkProject } from "@prisma/client";
import {
  createContentRevision,
  revalidateWork,
} from "@/lib/admin/publishing";
import { writeAuditLog } from "@/lib/repositories/auditRepository";
import { upsertSlugRedirect } from "@/lib/repositories/redirectsRepository";
import { contentRoutes } from "@/lib/content-routes";

const published: PublishStatus = "PUBLISHED";

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asOptionalArray<T>(value: unknown): T[] | undefined {
  if (value == null) return undefined;
  return Array.isArray(value) ? (value as T[]) : undefined;
}

export function toPublicProject(row: WorkProject): Project {
  return {
    slug: row.slug,
    name: row.name,
    title: row.title ?? undefined,
    client: row.clientName ?? undefined,
    industry: row.industryLabel,
    projectType: row.projectType ?? undefined,
    services: asArray<ProjectCategory>(row.servicesLabels),
    challenge: row.challenge,
    solution: row.solution,
    published: row.status === published,
    shortDescription: row.shortDescription ?? undefined,
    overview: row.overview ?? undefined,
    approach: row.approach ?? undefined,
    designNotes: row.designNotes ?? undefined,
    developmentNotes: row.developmentNotes ?? undefined,
    seoNotes: row.seoNotes ?? undefined,
    resultSummary: row.resultSummary ?? undefined,
    results: asOptionalArray(row.results),
    measurableResults: asOptionalArray(row.measurableResults),
    goals: asOptionalArray(row.goals),
    technologies: asOptionalArray(row.technologies),
    platform: row.platformLabel ?? undefined,
    platforms: asOptionalArray(row.platformsLabels),
    websiteUrl: row.websiteUrl ?? undefined,
    oldUrl: row.oldUrl ?? undefined,
    year: row.year ?? undefined,
    image: row.coverImagePath ?? undefined,
    imageAlt: row.coverImageAlt ?? undefined,
    heroImage: row.heroImagePath ?? undefined,
    heroImageAlt: row.heroImageAlt ?? undefined,
    gallery: asOptionalArray(row.gallery),
    featured: row.featured || undefined,
    relatedSlugs: asOptionalArray(row.relatedWorkSlugs),
    relatedServiceHrefs: asOptionalArray(row.relatedServiceHrefs),
    metaTitle: row.seoTitle,
    metaDescription: row.seoDescription,
    noIndex: row.noIndex,
    canonicalOverride: row.canonicalOverride,
    ogImagePath: row.ogImagePath || row.coverImagePath,
    heroStatement: row.heroStatement ?? undefined,
    challenges: asOptionalArray(row.challenges),
    approachSteps: asOptionalArray(row.approachSteps),
    solutionPoints: asOptionalArray(row.solutionPoints),
    highlights: asOptionalArray(row.highlights),
    platformContext: row.platformContext ?? undefined,
    outcomeHeading: row.outcomeHeading ?? undefined,
  };
}

export async function listPublishedWork() {
  if (!hasDatabaseUrl()) return [];
  const rows = await prisma.workProject.findMany({
    where: { status: published },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });
  return rows.map(toPublicProject);
}

export async function getPublishedWorkBySlug(slug: string) {
  if (!hasDatabaseUrl()) return null;
  const row = await prisma.workProject.findFirst({
    where: { slug, status: published },
  });
  return row ? toPublicProject(row) : null;
}

export async function getWorkByIdAdmin(id: string) {
  return prisma.workProject.findUnique({
    where: { id },
    include: {
      testimonials: true,
      industryLinks: { include: { industry: true } },
      platform: true,
    },
  });
}

export async function listAllWorkAdmin() {
  return prisma.workProject.findMany({
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    include: {
      industryLinks: { include: { industry: { select: { name: true, slug: true } } } },
    },
  });
}

export async function countWorkByStatus() {
  if (!hasDatabaseUrl()) return { DRAFT: 0, PUBLISHED: 0, ARCHIVED: 0 };
  const groups = await prisma.workProject.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const counts = { DRAFT: 0, PUBLISHED: 0, ARCHIVED: 0 };
  for (const g of groups) counts[g.status] = g._count._all;
  return counts;
}

export async function saveWorkDraft(input: {
  id?: string;
  data: Prisma.WorkProjectUncheckedCreateInput | Prisma.WorkProjectUncheckedUpdateInput;
  industryIds?: string[];
  actorId: string;
}) {
  const row = input.id
    ? await prisma.workProject.update({
        where: { id: input.id },
        data: {
          ...(input.data as Prisma.WorkProjectUncheckedUpdateInput),
          status: "DRAFT",
          updatedById: input.actorId,
        },
      })
    : await prisma.workProject.create({
        data: {
          ...(input.data as Prisma.WorkProjectUncheckedCreateInput),
          status: "DRAFT",
          createdById: input.actorId,
          updatedById: input.actorId,
        },
      });

  if (input.industryIds) {
    await prisma.industryWork.deleteMany({ where: { workId: row.id } });
    if (input.industryIds.length) {
      await prisma.industryWork.createMany({
        data: input.industryIds.map((industryId, sortOrder) => ({
          industryId,
          workId: row.id,
          sortOrder,
        })),
      });
    }
  }

  await createContentRevision({
    entityType: "WorkProject",
    entityId: row.id,
    snapshot: JSON.parse(JSON.stringify(row)),
    createdById: input.actorId,
  });
  await writeAuditLog({
    actorId: input.actorId,
    action: "work.save_draft",
    entityType: "WorkProject",
    entityId: row.id,
    metadata: { slug: row.slug },
  });
  return row;
}

export async function publishWork(input: { id: string; actorId: string }) {
  const existing = await prisma.workProject.findUniqueOrThrow({
    where: { id: input.id },
  });
  if (!existing.coverImagePath && !existing.heroImagePath) {
    throw new Error("Cover or hero image reference is required to publish.");
  }
  const row = await prisma.workProject.update({
    where: { id: input.id },
    data: {
      status: published,
      publishedAt: existing.publishedAt ?? new Date(),
      updatedById: input.actorId,
    },
  });
  await createContentRevision({
    entityType: "WorkProject",
    entityId: row.id,
    snapshot: JSON.parse(JSON.stringify(row)),
    createdById: input.actorId,
  });
  await writeAuditLog({
    actorId: input.actorId,
    action: "work.publish",
    entityType: "WorkProject",
    entityId: row.id,
    metadata: { slug: row.slug },
  });
  revalidateWork(row.slug);
  return row;
}

export async function unpublishWork(input: { id: string; actorId: string }) {
  const row = await prisma.workProject.update({
    where: { id: input.id },
    data: { status: "ARCHIVED", updatedById: input.actorId },
  });
  await writeAuditLog({
    actorId: input.actorId,
    action: "work.unpublish",
    entityType: "WorkProject",
    entityId: row.id,
    metadata: { slug: row.slug },
  });
  revalidateWork(row.slug);
  return row;
}

export async function changeWorkSlug(input: {
  id: string;
  newSlug: string;
  actorId: string;
}) {
  const existing = await prisma.workProject.findUniqueOrThrow({
    where: { id: input.id },
  });
  const newSlug = input.newSlug.trim();
  if (newSlug === existing.slug) return existing;
  const conflict = await prisma.workProject.findUnique({ where: { slug: newSlug } });
  if (conflict) throw new Error("Slug already in use");

  const oldPath = contentRoutes.work(existing.slug);
  const newPath = contentRoutes.work(newSlug);
  const row = await prisma.workProject.update({
    where: { id: input.id },
    data: { slug: newSlug, updatedById: input.actorId },
  });
  if (existing.status === published) {
    await upsertSlugRedirect({
      sourcePath: oldPath,
      destination: newPath,
      createdById: input.actorId,
      reason: "work-slug-change",
    });
  }
  await writeAuditLog({
    actorId: input.actorId,
    action: "work.slug_change",
    entityType: "WorkProject",
    entityId: row.id,
    metadata: { from: existing.slug, to: newSlug },
  });
  revalidateWork(existing.slug);
  revalidateWork(row.slug);
  return row;
}
