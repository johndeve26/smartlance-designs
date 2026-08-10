import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  calculateBriefCompletion,
  deriveBriefTitle,
  deriveProjectType,
  getBriefSectionCount,
  validateBriefAnswers,
} from "@/lib/prospect/brief/schema";
import type {
  ProspectBriefDetailDto,
  ProspectBriefListItemDto,
} from "@/lib/prospect/dto";
import { createClaimToken, hashClaimToken } from "@/lib/prospect/tokens";
import type { TemplateValues } from "@/components/templates/brief-plain-text";
import { PROSPECT_BRIEF_SCHEMA_VERSION } from "@/lib/prospect/constants";

function toListItem(brief: {
  id: string;
  title: string;
  projectType: string | null;
  status: ProspectBriefListItemDto["status"];
  completionPercent: number;
  completedSectionIds: unknown;
  sourceReviewId: string | null;
  updatedAt: Date;
  submittedAt: Date | null;
}): ProspectBriefListItemDto {
  const completedIds = Array.isArray(brief.completedSectionIds)
    ? (brief.completedSectionIds as string[])
    : [];
  return {
    id: brief.id,
    title: brief.title,
    projectType: brief.projectType,
    status: brief.status,
    completionPercent: brief.completionPercent,
    completedSectionCount: completedIds.length,
    totalSectionCount: getBriefSectionCount(),
    sourceReviewId: brief.sourceReviewId,
    updatedAt: brief.updatedAt.toISOString(),
    submittedAt: brief.submittedAt?.toISOString() ?? null,
  };
}

export async function createBrief(input: {
  portalUserId?: string;
  sourceReviewId?: string;
  initialAnswers?: TemplateValues;
}) {
  const claimToken = input.portalUserId ? null : createClaimToken();
  const answers = input.initialAnswers ?? {};
  const { completionPercent, completedSectionIds } =
    calculateBriefCompletion(answers);

  const brief = await prisma.agencyWebsiteBrief.create({
    data: {
      portalUserId: input.portalUserId ?? null,
      claimTokenHash: claimToken ? hashClaimToken(claimToken) : null,
      title: deriveBriefTitle(answers),
      projectType: deriveProjectType(answers),
      sourceReviewId: input.sourceReviewId ?? null,
      schemaVersion: PROSPECT_BRIEF_SCHEMA_VERSION,
      answersJson: answers as Prisma.InputJsonValue,
      completionPercent,
      completedSectionIds: completedSectionIds as Prisma.InputJsonValue,
    },
  });

  return { briefId: brief.id, claimToken };
}

export async function saveBrief(input: {
  briefId: string;
  portalUserId: string;
  answers: TemplateValues;
}) {
  if (!validateBriefAnswers(input.answers)) {
    throw new Error("Invalid brief answers.");
  }

  const { completionPercent, completedSectionIds } = calculateBriefCompletion(
    input.answers,
  );

  const brief = await prisma.agencyWebsiteBrief.updateMany({
    where: { id: input.briefId, portalUserId: input.portalUserId, status: "DRAFT" },
    data: {
      answersJson: input.answers as Prisma.InputJsonValue,
      completionPercent,
      completedSectionIds: completedSectionIds as Prisma.InputJsonValue,
      title: deriveBriefTitle(input.answers),
      projectType: deriveProjectType(input.answers),
    },
  });

  if (brief.count === 0) {
    throw new Error("Brief not found or not editable.");
  }

  return getBriefForAccess(input.briefId, { portalUserId: input.portalUserId });
}

export async function getBriefForAccess(
  briefId: string,
  ctx: { portalUserId?: string; claimToken?: string },
): Promise<ProspectBriefDetailDto | null> {
  const brief = await prisma.agencyWebsiteBrief.findUnique({
    where: { id: briefId },
  });
  if (!brief) return null;

  const claimHash = ctx.claimToken ? hashClaimToken(ctx.claimToken) : null;
  const allowed =
    (ctx.portalUserId && brief.portalUserId === ctx.portalUserId) ||
    (claimHash && brief.claimTokenHash === claimHash);
  if (!allowed) return null;

  const answers = (brief.answersJson as TemplateValues) ?? {};
  const completedSectionIds = Array.isArray(brief.completedSectionIds)
    ? (brief.completedSectionIds as string[])
    : [];

  return {
    ...toListItem(brief),
    answers,
    completedSectionIds,
    sourceReviewId: brief.sourceReviewId,
  };
}

export async function listBriefsForUser(portalUserId: string) {
  const briefs = await prisma.agencyWebsiteBrief.findMany({
    where: { portalUserId },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
  return briefs.map(toListItem);
}

export async function createBriefSnapshot(briefId: string, portalUserId: string) {
  const brief = await prisma.agencyWebsiteBrief.findFirst({
    where: { id: briefId, portalUserId },
  });
  if (!brief) throw new Error("Brief not found.");

  const snapshot = {
    schemaVersion: brief.schemaVersion,
    title: brief.title,
    projectType: brief.projectType,
    answers: brief.answersJson,
    completionPercent: brief.completionPercent,
    completedSectionIds: brief.completedSectionIds,
    capturedAt: new Date().toISOString(),
  };

  await prisma.agencyWebsiteBrief.update({
    where: { id: briefId },
    data: { submittedSnapshotJson: snapshot as Prisma.InputJsonValue },
  });

  return snapshot;
}

export async function mergeLocalBriefAnswers(input: {
  briefId: string;
  portalUserId: string;
  answers: TemplateValues;
}) {
  const existing = await prisma.agencyWebsiteBrief.findFirst({
    where: { id: input.briefId, portalUserId: input.portalUserId },
  });
  if (!existing) throw new Error("Brief not found.");

  const current = (existing.answersJson as TemplateValues) ?? {};
  const merged = { ...current, ...input.answers };
  return saveBrief({
    briefId: input.briefId,
    portalUserId: input.portalUserId,
    answers: merged,
  });
}
