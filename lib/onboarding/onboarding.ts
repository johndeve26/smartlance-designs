import type { Prisma } from "@prisma/client";
import { Prisma as PrismaRuntime } from "@prisma/client";
import { prisma } from "@/lib/db";
import { recordAgencyProjectActivity } from "@/lib/agency/activity";
import { recordOnboardingActivity } from "@/lib/onboarding/activity";
import { ACTIVE_ONBOARDING_STATUSES } from "@/lib/onboarding/constants";
import {
  computeOnboardingProgress,
  hasOutstandingClientWork,
  hasPendingReview,
  isEligibleToComplete,
} from "@/lib/onboarding/progress";
import { getOnboardingTemplateVersion } from "@/lib/onboarding/templates";
import { sendOnboardingInvitationEmail, sendOnboardingReminderEmail } from "@/lib/onboarding/email";

type Tx = Prisma.TransactionClient;

export async function getActiveProjectOnboarding(projectId: string) {
  return prisma.agencyProjectOnboarding.findFirst({
    where: {
      projectId,
      status: { in: ACTIVE_ONBOARDING_STATUSES },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOnboardingById(onboardingId: string) {
  return prisma.agencyProjectOnboarding.findUnique({
    where: { id: onboardingId },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          projectNumber: true,
          primaryContactId: true,
          clientCompanyId: true,
          requireOnboarding: true,
          requireSignedContract: true,
          requireDeposit: true,
          requireInternalKickoff: true,
          internalKickoffCompletedAt: true,
        },
      },
      owner: { select: { id: true, name: true, email: true } },
      primaryClientContact: {
        select: { id: true, email: true, displayName: true, firstName: true, lastName: true },
      },
      sections: { orderBy: { position: "asc" } },
      questions: { orderBy: [{ sectionId: "asc" }, { position: "asc" }] },
      responses: true,
      requirements: { orderBy: { createdAt: "asc" } },
      template: { select: { id: true, name: true } },
      templateVersion: { select: { id: true, versionNumber: true } },
    },
  });
}

async function loadProgressContext(onboardingId: string) {
  const [questions, responses, requirements, fileCounts] = await Promise.all([
    prisma.agencyOnboardingQuestion.findMany({ where: { onboardingId } }),
    prisma.agencyOnboardingResponse.findMany({ where: { onboardingId } }),
    prisma.agencyClientRequirement.findMany({ where: { onboardingId } }),
    prisma.agencyOnboardingFileSubmission.groupBy({
      by: ["questionId"],
      where: { onboardingId, supersededAt: null, questionId: { not: null } },
      _count: { _all: true },
    }),
  ]);

  const fileCountsByQuestionId = new Map<string, number>();
  for (const row of fileCounts) {
    if (row.questionId) fileCountsByQuestionId.set(row.questionId, row._count._all);
  }

  return {
    questions,
    responses,
    requirements,
    fileCountsByQuestionId,
    progress: computeOnboardingProgress({
      questions,
      responses,
      requirements,
      fileCountsByQuestionId,
    }),
  };
}

export async function recalculateOnboardingState(onboardingId: string, tx?: Tx) {
  const client = tx ?? prisma;
  const onboarding = await client.agencyProjectOnboarding.findUniqueOrThrow({
    where: { id: onboardingId },
  });

  if (["COMPLETED", "CANCELLED"].includes(onboarding.status)) {
    return onboarding;
  }

  const ctx = await loadProgressContext(onboardingId);
  let status = onboarding.status;
  let waitingOn: Prisma.AgencyProjectOnboardingUpdateInput["waitingOn"] = "NONE";

  const clientOutstanding = hasOutstandingClientWork(ctx);
  const reviewPending = hasPendingReview(ctx);

  if (onboarding.submittedAt) {
    if (reviewPending) {
      status = "UNDER_REVIEW";
      waitingOn = "AGENCY";
    } else if (clientOutstanding) {
      status = "WAITING_ON_CLIENT";
      waitingOn = "CLIENT";
    } else if (isEligibleToComplete(ctx.progress)) {
      status = onboarding.startedAt ? "UNDER_REVIEW" : "IN_PROGRESS";
      waitingOn = "AGENCY";
    }
  } else if (clientOutstanding) {
    status = onboarding.startedAt ? "WAITING_ON_CLIENT" : "NOT_STARTED";
    waitingOn = "CLIENT";
  } else if (onboarding.startedAt) {
    status = "IN_PROGRESS";
    waitingOn = reviewPending ? "AGENCY" : "NONE";
  }

  return client.agencyProjectOnboarding.update({
    where: { id: onboardingId },
    data: { status, waitingOn },
  });
}

async function snapshotTemplateIntoOnboarding(
  tx: Tx,
  input: {
    onboardingId: string;
    projectId: string;
    versionId: string;
    targetCompletionDate?: Date | null;
    primaryClientContactId?: string | null;
  },
) {
  const version = await getOnboardingTemplateVersion(input.versionId);
  if (!version) throw new Error("Onboarding template version not found.");

  const sectionIdMap = new Map<string, string>();
  for (const section of version.sections) {
    const created = await tx.agencyOnboardingSection.create({
      data: {
        onboardingId: input.onboardingId,
        title: section.title,
        description: section.description,
        position: section.position,
        clientVisible: section.clientVisible,
      },
    });
    sectionIdMap.set(section.id, created.id);
  }

  for (const question of version.questions) {
    await tx.agencyOnboardingQuestion.create({
      data: {
        onboardingId: input.onboardingId,
        sectionId: sectionIdMap.get(question.sectionId)!,
        key: question.key,
        label: question.label,
        description: question.description,
        type: question.type,
        required: question.required,
        position: question.position,
        placeholder: question.placeholder,
        helpText: question.helpText,
        optionsJson: question.optionsJson ?? undefined,
        validationJson: question.validationJson ?? undefined,
        clientVisible: question.clientVisible,
      },
    });
  }

  const baseDue = input.targetCompletionDate ?? null;
  for (const req of version.requirements) {
    const existing = await tx.agencyClientRequirement.findFirst({
      where: {
        projectId: input.projectId,
        sourceTemplateKey: req.sourceKey,
      },
    });
    if (existing) {
      if (!existing.onboardingId) {
        await tx.agencyClientRequirement.update({
          where: { id: existing.id },
          data: {
            onboardingId: input.onboardingId,
            onboardingSectionId: req.sectionId
              ? sectionIdMap.get(req.sectionId) ?? null
              : null,
          },
        });
      }
      continue;
    }

    let dueDate: Date | null = null;
    if (baseDue && req.offsetDaysDue != null) {
      dueDate = new Date(baseDue);
      dueDate.setDate(dueDate.getDate() - req.offsetDaysDue);
    }

    await tx.agencyClientRequirement.create({
      data: {
        projectId: input.projectId,
        onboardingId: input.onboardingId,
        onboardingSectionId: req.sectionId ? sectionIdMap.get(req.sectionId) ?? null : null,
        sourceTemplateKey: req.sourceKey,
        title: req.title,
        description: req.description,
        type: req.type,
        required: req.required,
        clientVisible: req.clientVisible,
        dueDate,
        assignedContactId: input.primaryClientContactId ?? null,
        ...(req.type === "ACCESS"
          ? {
              accessMetadataJson: {
                serviceName: req.title,
                accessType: "Collaborator invite",
                instructions:
                  req.description ??
                  "Invite the Smartlance team email with the required permissions. Do not share passwords.",
              },
            }
          : {}),
      },
    });
  }
}

export async function startOnboarding(input: {
  projectId: string;
  templateVersionId: string;
  ownerId?: string | null;
  primaryClientContactId?: string | null;
  targetCompletionDate?: Date | null;
  clientMessage?: string | null;
  createdById: string;
  sendEmail?: boolean;
}) {
  const version = await getOnboardingTemplateVersion(input.templateVersionId);
  if (!version || version.template.status === "ARCHIVED") {
    throw new Error("Onboarding template is not available.");
  }

  const project = await prisma.agencyProject.findUniqueOrThrow({
    where: { id: input.projectId },
    select: { id: true, name: true, primaryContactId: true },
  });

  const onboarding = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw(PrismaRuntime.sql`
      SELECT id FROM "AgencyProject" WHERE id = ${input.projectId} FOR UPDATE
    `);

    const active = await tx.agencyProjectOnboarding.findFirst({
      where: {
        projectId: input.projectId,
        status: { in: ACTIVE_ONBOARDING_STATUSES },
      },
    });
    if (active) {
      throw new Error("This project already has active onboarding.");
    }

    let created;
    try {
      created = await tx.agencyProjectOnboarding.create({
        data: {
          projectId: input.projectId,
          templateId: version.templateId,
          templateVersionId: version.id,
          status: "IN_PROGRESS",
          waitingOn: "CLIENT",
          ownerId: input.ownerId ?? input.createdById,
          primaryClientContactId:
            input.primaryClientContactId ?? project.primaryContactId,
          startedAt: new Date(),
          targetCompletionDate: input.targetCompletionDate ?? null,
          clientMessage: input.clientMessage?.trim() || version.welcomeText || null,
          createdById: input.createdById,
        },
      });
    } catch (err) {
      if (
        err instanceof PrismaRuntime.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        throw new Error("This project already has active onboarding.");
      }
      throw err;
    }

    await snapshotTemplateIntoOnboarding(tx, {
      onboardingId: created.id,
      projectId: input.projectId,
      versionId: version.id,
      targetCompletionDate: input.targetCompletionDate,
      primaryClientContactId:
        input.primaryClientContactId ?? project.primaryContactId,
    });

    await recordOnboardingActivity(
      {
        onboardingId: created.id,
        type: "ONBOARDING_CREATED",
        summary: "Client onboarding created.",
        actorUserId: input.createdById,
        clientVisible: true,
      },
      tx,
    );

    await recordOnboardingActivity(
      {
        onboardingId: created.id,
        type: "ONBOARDING_STARTED",
        summary: "Client onboarding started.",
        actorUserId: input.createdById,
        clientVisible: true,
      },
      tx,
    );

    await recordAgencyProjectActivity(
      {
        projectId: input.projectId,
        type: "ONBOARDING_STARTED",
        summary: "Client onboarding started.",
        actorUserId: input.createdById,
        entityType: "AgencyProjectOnboarding",
        entityId: created.id,
        clientVisible: true,
      },
      tx,
    );

    return created;
  });

  if (input.sendEmail !== false) {
    void sendOnboardingInvitationEmail({ onboardingId: onboarding.id }).catch((err) => {
      console.error("[onboarding:invite-email]", err);
    });
  }

  return getOnboardingById(onboarding.id);
}

