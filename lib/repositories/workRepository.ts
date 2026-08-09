import { hasDatabaseUrl, prisma } from "@/lib/db";
import type { Project, ProjectCategory } from "@/types";
import { Prisma, type PublishStatus, type WorkProject } from "@prisma/client";
import { resolveProjectMedia } from "@/lib/media/urls";
import { applyPublishedCaseStudyFields } from "@/lib/work/case-study-content";
import {
  effectiveWorkFields,
  hasWorkDraft,
  normalizeWorkPartial,
  parseWorkDraftInput,
  publishedFieldsFromRow,
  workFieldsToRowData,
  type WorkEditableFields,
} from "@/lib/repositories/workDraftFields";
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
  const base = resolveProjectMedia({
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
    displayOrder: row.displayOrder,
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
    usesDbCaseStudyContent: row.caseStudyContent != null,
  });

  return applyPublishedCaseStudyFields(row, base);
}

export async function listPublishedWork() {
  if (!hasDatabaseUrl()) return [];
  const rows = await prisma.workProject.findMany({
    where: { status: published },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });
  return sortPublicWorkProjects(rows.map(toPublicProject));
}

/** Deterministic public Work listing order — matches `/work` and adjacent navigation. */
export function sortPublicWorkProjects(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => {
    const orderA = a.displayOrder ?? (a.featured ? 50 : 100);
    const orderB = b.displayOrder ?? (b.featured ? 50 : 100);
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name);
  });
}

export function getAdjacentPublicWork(
  slug: string,
  catalog: Project[],
): { previous: Project | null; next: Project | null } {
  const list = sortPublicWorkProjects(catalog);
  const index = list.findIndex((project) => project.slug === slug);
  if (index === -1) return { previous: null, next: null };
  return {
    previous: index > 0 ? list[index - 1] : null,
    next: index < list.length - 1 ? list[index + 1] : null,
  };
}

export function listRelatedPublicWork(
  project: Project,
  catalog: Project[],
  limit = 2,
): Project[] {
  const bySlug = new Map(catalog.map((item) => [item.slug, item]));
  const selected: Project[] = [];
  const seen = new Set<string>([project.slug]);

  for (const slug of project.relatedSlugs ?? []) {
    if (selected.length >= limit) break;
    const related = bySlug.get(slug);
    if (related && !seen.has(related.slug)) {
      selected.push(related);
      seen.add(related.slug);
    }
  }

  if (selected.length >= limit) return selected;

  const scoreRelated = (candidate: Project): number => {
    let score = 0;
    if (candidate.industry === project.industry) score += 100;
    score +=
      project.services.filter((service) => candidate.services.includes(service))
        .length * 20;
    if (project.platform && candidate.platform === project.platform) score += 15;
    if (
      project.platforms?.some((platform) => candidate.platforms?.includes(platform))
    ) {
      score += 10;
    }
    if (candidate.featured) score += 5;
    score -= (candidate.displayOrder ?? 100) / 1000;
    return score;
  };

  const ranked = sortPublicWorkProjects(
    catalog.filter((item) => item.slug !== project.slug && !seen.has(item.slug)),
  )
    .map((candidate) => ({ candidate, score: scoreRelated(candidate) }))
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || a.candidate.name.localeCompare(b.candidate.name),
    );

  for (const { candidate } of ranked) {
    if (selected.length >= limit) break;
    selected.push(candidate);
    seen.add(candidate.slug);
  }

  return selected;
}

const homepageHeroImageFilter = {
  OR: [{ heroImagePath: { not: null } }, { coverImagePath: { not: null } }],
} satisfies Prisma.WorkProjectWhereInput;

/** Published homepage hero — at most one effective row (deterministic if multiple flagged). */
export async function getPublishedHomepageHero() {
  if (!hasDatabaseUrl()) return null;
  const row = await prisma.workProject.findFirst({
    where: {
      status: published,
      featuredHomepage: true,
      ...homepageHeroImageFilter,
    },
    orderBy: [{ displayOrder: "asc" }, { updatedAt: "desc" }, { name: "asc" }],
  });
  return row ? toPublicProject(row) : null;
}

/** Published featured work for homepage Selected Work (excludes hero slug when provided). */
export async function listPublishedFeaturedWork(excludeSlug?: string) {
  if (!hasDatabaseUrl()) return [];
  const rows = await prisma.workProject.findMany({
    where: {
      status: published,
      featured: true,
      ...(excludeSlug ? { slug: { not: excludeSlug } } : {}),
    },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });
  return rows.map(toPublicProject);
}

