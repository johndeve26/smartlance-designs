import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { recordAgencyProjectActivity } from "@/lib/agency/activity";
import { uploadAgencyFile } from "@/lib/agency/files";
import { recordOnboardingActivity } from "@/lib/onboarding/activity";
import { recalculateOnboardingState } from "@/lib/onboarding/onboarding";
import { validateResponseValue } from "@/lib/onboarding/responses";
import { sendClarificationEmail } from "@/lib/onboarding/email";

export type AccessMetadata = {
  serviceName?: string;
  accessType?: string;
  accountIdentifier?: string;
  instructions?: string;
  secureSharingMethod?: string;
  inviteEmail?: string;
  clientNote?: string;
};

const SECRET_FIELD_PATTERN =
  /password|api[_-]?secret|private[_-]?key|secret[_-]?key/i;

export function assertNoSecretFields(metadata: Record<string, unknown>) {
  for (const key of Object.keys(metadata)) {
    if (SECRET_FIELD_PATTERN.test(key)) {
      throw new Error("Secret credential fields are not permitted.");
    }
  }
}

export async function createRequirement(input: {
  projectId: string;
  milestoneId?: string | null;
  onboardingId?: string | null;
  onboardingSectionId?: string | null;
  sourceTemplateKey?: string | null;
  title: string;
  description?: string | null;
  type?: Prisma.AgencyClientRequirementCreateInput["type"];
  required?: boolean;
  dueDate?: Date | null;
  clientVisible?: boolean;
  assignedContactId?: string | null;
  accessMetadataJson?: AccessMetadata | null;
}) {
  if (input.accessMetadataJson) {
    assertNoSecretFields(input.accessMetadataJson as Record<string, unknown>);
  }

  return prisma.agencyClientRequirement.create({
    data: {
      projectId: input.projectId,
      milestoneId: input.milestoneId || null,
      onboardingId: input.onboardingId ?? null,
      onboardingSectionId: input.onboardingSectionId ?? null,
      sourceTemplateKey: input.sourceTemplateKey ?? null,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      type: (input.type ?? "OTHER") as never,
      required: input.required ?? true,
      dueDate: input.dueDate ?? null,
      clientVisible: input.clientVisible ?? true,
      assignedContactId: input.assignedContactId ?? null,
      accessMetadataJson: input.accessMetadataJson ?? undefined,
    },
  });
}

export async function markRequirementReceived(input: {
  requirementId: string;
  actorUserId?: string | null;
  actorPortalUserId?: string | null;
}) {
  const requirement = await prisma.agencyClientRequirement.update({
    where: { id: input.requirementId },
    data: {
      status: "SUBMITTED",
      fulfilledAt: new Date(),
    },
  });

  await recordAgencyProjectActivity({
    projectId: requirement.projectId,
    type: "REQUIREMENT_RECEIVED",
    summary: `Requirement submitted: ${requirement.title}.`,
    actorUserId: input.actorUserId ?? null,
    actorPortalUserId: input.actorPortalUserId ?? null,
    entityType: "AgencyClientRequirement",
    entityId: requirement.id,
    clientVisible: requirement.clientVisible,
  });

  if (requirement.onboardingId) {
    await recordOnboardingActivity({
      onboardingId: requirement.onboardingId,
      type: "REQUIREMENT_SUBMITTED",
      summary: `Requirement submitted: ${requirement.title}.`,
      actorUserId: input.actorUserId ?? null,
      actorPortalUserId: input.actorPortalUserId ?? null,
      entityType: "AgencyClientRequirement",
      entityId: requirement.id,
      clientVisible: true,
    });
    await recalculateOnboardingState(requirement.onboardingId);
  }

  return requirement;
}

export async function submitAccessRequirement(input: {
  requirementId: string;
  portalUserId: string;
  clientNote?: string | null;
}) {
  const requirement = await prisma.agencyClientRequirement.findUniqueOrThrow({
    where: { id: input.requirementId },
  });

  if (requirement.type !== "ACCESS") {
    throw new Error("Not an access requirement.");
  }

  const metadata = (requirement.accessMetadataJson as AccessMetadata | null) ?? {};
  if (input.clientNote?.trim()) {
    metadata.clientNote = input.clientNote.trim();
  }

  const updated = await prisma.agencyClientRequirement.update({
    where: { id: requirement.id },
    data: {
      status: "SUBMITTED",
      fulfilledAt: new Date(),
      accessMetadataJson: metadata,
    },
  });

  await recordAgencyProjectActivity({
    projectId: requirement.projectId,
    type: "REQUIREMENT_RECEIVED",
    summary: `Access requirement submitted: ${requirement.title}.`,
    actorPortalUserId: input.portalUserId,
    entityType: "AgencyClientRequirement",
    entityId: requirement.id,
    clientVisible: requirement.clientVisible,
  });

  if (requirement.onboardingId) {
    await recordOnboardingActivity({
      onboardingId: requirement.onboardingId,
      type: "REQUIREMENT_SUBMITTED",
      summary: `Requirement submitted: ${requirement.title}.`,
      actorPortalUserId: input.portalUserId,
      entityType: "AgencyClientRequirement",
      entityId: requirement.id,
      clientVisible: true,
    });
    await recalculateOnboardingState(requirement.onboardingId);
  }

  return updated;
}

