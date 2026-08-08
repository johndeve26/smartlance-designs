import { hasDatabaseUrl, prisma } from "@/lib/db";
import type { Prisma, PublishStatus, Solution } from "@prisma/client";
import { toPublicSolution } from "@/lib/repositories/mappers";
import {
  createContentRevision,
  revalidateSolution,
} from "@/lib/admin/publishing";
import { writeAuditLog } from "@/lib/repositories/auditRepository";
import { upsertSlugRedirect } from "@/lib/repositories/redirectsRepository";

const published: PublishStatus = "PUBLISHED";

export async function listPublishedSolutions() {
  if (!hasDatabaseUrl()) return [];
  const rows = await prisma.solution.findMany({
    where: { status: published },
    orderBy: [{ displayOrder: "asc" }, { title: "asc" }],
  });
  return rows.map(toPublicSolution);
}

export async function listAllSolutionsAdmin() {
  return prisma.solution.findMany({
    orderBy: [{ displayOrder: "asc" }, { title: "asc" }],
  });
}

export async function getPublishedSolutionBySlug(slug: string) {
  if (!hasDatabaseUrl()) return null;
  const row = await prisma.solution.findFirst({
    where: { slug, status: published },
  });
  return row ? toPublicSolution(row) : null;
}

export async function getSolutionByIdAdmin(id: string) {
  return prisma.solution.findUnique({ where: { id } });
}

export async function getSolutionBySlugAdmin(slug: string) {
  return prisma.solution.findUnique({ where: { slug } });
}

export async function getSolutionPageContentBySlug(slug: string) {
  if (!hasDatabaseUrl()) return null;
  const row = await prisma.solution.findFirst({
    where: { slug, status: published },
    select: { pageKind: true, pageContent: true },
  });
  if (!row?.pageContent) return null;
  return row.pageContent as Record<string, unknown>;
}

export async function getSolutionForPreview(id: string) {
  const row = await prisma.solution.findUnique({ where: { id } });
  if (!row) return null;
  return {
    solution: toPublicSolution(row),
    pageContent: row.pageContent as Record<string, unknown> | null,
    pageKind: row.pageKind,
  };
}

export async function countSolutionsByStatus() {
  const groups = await prisma.solution.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const counts = { DRAFT: 0, PUBLISHED: 0, ARCHIVED: 0 };
  for (const g of groups) {
    counts[g.status] = g._count._all;
  }
  return counts;
}

function snapshot(row: Solution): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(row)) as Prisma.InputJsonValue;
}

export async function saveSolutionDraft(input: {
  id?: string;
  data: Prisma.SolutionUncheckedCreateInput | Prisma.SolutionUncheckedUpdateInput;
  actorId: string;
}) {
  const row = input.id
    ? await prisma.solution.update({
        where: { id: input.id },
        data: {
          ...(input.data as Prisma.SolutionUncheckedUpdateInput),
          status: "DRAFT",
          updatedById: input.actorId,
        },
      })
    : await prisma.solution.create({
        data: {
          ...(input.data as Prisma.SolutionUncheckedCreateInput),
          status: "DRAFT",
          createdById: input.actorId,
          updatedById: input.actorId,
        },
      });
  await createContentRevision({
    entityType: "Solution",
    entityId: row.id,
    snapshot: snapshot(row),
    createdById: input.actorId,
  });
  await writeAuditLog({
    actorId: input.actorId,
    action: "solution.save_draft",
    entityType: "Solution",
    entityId: row.id,
    metadata: { slug: row.slug },
  });
  return row;
}

export async function publishSolution(input: { id: string; actorId: string }) {
  const row = await prisma.solution.update({
    where: { id: input.id },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
      updatedById: input.actorId,
    },
  });
  await createContentRevision({
    entityType: "Solution",
    entityId: row.id,
    snapshot: snapshot(row),
    createdById: input.actorId,
  });
  await writeAuditLog({
    actorId: input.actorId,
    action: "solution.publish",
    entityType: "Solution",
    entityId: row.id,
    metadata: { slug: row.slug },
  });
  revalidateSolution(row.slug);
  return row;
}

export async function unpublishSolution(input: {
  id: string;
  actorId: string;
}) {
  const row = await prisma.solution.update({
    where: { id: input.id },
    data: { status: "ARCHIVED", updatedById: input.actorId },
  });
  await createContentRevision({
    entityType: "Solution",
    entityId: row.id,
    snapshot: snapshot(row),
    createdById: input.actorId,
  });
  await writeAuditLog({
    actorId: input.actorId,
    action: "solution.unpublish",
    entityType: "Solution",
    entityId: row.id,
    metadata: { slug: row.slug },
  });
  revalidateSolution(row.slug);
  return row;
}

export async function changeSolutionSlug(input: {
  id: string;
  newSlug: string;
  actorId: string;
}) {
  const existing = await prisma.solution.findUniqueOrThrow({
    where: { id: input.id },
  });
  const newSlug = input.newSlug.trim();
  if (newSlug === existing.slug) return existing;

  const conflict = await prisma.solution.findUnique({
    where: { slug: newSlug },
  });
  if (conflict) throw new Error("Slug already in use");

  const oldPath = `/solutions/${existing.slug}`;
  const newPath = `/solutions/${newSlug}`;

  const row = await prisma.solution.update({
    where: { id: input.id },
    data: { slug: newSlug, updatedById: input.actorId },
  });

  if (existing.status === "PUBLISHED") {
    await upsertSlugRedirect({
      sourcePath: oldPath,
      destination: newPath,
      createdById: input.actorId,
      reason: "solution-slug-change",
    });
  }

  await writeAuditLog({
    actorId: input.actorId,
    action: "solution.slug_change",
    entityType: "Solution",
    entityId: row.id,
    metadata: { from: existing.slug, to: newSlug },
  });

  revalidateSolution(existing.slug);
  revalidateSolution(row.slug);
  return row;
}
