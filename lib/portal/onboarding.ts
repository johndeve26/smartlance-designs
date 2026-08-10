import { prisma } from "@/lib/db";
import { assertProjectAccess, listAccessibleProjectIds } from "@/lib/portal/access";
import { ACTIVE_ONBOARDING_STATUSES, ONBOARDING_STATUS_LABELS } from "@/lib/onboarding/constants";
import { loadProgressContext } from "@/lib/onboarding/onboarding";
import { AGENCY_REQUIREMENT_STATUS_LABELS, AGENCY_REQUIREMENT_TYPE_LABELS } from "@/lib/agency/constants";

export async function getPortalProjectOnboarding(portalUserId: string, projectId: string) {
  await assertProjectAccess({ projectId, portalUserId });

  const onboarding = await prisma.agencyProjectOnboarding.findFirst({
    where: {
      projectId,
      status: { in: [...ACTIVE_ONBOARDING_STATUSES, "COMPLETED"] },
    },
    orderBy: { createdAt: "desc" },
    include: {
      sections: { where: { clientVisible: true }, orderBy: { position: "asc" } },
      questions: {
        where: { clientVisible: true },
        orderBy: [{ sectionId: "asc" }, { position: "asc" }],
      },
      responses: true,
      requirements: {
        where: { clientVisible: true },
        orderBy: { createdAt: "asc" },
        include: {
          fileSubmissions: {
            where: { supersededAt: null },
            include: { projectFile: { select: { id: true, filename: true, mimeType: true } } },
          },
        },
      },
      owner: { select: { name: true, email: true } },
    },
  });

  if (!onboarding) return null;

  const ctx = await loadProgressContext(onboarding.id);

  return {
    onboarding: {
      id: onboarding.id,
      status: onboarding.status,
      statusLabel: ONBOARDING_STATUS_LABELS[onboarding.status],
      clientMessage: onboarding.clientMessage,
      targetCompletionDate: onboarding.targetCompletionDate,
      submittedAt: onboarding.submittedAt,
      completedAt: onboarding.completedAt,
      owner: onboarding.owner,
    },
    sections: onboarding.sections,
    questions: onboarding.questions.map((q) => {
      const response = onboarding.responses.find((r) => r.questionId === q.id);
      const fileCount = ctx.fileCountsByQuestionId.get(q.id) ?? 0;
      return {
        ...q,
        response: response
          ? {
              id: response.id,
              valueText: response.valueText,
              valueJson: response.valueJson,
              reviewStatus: response.reviewStatus,
              reviewNote: response.reviewNote,
              updatedAt: response.updatedAt,
            }
          : null,
        fileCount,
      };
    }),
    requirements: onboarding.requirements.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      type: r.type,
      typeLabel: AGENCY_REQUIREMENT_TYPE_LABELS[r.type],
      status: r.status,
      statusLabel: AGENCY_REQUIREMENT_STATUS_LABELS[r.status],
      required: r.required,
      dueDate: r.dueDate,
      clientReviewNote: r.clientReviewNote,
      accessMetadataJson: r.accessMetadataJson,
      files: r.fileSubmissions.map((s) => s.projectFile),
    })),
    progress: ctx.progress,
  };
}

export async function getPortalOnboardingAttention(portalUserId: string) {
  const projectIds = await listAccessibleProjectIds(portalUserId);
  if (!projectIds.length) return [];

  const onboardings = await prisma.agencyProjectOnboarding.findMany({
    where: {
      projectId: { in: projectIds },
      status: { in: ACTIVE_ONBOARDING_STATUSES },
    },
    include: {
      project: { select: { id: true, name: true, projectNumber: true } },
    },
    take: 10,
  });

  const items = [];
  for (const ob of onboardings) {
    const ctx = await loadProgressContext(ob.id);
    const remaining =
      ctx.progress.requiredQuestionsTotal +
      ctx.progress.requiredRequirementsTotal -
      ctx.progress.requiredQuestionsComplete -
      ctx.progress.requiredRequirementsComplete;

    if (remaining > 0 || ctx.progress.clarificationsOutstanding > 0) {
      items.push({
        kind: "onboarding" as const,
        onboardingId: ob.id,
        projectId: ob.project.id,
        projectName: ob.project.name,
        projectNumber: ob.project.projectNumber,
        title:
          ctx.progress.clarificationsOutstanding > 0
            ? "Clarification needed on onboarding"
            : "Finish project onboarding",
        detail:
          ctx.progress.clarificationsOutstanding > 0
            ? `${ctx.progress.clarificationsOutstanding} clarification(s) needed`
            : `${remaining} required item(s) remaining`,
        href: `/portal/projects/${ob.project.id}/onboarding`,
      });
    }
  }

  return items;
}