export async function reviewRequirement(input: {
  requirementId: string;
  decision: "ACCEPTED" | "NEEDS_CLARIFICATION" | "NOT_NEEDED";
  actorUserId: string;
  clientReviewNote?: string | null;
  internalReviewNote?: string | null;
  expectedUpdatedAt?: Date;
}) {
  const requirement = await prisma.agencyClientRequirement.findUniqueOrThrow({
    where: { id: input.requirementId },
  });

  if (
    input.expectedUpdatedAt &&
    requirement.updatedAt.getTime() !== input.expectedUpdatedAt.getTime()
  ) {
    throw new Error("Requirement changed since you opened it. Refresh and try again.");
  }

  const status =
    input.decision === "ACCEPTED"
      ? "ACCEPTED"
      : input.decision === "NOT_NEEDED"
        ? "NOT_NEEDED"
        : "NEEDS_CLARIFICATION";

  const result = await prisma.agencyClientRequirement.updateMany({
    where: {
      id: requirement.id,
      ...(input.expectedUpdatedAt ? { updatedAt: input.expectedUpdatedAt } : {}),
    },
    data: {
      status,
      clientReviewNote: input.clientReviewNote?.trim() || null,
      internalReviewNote: input.internalReviewNote?.trim() || null,
      fulfilledAt: status === "ACCEPTED" ? new Date() : requirement.fulfilledAt,
    },
  });

  if (result.count === 0) {
    throw new Error("Requirement changed since you opened it. Refresh and try again.");
  }

  const updated = await prisma.agencyClientRequirement.findUniqueOrThrow({
    where: { id: requirement.id },
  });

  if (requirement.onboardingId) {
    await recordOnboardingActivity({
      onboardingId: requirement.onboardingId,
      type:
        status === "ACCEPTED" ? "REQUIREMENT_ACCEPTED" : "CLARIFICATION_REQUESTED",
      summary: `${requirement.title}: ${status.replace(/_/g, " ").toLowerCase()}.`,
      actorUserId: input.actorUserId,
      entityType: "AgencyClientRequirement",
      entityId: requirement.id,
      clientVisible: status !== "NOT_NEEDED",
    });

    if (status === "NEEDS_CLARIFICATION" && input.clientReviewNote?.trim()) {
      void sendClarificationEmail({
        onboardingId: requirement.onboardingId,
        itemLabel: requirement.title,
        message: input.clientReviewNote.trim(),
      }).catch((err) => console.error("[onboarding:clarification-email]", err));
    }

    await recalculateOnboardingState(requirement.onboardingId);
  }

  return updated;
}

export async function saveOnboardingResponse(input: {
  onboardingId: string;
  questionId: string;
  portalUserId: string;
  contactId: string;
  valueText?: string | null;
  valueJson?: unknown;
}) {
  const question = await prisma.agencyOnboardingQuestion.findFirst({
    where: { id: input.questionId, onboardingId: input.onboardingId },
  });
  if (!question) throw new Error("Question not found.");

  const existing = await prisma.agencyOnboardingResponse.findUnique({
    where: {
      onboardingId_questionId: {
        onboardingId: input.onboardingId,
        questionId: input.questionId,
      },
    },
  });

  if (existing?.reviewStatus === "ACCEPTED") {
    throw new Error("This response has been accepted and cannot be changed.");
  }

  const validated = validateResponseValue({
    question,
    valueText: input.valueText,
    valueJson: input.valueJson,
  });

  const response = await prisma.agencyOnboardingResponse.upsert({
    where: {
      onboardingId_questionId: {
        onboardingId: input.onboardingId,
        questionId: input.questionId,
      },
    },
    create: {
      onboardingId: input.onboardingId,
      questionId: input.questionId,
      respondedByPortalUserId: input.portalUserId,
      contactId: input.contactId,
      valueText: validated.valueText,
      valueJson: validated.valueJson ?? undefined,
      reviewStatus: "PENDING",
      updatedAt: new Date(),
    },
    update: {
      respondedByPortalUserId: input.portalUserId,
      contactId: input.contactId,
      valueText: validated.valueText,
      valueJson: validated.valueJson ?? undefined,
      reviewStatus: existing?.reviewStatus === "NEEDS_CLARIFICATION" ? "PENDING" : undefined,
      updatedAt: new Date(),
    },
  });

  await prisma.agencyProjectOnboarding.update({
    where: { id: input.onboardingId },
    data: { lastClientActivityAt: new Date() },
  });

  await recordOnboardingActivity({
    onboardingId: input.onboardingId,
    type: "QUESTION_ANSWERED",
    summary: `Answered: ${question.label}.`,
    actorPortalUserId: input.portalUserId,
    entityType: "AgencyOnboardingQuestion",
    entityId: question.id,
    clientVisible: true,
  });

  await recalculateOnboardingState(input.onboardingId);
  return response;
}

