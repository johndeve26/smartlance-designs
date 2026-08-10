import { prisma } from "@/lib/db";
import { calculateTaskProgressPercent } from "@/lib/agency/progress";
import { AGENCY_SERVICE_TYPE_LABELS } from "@/lib/agency/constants";
import { assertProjectAccess, listAccessibleProjectIds } from "@/lib/portal/access";
import { getPortalAttentionItems } from "@/lib/portal/attention";
import { getPortalTimeline } from "@/lib/portal/timeline";
import { getPortalProjectChangeRequests } from "@/lib/portal/change-requests";
import {
  PORTAL_DELIVERABLE_STATUS,
  PORTAL_MILESTONE_STATUS,
  PORTAL_PROJECT_STATUS,
  PORTAL_REQUIREMENT_STATUS,
  formatPortalDate,
} from "@/lib/portal/status-labels";
import { getPortalBillingHome } from "@/lib/portal/billing";

export async function getPortalProjectWorkspace(portalUserId: string, projectId: string) {
  await assertProjectAccess({ projectId, portalUserId });

  const project = await prisma.agencyProject.findFirst({
    where: { id: projectId, clientVisibilityEnabled: true },
    select: {
      id: true,
      projectNumber: true,
      name: true,
      serviceType: true,
      customServiceName: true,
      status: true,
      summary: true,
      startDate: true,
      targetDueDate: true,
      primaryContact: {
        select: { displayName: true, firstName: true, lastName: true, email: true },
      },
      owner: { select: { name: true, email: true } },
      milestones: {
        where: { clientVisible: true },
        orderBy: { position: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          dueDate: true,
          completedAt: true,
          position: true,
        },
      },
      requirements: {
        where: { clientVisible: true },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          status: true,
          dueDate: true,
        },
      },
      deliverables: {
        where: { clientVisible: true },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          versions: {
            orderBy: { versionNumber: "desc" },
            take: 1,
            select: {
              id: true,
              externalUrl: true,
              file: { select: { id: true, filename: true, mimeType: true } },
            },
          },
          reviews: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { decision: true, comment: true, createdAt: true },
          },
        },
      },
      tasks: {
        where: { clientVisible: true },
        select: { status: true },
      },
      updates: {
        where: { clientVisible: true },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          title: true,
          body: true,
          createdAt: true,
          createdBy: { select: { name: true } },
        },
      },
    },
  });

  if (!project) return null;

  const [attention, timeline, changes, onboarding, billing] = await Promise.all([
    getPortalAttentionItems(portalUserId, 30),
    getPortalTimeline({ portalUserId, projectId, limit: 20 }),
    getPortalProjectChangeRequests(portalUserId, projectId).catch(() => []),
    prisma.agencyProjectOnboarding.findFirst({
      where: {
        projectId,
        status: { notIn: ["CANCELLED"] },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, status: true },
    }),
    getPortalBillingHome(portalUserId).catch(() => null),
  ]);

  const projectAttention = attention.filter((a) => a.projectId === projectId && a.canAct);
  const progressPercent =
    project.tasks.length > 0
      ? calculateTaskProgressPercent(project.tasks)
      : project.milestones.length
        ? Math.round(
            (project.milestones.filter((m) => m.status === "COMPLETED").length /
              project.milestones.length) *
              100,
          )
        : 0;

  const currentMilestone =
    project.milestones.find((m) => m.status === "IN_PROGRESS" || m.status === "CLIENT_REVIEW") ??
    project.milestones.find((m) => m.status !== "COMPLETED");

  const needsFromYou = project.requirements
    .filter((r) => ["REQUESTED", "NEEDS_CLARIFICATION"].includes(r.status))
    .map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      statusLabel: PORTAL_REQUIREMENT_STATUS[r.status],
      dueLabel: formatPortalDate(r.dueDate),
    }));

  const awaitingApproval = project.deliverables
    .filter((d) => ["READY_FOR_REVIEW", "CHANGES_REQUESTED"].includes(d.status))
    .map((d) => ({
      id: d.id,
      title: d.title,
      statusLabel: PORTAL_DELIVERABLE_STATUS[d.status],
    }));

  const projectInvoices =
    billing?.rows.filter((r) => r.invoice.projectId === projectId && r.invoice.amountDueMinor > 0) ??
    [];

  return {
    project: {
      id: project.id,
      projectNumber: project.projectNumber,
      name: project.name,
      serviceLabel:
        project.serviceType === "OTHER" && project.customServiceName
          ? project.customServiceName
          : AGENCY_SERVICE_TYPE_LABELS[project.serviceType],
      statusLabel: PORTAL_PROJECT_STATUS[project.status],
      summary: project.summary,
      progressPercent,
      currentStage: currentMilestone?.title ?? null,
      targetDueLabel: formatPortalDate(project.targetDueDate),
      contact: project.owner
        ? { name: project.owner.name, email: project.owner.email }
        : null,
    },
    milestones: project.milestones.map((m) => ({
      id: m.id,
      title: m.title,
      status: m.status,
      statusLabel: PORTAL_MILESTONE_STATUS[m.status],
      dueLabel: formatPortalDate(m.dueDate),
      isComplete: m.status === "COMPLETED",
      isCurrent: m.id === currentMilestone?.id,
    })),
    needsFromYou,
    awaitingApproval,
    deliverables: project.deliverables.map((d) => ({
      id: d.id,
      title: d.title,
      description: d.description,
      status: d.status,
      statusLabel: PORTAL_DELIVERABLE_STATUS[d.status],
      version: d.versions[0] ?? null,
      latestReview: d.reviews[0] ?? null,
    })),
    latestUpdate: project.updates[0]
      ? {
          title: project.updates[0].title,
          body: project.updates[0].body,
          dateLabel: formatPortalDate(project.updates[0].createdAt),
          author: project.updates[0].createdBy.name,
        }
      : null,
    attention: projectAttention,
    timeline,
    changes,
    hasOnboarding: Boolean(onboarding && onboarding.status !== "COMPLETED"),
    onboardingHref: onboarding ? `/portal/projects/${projectId}/onboarding` : null,
    outstandingInvoices: projectInvoices.length,
    quickActions: {
      onboarding: Boolean(onboarding && !["COMPLETED", "CANCELLED"].includes(onboarding.status)),
      changes: true,
      files: true,
      billing: projectInvoices.length > 0,
    },
  };
}

export async function listPortalProjectIds(portalUserId: string) {
  return listAccessibleProjectIds(portalUserId);
}