export async function submitOnboardingForReview(input: {
  onboardingId: string;
  portalUserId: string;
  contactId: string;
}) {
  const onboarding = await prisma.agencyProjectOnboarding.findUniqueOrThrow({
    where: { id: input.onboardingId },
  });

  if (["COMPLETED", "CANCELLED"].includes(onboarding.status)) {
    throw new Error("Onboarding is not open for submission.");
  }

  const ctx = await loadProgressContext(input.onboardingId);

  for (const q of ctx.questions) {
    if (!q.required || !q.clientVisible) continue;
    const response = ctx.responses.find((r) => r.questionId === q.id);
    const fileCount = ctx.fileCountsByQuestionId.get(q.id) ?? 0;
    if (q.type === "FILE_REQUEST") {
      if (fileCount === 0) throw new Error(`Required file missing: ${q.label}`);
      continue;
    }
    if (!response?.valueText && response?.valueJson == null) {
      throw new Error(`Required question unanswered: ${q.label}`);
    }
    if (response.reviewStatus === "NEEDS_CLARIFICATION") {
      throw new Error(`Please update clarification for: ${q.label}`);
    }
  }

  for (const r of ctx.requirements) {
    if (!r.required || !r.clientVisible) continue;
    if (["REQUESTED", "NEEDS_CLARIFICATION"].includes(r.status)) {
      throw new Error(`Required item incomplete: ${r.title}`);
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.agencyProjectOnboarding.update({
      where: { id: input.onboardingId },
      data: {
        submittedAt: new Date(),
        lastClientActivityAt: new Date(),
        status: "UNDER_REVIEW",
        waitingOn: "AGENCY",
      },
    });

    await tx.agencyOnboardingResponse.updateMany({
      where: {
        onboardingId: input.onboardingId,
        reviewStatus: { not: "ACCEPTED" },
      },
      data: { reviewStatus: "PENDING", submittedAt: new Date() },
    });

    await recordOnboardingActivity({
      onboardingId: input.onboardingId,
      type: "ONBOARDING_SUBMITTED",
      summary: "Client submitted onboarding for review.",
      actorPortalUserId: input.portalUserId,
      clientVisible: true,
    });

    await recordAgencyProjectActivity({
      projectId: onboarding.projectId,
      type: "ONBOARDING_SUBMITTED",
      summary: "Client submitted onboarding for review.",
      actorPortalUserId: input.portalUserId,
      entityType: "AgencyProjectOnboarding",
      entityId: onboarding.id,
      clientVisible: true,
    });
  });

  return recalculateOnboardingState(input.onboardingId);
}