async function clearFeaturedHomepageExcept(
  tx: Prisma.TransactionClient,
  keepId: string,
) {
  await tx.workProject.updateMany({
    where: { id: { not: keepId } },
    data: { featuredHomepage: false },
  });
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

async function getIndustryIdsForWork(workId: string): Promise<string[]> {
  const links = await prisma.industryWork.findMany({
    where: { workId },
    orderBy: { sortOrder: "asc" },
    select: { industryId: true },
  });
  return links.map((link) => link.industryId);
}

async function applyIndustryLinks(workId: string, industryIds: string[]) {
  await prisma.industryWork.deleteMany({ where: { workId } });
  if (industryIds.length) {
    await prisma.industryWork.createMany({
      data: industryIds.map((industryId, sortOrder) => ({
        industryId,
        workId,
        sortOrder,
      })),
    });
  }
}

function rowFromEffectiveFields(
  row: WorkProject,
  fields: WorkEditableFields,
): WorkProject {
  return {
    ...row,
    ...workFieldsToRowData(fields),
    slug: fields.slug,
    servicesLabels: fields.servicesLabels as WorkProject["servicesLabels"],
  } as WorkProject;
}

export async function getWorkForPreview(id: string) {
  const row = await getWorkByIdAdmin(id);
  if (!row) return null;
  const industryIds = row.industryLinks.map((link) => link.industryId);
  const effective = effectiveWorkFields(row, industryIds);
  return toPublicProject(rowFromEffectiveFields(row, effective));
}

export { effectiveWorkFields, hasWorkDraft, publishedFieldsFromRow };

export async function saveWorkDraft(input: {
  id?: string;
  data: Partial<WorkEditableFields> & Record<string, unknown>;
  industryIds?: string[];
  actorId: string;
}) {
  const partial = parseWorkDraftInput({
    ...input.data,
    industryIds: input.industryIds,
  });

  if (input.id) {
    const existing = await prisma.workProject.findUniqueOrThrow({
      where: { id: input.id },
      include: { industryLinks: true },
    });
    const industryIds =
      input.industryIds ??
      existing.industryLinks.map((link) => link.industryId);
    const base = effectiveWorkFields(existing, industryIds);
    const nextDraft: WorkEditableFields = {
      ...base,
      ...normalizeWorkPartial(partial),
      industryIds,
    };
    const now = new Date();
    const row = await prisma.workProject.update({
      where: { id: input.id },
      data: {
        draftJson: nextDraft as unknown as Prisma.InputJsonValue,
        draftUpdatedAt: now,
        draftUpdatedById: input.actorId,
        updatedById: input.actorId,
      },
    });

    await createContentRevision({
      entityType: "WorkProject",
      entityId: row.id,
      snapshot: {
        kind: "draft",
        draft: nextDraft,
        published: publishedFieldsFromRow(existing, industryIds),
      } as unknown as Prisma.InputJsonValue,
      createdById: input.actorId,
    });
    await writeAuditLog({
      actorId: input.actorId,
      action: "work.save_draft",
      entityType: "WorkProject",
      entityId: row.id,
      metadata: { slug: row.slug, hasDraft: true },
    });
    return row;
  }

  const required = partial as WorkEditableFields;
  const industryIds = input.industryIds ?? partial.industryIds ?? [];
  const bootstrap: WorkEditableFields = {
    slug: required.slug,
    name: required.name,
    industryLabel: required.industryLabel,
    challenge: required.challenge,
    solution: required.solution,
    servicesLabels: required.servicesLabels ?? [],
    seoTitle: required.seoTitle,
    seoDescription: required.seoDescription,
    title: required.title ?? null,
    clientName: required.clientName ?? null,
    projectType: required.projectType ?? null,
    shortDescription: required.shortDescription ?? null,
    overview: required.overview ?? null,
    approach: required.approach ?? null,
    resultSummary: required.resultSummary ?? null,
    results: required.results ?? null,
    measurableResults: required.measurableResults ?? null,
    goals: required.goals ?? null,
    technologies: required.technologies ?? null,
    platformLabel: required.platformLabel ?? null,
    platformsLabels: required.platformsLabels ?? null,
    websiteUrl: required.websiteUrl ?? null,
    oldUrl: required.oldUrl ?? null,
    year: required.year ?? null,
    coverImagePath: required.coverImagePath ?? null,
    coverImageAlt: required.coverImageAlt ?? null,
    heroImagePath: required.heroImagePath ?? null,
    heroImageAlt: required.heroImageAlt ?? null,
    gallery: required.gallery ?? null,
    relatedServiceHrefs: required.relatedServiceHrefs ?? null,
    relatedWorkSlugs: required.relatedWorkSlugs ?? null,
    featuredHomepage: required.featuredHomepage ?? false,
    featuredWorkArchive: required.featuredWorkArchive ?? false,
    featured: required.featured ?? false,
    displayOrder: required.displayOrder ?? 0,
    heroStatement: required.heroStatement ?? null,
    challenges: required.challenges ?? null,
    approachSteps: required.approachSteps ?? null,
    solutionPoints: required.solutionPoints ?? null,
    highlights: required.highlights ?? null,
    platformContext: required.platformContext ?? null,
    outcomeHeading: required.outcomeHeading ?? null,
    caseStudyKind: required.caseStudyKind ?? "website",
    caseStudyContent: required.caseStudyContent ?? null,
    heroEyebrow: required.heroEyebrow ?? null,
    heroSupportingCopy: required.heroSupportingCopy ?? null,
    externalLinkLabel: required.externalLinkLabel ?? null,
    ogTitle: required.ogTitle ?? null,
    ogDescription: required.ogDescription ?? null,
    ogImagePath: required.ogImagePath ?? null,
    noIndex: required.noIndex ?? false,
    canonicalOverride: required.canonicalOverride ?? null,
    approvedForAI: required.approvedForAI ?? false,
    approvedProjectFacts: required.approvedProjectFacts ?? null,
    industryIds,
  };

  const now = new Date();
  const row = await prisma.workProject.create({
    data: {
      ...(workFieldsToRowData(bootstrap) as Prisma.WorkProjectUncheckedCreateInput),
      slug: bootstrap.slug,
      name: bootstrap.name,
      industryLabel: bootstrap.industryLabel,
      challenge: bootstrap.challenge,
      solution: bootstrap.solution,
      servicesLabels: bootstrap.servicesLabels,
      seoTitle: bootstrap.seoTitle,
      seoDescription: bootstrap.seoDescription,
      status: "DRAFT",
      draftJson: bootstrap as unknown as Prisma.InputJsonValue,
      draftUpdatedAt: now,
      draftUpdatedById: input.actorId,
      createdById: input.actorId,
      updatedById: input.actorId,
    },
  });

  if (industryIds.length) {
    await applyIndustryLinks(row.id, industryIds);
  }

  await createContentRevision({
    entityType: "WorkProject",
    entityId: row.id,
    snapshot: {
      kind: "draft",
      draft: bootstrap,
      published: null,
    } as unknown as Prisma.InputJsonValue,
    createdById: input.actorId,
  });
  await writeAuditLog({
    actorId: input.actorId,
    action: "work.save_draft",
    entityType: "WorkProject",
    entityId: row.id,
    metadata: { slug: row.slug, hasDraft: true },
  });
  return row;
}

export async function discardWorkDraft(input: { id: string; actorId: string }) {
  const row = await prisma.workProject.update({
    where: { id: input.id },
    data: {
      draftJson: Prisma.JsonNull,
      draftUpdatedAt: null,
      draftUpdatedById: null,
      updatedById: input.actorId,
    },
  });
  await writeAuditLog({
    actorId: input.actorId,
    action: "work.discard_draft",
    entityType: "WorkProject",
    entityId: row.id,
    metadata: { slug: row.slug },
  });
  return row;
}

export async function publishWork(input: { id: string; actorId: string }) {
  const existing = await prisma.workProject.findUniqueOrThrow({
    where: { id: input.id },
    include: { industryLinks: { orderBy: { sortOrder: "asc" } } },
  });

  const industryIds = hasWorkDraft(existing)
    ? effectiveWorkFields(
        existing,
        existing.industryLinks.map((link) => link.industryId),
      ).industryIds
    : existing.industryLinks.map((link) => link.industryId);

  const fields = hasWorkDraft(existing)
    ? effectiveWorkFields(existing, industryIds)
    : publishedFieldsFromRow(existing, industryIds);

  if (!fields.coverImagePath && !fields.heroImagePath) {
    throw new Error("Cover or hero image reference is required to publish.");
  }

  const previousSlug = existing.slug;
  const nextSlug = fields.slug.trim();
  if (nextSlug !== previousSlug) {
    const conflict = await prisma.workProject.findUnique({ where: { slug: nextSlug } });
    if (conflict && conflict.id !== existing.id) {
      throw new Error("Slug already in use");
    }
  }

  const row = await prisma.$transaction(async (tx) => {
    if (fields.featuredHomepage) {
      await clearFeaturedHomepageExcept(tx, input.id);
    }

    const updated = await tx.workProject.update({
      where: { id: input.id },
      data: {
        ...workFieldsToRowData(fields),
        slug: nextSlug,
        status: published,
        publishedAt: existing.publishedAt ?? new Date(),
        draftJson: Prisma.JsonNull,
        draftUpdatedAt: null,
        draftUpdatedById: null,
        updatedById: input.actorId,
      },
    });

    await tx.industryWork.deleteMany({ where: { workId: input.id } });
    if (fields.industryIds.length) {
      await tx.industryWork.createMany({
        data: fields.industryIds.map((industryId, sortOrder) => ({
          industryId,
          workId: input.id,
          sortOrder,
        })),
      });
    }

    if (
      previousSlug !== nextSlug &&
      (existing.status === published || existing.publishedAt)
    ) {
      await upsertSlugRedirect({
        sourcePath: contentRoutes.work(previousSlug),
        destination: contentRoutes.work(nextSlug),
        createdById: input.actorId,
        reason: "work-slug-change",
      });
    }

    return updated;
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
    metadata: { slug: row.slug, fromSlug: previousSlug },
  });
  revalidateWork(previousSlug);
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
