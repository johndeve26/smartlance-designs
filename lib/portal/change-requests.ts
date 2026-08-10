import { prisma } from "@/lib/db";
import { assertProjectAccess } from "@/lib/portal/access";
import { getPortalUser } from "@/lib/portal/session";
import {
  CHANGE_REQUEST_CLASSIFICATION_LABELS,
  CHANGE_REQUEST_STATUS_LABELS,
} from "@/lib/change-requests/constants";
import {
  assertChangeRequestApproverAccess,
  assertChangeRequestViewAccess,
  hasChangeRequestApproverAccess,
} from "@/lib/change-requests/portal-access";
import { getProjectCommercialScopeSummary } from "@/lib/change-requests/commercial-summary";
import { formatMinorAmount } from "@/lib/money/format";

export async function getPortalProjectChangeRequests(portalUserId: string, projectId: string) {
  await assertProjectAccess({ projectId, portalUserId });

  const items = await prisma.agencyChangeRequest.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    include: {
      approval: {
        select: {
          approvedPriceImpactMinor: true,
          approvedTimelineImpactDays: true,
          currency: true,
        },
      },
      assessments: {
        where: { supersededAt: null, sentForApprovalAt: { not: null } },
        orderBy: { versionNumber: "desc" },
        take: 1,
        select: {
          clientScopeImpactSummary: true,
          scopeImpactSummary: true,
          priceImpactMinor: true,
          timelineImpactDays: true,
          currency: true,
          classification: true,
        },
      },
    },
  });

  return items.map((cr) => ({
    id: cr.id,
    changeRequestNumber: cr.changeRequestNumber,
    title: cr.title,
    status: cr.status,
    statusLabel: CHANGE_REQUEST_STATUS_LABELS[cr.status],
    classification: cr.classification,
    classificationLabel: CHANGE_REQUEST_CLASSIFICATION_LABELS[cr.classification],
    submittedAt: cr.submittedAt,
    approvedAt: cr.approvedAt,
    appliedAt: cr.appliedAt,
    implementedAt: cr.implementedAt,
    priceImpactMinor:
      cr.approval?.approvedPriceImpactMinor ?? cr.assessments[0]?.priceImpactMinor ?? null,
    timelineImpactDays:
      cr.approval?.approvedTimelineImpactDays ?? cr.assessments[0]?.timelineImpactDays ?? null,
    currency: cr.approval?.currency ?? cr.assessments[0]?.currency ?? cr.currency,
  }));
}

export async function getPortalChangeRequestDetail(
  portalUserId: string,
  projectId: string,
  changeRequestId: string,
) {
  await assertChangeRequestViewAccess({ changeRequestId, portalUserId });

  const cr = await prisma.agencyChangeRequest.findFirstOrThrow({
    where: { id: changeRequestId, projectId },
    include: {
      approval: true,
      decision: true,
      messages: {
        where: { clientVisible: true },
        orderBy: { createdAt: "asc" },
      },
      assessments: {
        where: { supersededAt: null },
        orderBy: { versionNumber: "desc" },
        take: 1,
      },
      workItems: {
        where: { clientVisible: true },
        orderBy: { position: "asc" },
      },
      project: {
        select: { id: true, name: true, projectNumber: true, targetDueDate: true },
      },
      proposalAcceptance: {
        select: {
          acceptedTotal: true,
          currency: true,
          acceptedAt: true,
          proposal: { select: { proposalNumber: true, title: true } },
        },
      },
    },
  });

  const canApprove = await hasChangeRequestApproverAccess({
    changeRequestId,
    portalUserId,
  });

  const commercial = await getProjectCommercialScopeSummary(projectId);
  const pendingAssessment = cr.assessments.find((a) => a.sentForApprovalAt) ?? cr.assessments[0];

  const priceImpactMinor =
    cr.approval?.approvedPriceImpactMinor ?? pendingAssessment?.priceImpactMinor ?? 0;
  const currency =
    cr.approval?.currency ?? pendingAssessment?.currency ?? commercial.currency;

  return {
    changeRequest: {
      id: cr.id,
      changeRequestNumber: cr.changeRequestNumber,
      title: cr.title,
      requestDescription: cr.requestDescription,
      status: cr.status,
      statusLabel: CHANGE_REQUEST_STATUS_LABELS[cr.status],
      classification: cr.classification,
      classificationLabel: CHANGE_REQUEST_CLASSIFICATION_LABELS[cr.classification],
      submittedAt: cr.submittedAt,
      approvedAt: cr.approvedAt,
      declinedAt: cr.declinedAt,
      appliedAt: cr.appliedAt,
      implementedAt: cr.implementedAt,
    },
    project: cr.project,
    baseline: cr.proposalAcceptance
      ? {
          source: "PROPOSAL_ACCEPTANCE" as const,
          proposalNumber: cr.proposalAcceptance.proposal.proposalNumber,
          proposalTitle: cr.proposalAcceptance.proposal.title,
          acceptedAt: cr.proposalAcceptance.acceptedAt,
          acceptedTotal: cr.proposalAcceptance.acceptedTotal.toString(),
          currency: cr.proposalAcceptance.currency,
        }
      : { source: "MANUAL_PROJECT" as const },
    assessment: pendingAssessment
      ? {
          clientScopeImpactSummary:
            pendingAssessment.clientScopeImpactSummary ?? pendingAssessment.scopeImpactSummary,
          timelineImpactDays: pendingAssessment.timelineImpactDays,
          timelineImpactSummary: pendingAssessment.timelineImpactSummary,
          priceImpactMinor: pendingAssessment.priceImpactMinor,
          currency: pendingAssessment.currency,
          classification: pendingAssessment.classification,
        }
      : null,
    approval: cr.approval,
    decision: cr.decision,
    messages: cr.messages,
    clientWorkItems: cr.workItems,
    commercial: {
      originalAcceptedValue: commercial.originalAcceptedValueMinor
        ? formatMinorAmount(commercial.originalAcceptedValueMinor, commercial.currency)
        : null,
      approvedChanges: formatMinorAmount(commercial.approvedChangesMinor, commercial.currency),
      currentApprovedValue: commercial.currentApprovedValueMinor
        ? formatMinorAmount(commercial.currentApprovedValueMinor, commercial.currency)
        : null,
      thisChangePrice: formatMinorAmount(priceImpactMinor, currency),
      currency,
    },
    canApprove: canApprove && cr.status === "AWAITING_CLIENT_APPROVAL",
    canRespondToClarification: cr.status === "NEEDS_CLARIFICATION",
  };
}