export async function completeOnboarding(input: {
  onboardingId: string;
  actorUserId: string;
}) {
  const onboarding = await prisma.$transaction(async (tx) => {
    const current = await tx.agencyProjectOnboarding.findUniqueOrThrow({
      where: { id: input.onboardingId },
    });
    if (current.status === "COMPLETED") {
      return current;
    }
    if (current.status === "CANCELLED") {
      throw new Error("Cancelled onboarding cannot be completed.");
    }

    const ctx = await loadProgressContext(input.onboardingId);
    if (!isEligibleToComplete(ctx.progress)) {
      throw new Error("Required onboarding items are not complete.");
    }

    const updated = await tx.agencyProjectOnboarding.updateMany({
      where: {
        id: input.onboardingId,
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
      data: {
        status: "COMPLETED",
        waitingOn: "NONE",
        completedAt: new Date(),
      },
    });

    if (updated.count === 0) {
      const again = await tx.agencyProjectOnboarding.findUniqueOrThrow({
        where: { id: input.onboardingId },
      });
      if (again.status === "COMPLETED") return again;
      throw new Error("Cancelled onboarding cannot be completed.");
    }

    const completed = await tx.agencyProjectOnboarding.findUniqueOrThrow({
      where: { id: input.onboardingId },
    });

    await recordOnboardingActivity({
      onboardingId: input.onboardingId,
      type: "ONBOARDING_COMPLETED",
      summary: "Onboarding marked complete.",
      actorUserId: input.actorUserId,
      clientVisible: true,
    });

    await recordAgencyProjectActivity({
      projectId: completed.projectId,
      type: "ONBOARDING_COMPLETED",
      summary: "Client onboarding completed.",
      actorUserId: input.actorUserId,
      entityType: "AgencyProjectOnboarding",
      entityId: completed.id,
      clientVisible: true,
    });

    return completed;
  });

  return onboarding;
}

export async function cancelOnboarding(input: {
  onboardingId: string;
  actorUserId: string;
}) {
  const onboarding = await prisma.agencyProjectOnboarding.update({
    where: { id: input.onboardingId },
    data: {
      status: "CANCELLED",
      waitingOn: "NONE",
      cancelledAt: new Date(),
    },
  });

  await recordOnboardingActivity({
    onboardingId: input.onboardingId,
    type: "ONBOARDING_CANCELLED",
    summary: "Onboarding cancelled.",
    actorUserId: input.actorUserId,
  });

  return onboarding;
}

export async function reopenOnboarding(input: {
  onboardingId: string;
  actorUserId: string;
}) {
  const onboarding = await prisma.agencyProjectOnboarding.update({
    where: { id: input.onboardingId },
    data: {
      status: "IN_PROGRESS",
      completedAt: null,
      submittedAt: null,
      waitingOn: "CLIENT",
    },
  });

  await recordOnboardingActivity({
    onboardingId: input.onboardingId,
    type: "ONBOARDING_REOPENED",
    summary: "Onboarding reopened.",
    actorUserId: input.actorUserId,
  });

  return recalculateOnboardingState(onboarding.id);
}

export async function listOnboardings(filters?: {
  status?: Prisma.AgencyProjectOnboardingWhereInput["status"];
  ownerId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 25;
  const where: Prisma.AgencyProjectOnboardingWhereInput = {
    ...(filters?.status ? { status: filters.status } : {}),
    ...(filters?.ownerId ? { ownerId: filters.ownerId } : {}),
    ...(filters?.search
      ? {
          OR: [
            { project: { name: { contains: filters.search, mode: "insensitive" } } },
            { project: { projectNumber: { contains: filters.search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.agencyProjectOnboarding.findMany({
      where,
      orderBy: [{ targetCompletionDate: "asc" }, { updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            projectNumber: true,
            primaryContact: {
              select: { id: true, displayName: true, firstName: true, lastName: true, email: true },
            },
          },
        },
        owner: { select: { id: true, name: true } },
      },
    }),
    prisma.agencyProjectOnboarding.count({ where }),
  ]);

  const withProgress = await Promise.all(
    items.map(async (item) => {
      const ctx = await loadProgressContext(item.id);
      return { ...item, progress: ctx.progress };
    }),
  );

  return { items: withProgress, total, page, pageSize };
}

export async function sendManualOnboardingReminder(input: {
  onboardingId: string;
  actorUserId: string;
  recipientContactId?: string | null;
}) {
  const onboarding = await prisma.agencyProjectOnboarding.findUniqueOrThrow({
    where: { id: input.onboardingId },
    include: {
      project: { select: { name: true } },
      primaryClientContact: { select: { id: true, email: true } },
    },
  });

  if (["COMPLETED", "CANCELLED"].includes(onboarding.status)) {
    throw new Error("Cannot remind on closed onboarding.");
  }

  const ctx = await loadProgressContext(input.onboardingId);
  const remaining =
    ctx.progress.requiredQuestionsTotal +
    ctx.progress.requiredRequirementsTotal -
    ctx.progress.requiredQuestionsComplete -
    ctx.progress.requiredRequirementsComplete;

  const dedupeKey = `manual:${input.onboardingId}:${Date.now()}`;
  await prisma.agencyOnboardingReminder.create({
    data: {
      onboardingId: input.onboardingId,
      recipientContactId:
        input.recipientContactId ?? onboarding.primaryClientContactId,
      type: "ONBOARDING",
      dedupeKey,
      status: "PENDING",
      scheduledFor: new Date(),
    },
  });

  await sendOnboardingReminderEmail({
    onboardingId: input.onboardingId,
    remainingItems: Math.max(remaining, 1),
  });

  await prisma.agencyProjectOnboarding.update({
    where: { id: input.onboardingId },
    data: {
      lastReminderAt: new Date(),
      reminderCount: { increment: 1 },
    },
  });

  await recordOnboardingActivity({
    onboardingId: input.onboardingId,
    type: "REMINDER_SENT",
    summary: "Onboarding reminder sent.",
    actorUserId: input.actorUserId,
    clientVisible: false,
  });

  await prisma.agencyOnboardingReminder.updateMany({
    where: { dedupeKey },
    data: { status: "SENT", sentAt: new Date() },
  });

  return { ok: true as const };
}

export { loadProgressContext };