export async function reviewOnboardingResponse(input: {
  responseId: string;
  decision: "ACCEPTED" | "NEEDS_CLARIFICATION";
  actorUserId: string;
  reviewNote?: string | null;
  expectedUpdatedAt?: Date;
}) {
  const response = await prisma.agencyOnboardingResponse.findUniqueOrThrow({
    where: { id: input.responseId },
    include: { question: true },
  });

  if (
    input.expectedUpdatedAt &&
    response.updatedAt.getTime() !== input.expectedUpdatedAt.getTime()
  ) {
    throw new Error("Response changed since you opened it. Refresh and try again.");
  }

  const result = await prisma.agencyOnboardingResponse.updateMany({
    where: {
      id: response.id,
      ...(input.expectedUpdatedAt ? { updatedAt: input.expectedUpdatedAt } : {}),
    },
    data: {
      reviewStatus: input.decision,
      reviewNote: input.reviewNote?.trim() || null,
      reviewedById: input.actorUserId,
      reviewedAt: new Date(),
    },
  });

  if (result.count === 0) {
    throw new Error("Response changed since you opened it. Refresh and try again.");
  }

  const updated = await prisma.agencyOnboardingResponse.findUniqueOrThrow({
    where: { id: response.id },
  });

  await recordOnboardingActivity({
    onboardingId: response.onboardingId,
    type: input.decision === "ACCEPTED" ? "RESPONSE_ACCEPTED" : "CLARIFICATION_REQUESTED",
    summary: `${response.question.label}: ${input.decision.replace(/_/g, " ").toLowerCase()}.`,
    actorUserId: input.actorUserId,
    entityType: "AgencyOnboardingResponse",
    entityId: response.id,
    clientVisible: true,
  });

  if (input.decision === "NEEDS_CLARIFICATION" && input.reviewNote?.trim()) {
    void sendClarificationEmail({
      onboardingId: response.onboardingId,
      itemLabel: response.question.label,
      message: input.reviewNote.trim(),
    }).catch((err) => console.error("[onboarding:clarification-email]", err));
  }

  await recalculateOnboardingState(response.onboardingId);
  return updated;
}

export async function attachOnboardingFile(input: {
  onboardingId: string;
  projectId: string;
  questionId?: string | null;
  requirementId?: string | null;
  portalUserId: string;
  filename: string;
  mimeType: string;
  buffer: Buffer;
}) {
  const project = await prisma.agencyProject.findUniqueOrThrow({
    where: { id: input.projectId },
    select: { ownerId: true },
  });

  const file = await uploadAgencyFile({
    projectId: input.projectId,
    filename: input.filename,
    mimeType: input.mimeType,
    buffer: input.buffer,
    createdById: project.ownerId,
  });

  await prisma.agencyOnboardingFileSubmission.updateMany({
    where: {
      onboardingId: input.onboardingId,
      supersededAt: null,
      ...(input.questionId ? { questionId: input.questionId } : {}),
      ...(input.requirementId ? { requirementId: input.requirementId } : {}),
    },
    data: { supersededAt: new Date() },
  });

  const submission = await prisma.agencyOnboardingFileSubmission.create({
    data: {
      onboardingId: input.onboardingId,
      questionId: input.questionId ?? null,
      requirementId: input.requirementId ?? null,
      projectFileId: file.id,
      submittedByPortalUserId: input.portalUserId,
    },
  });

  if (input.requirementId) {
    await markRequirementReceived({
      requirementId: input.requirementId,
      actorPortalUserId: input.portalUserId,
    });
  }

  await recordOnboardingActivity({
    onboardingId: input.onboardingId,
    type: "FILE_UPLOADED",
    summary: `File uploaded: ${input.filename}.`,
    actorPortalUserId: input.portalUserId,
    entityType: "AgencyProjectFile",
    entityId: file.id,
    clientVisible: true,
  });

  await prisma.agencyProjectOnboarding.update({
    where: { id: input.onboardingId },
    data: { lastClientActivityAt: new Date() },
  });

  await recalculateOnboardingState(input.onboardingId);
  return { file, submission };
}

export async function listProjectRequirements(input: {
  projectId: string;
  onboardingId?: string;
  status?: Prisma.AgencyClientRequirementWhereInput["status"];
  clientVisibleOnly?: boolean;
}) {
  return prisma.agencyClientRequirement.findMany({
    where: {
      projectId: input.projectId,
      ...(input.onboardingId ? { onboardingId: input.onboardingId } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.clientVisibleOnly ? { clientVisible: true } : {}),
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
    include: {
      milestone: { select: { id: true, title: true } },
      fileSubmissions: {
        where: { supersededAt: null },
        include: { projectFile: { select: { id: true, filename: true, mimeType: true } } },
      },
    },
  });
}

export async function countAwaitingClientRequirements(projectId?: string) {
  return prisma.agencyClientRequirement.count({
    where: {
      ...(projectId ? { projectId } : {}),
      status: { in: ["REQUESTED", "NEEDS_CLARIFICATION"] },
      clientVisible: true,
      project: {
        status: { notIn: ["COMPLETED", "CANCELLED"] },
        clientVisibilityEnabled: true,
      },
    },
  });
}