export async function getPortalChangeRequestAttention(portalUserId: string) {
  const projectIds = (
    await prisma.agencyProjectClientAccess.findMany({
      where: { portalUserId, revokedAt: null },
      select: { projectId: true },
    })
  ).map((a) => a.projectId);

  if (!projectIds.length) return [];

  const approverAccess = await prisma.agencyChangeRequestClientAccess.findMany({
    where: {
      portalUserId,
      role: "APPROVER",
      revokedAt: null,
      changeRequest: {
        status: "AWAITING_CLIENT_APPROVAL",
        projectId: { in: projectIds },
      },
    },
    include: {
      changeRequest: {
        select: {
          id: true,
          changeRequestNumber: true,
          title: true,
          projectId: true,
          project: { select: { name: true, projectNumber: true } },
          assessments: {
            where: { supersededAt: null, sentForApprovalAt: { not: null } },
            orderBy: { versionNumber: "desc" },
            take: 1,
            select: { priceImpactMinor: true, timelineImpactDays: true, currency: true },
          },
        },
      },
    },
  });

  return approverAccess.map((a) => ({
    changeRequestId: a.changeRequest.id,
    changeRequestNumber: a.changeRequest.changeRequestNumber,
    title: a.changeRequest.title,
    projectId: a.changeRequest.projectId,
    projectName: a.changeRequest.project.name,
    projectNumber: a.changeRequest.project.projectNumber,
    priceImpactMinor: a.changeRequest.assessments[0]?.priceImpactMinor ?? 0,
    timelineImpactDays: a.changeRequest.assessments[0]?.timelineImpactDays ?? 0,
    currency: a.changeRequest.assessments[0]?.currency ?? "USD",
    href: `/portal/projects/${a.changeRequest.projectId}/changes/${a.changeRequest.id}`,
  }));
}

export async function requirePortalChangeRequest(changeRequestId: string) {
  const user = await getPortalUser();
  if (!user) throw new Error("Not authenticated.");
  await assertChangeRequestViewAccess({ changeRequestId, portalUserId: user.id });
  const cr = await prisma.agencyChangeRequest.findUniqueOrThrow({
    where: { id: changeRequestId },
    select: { projectId: true },
  });
  return { user, projectId: cr.projectId };
}

export async function requirePortalChangeRequestApprover(changeRequestId: string) {
  const user = await getPortalUser();
  if (!user) throw new Error("Not authenticated.");
  await assertChangeRequestApproverAccess({ changeRequestId, portalUserId: user.id });
  const cr = await prisma.agencyChangeRequest.findUniqueOrThrow({
    where: { id: changeRequestId },
    select: { projectId: true, changeRequestNumber: true },
  });
  return { user, projectId: cr.projectId, changeRequestNumber: cr.changeRequestNumber };
}
