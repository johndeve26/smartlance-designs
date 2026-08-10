import { prisma } from "@/lib/db";
import { calculateTaskProgressPercent } from "@/lib/agency/progress";
import { AGENCY_SERVICE_TYPE_LABELS } from "@/lib/agency/constants";
import { listAccessibleProjectIds } from "@/lib/portal/access";
import { getPortalAttentionItems } from "@/lib/portal/attention";
import { getPortalTimeline } from "@/lib/portal/timeline";
import { listPortalWebsites, type PortalWebsiteSummary } from "@/lib/portal/websites";
import { PORTAL_PROJECT_STATUS, formatPortalDate, portalGreeting } from "@/lib/portal/status-labels";

export type PortalProjectSummary = {
  id: string;
  projectNumber: string;
  name: string;
  serviceLabel: string;
  status: string;
  statusLabel: string;
  progressPercent: number;
  currentStage: string | null;
  targetDueDate: Date | null;
  targetDueLabel: string | null;
  nextAction: string | null;
  href: string;
};

export async function getPortalContactDisplayName(portalUserId: string) {
  const user = await prisma.clientPortalUser.findUnique({
    where: { id: portalUserId },
    select: {
      contact: {
        select: {
          displayName: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
  const c = user?.contact;
  return (
    c?.displayName?.trim() ||
    [c?.firstName, c?.lastName].filter(Boolean).join(" ") ||
    null
  );
}

export async function getPortalHome(portalUserId: string) {
  const projectIds = await listAccessibleProjectIds(portalUserId);

  const [displayName, attention, timeline, projectsRaw, attentionByProject, websitesRaw] =
    await Promise.all([
      getPortalContactDisplayName(portalUserId),
      getPortalAttentionItems(portalUserId, 15),
      getPortalTimeline({ portalUserId, limit: 8 }),
      projectIds.length
        ? prisma.agencyProject.findMany({
            where: {
              id: { in: projectIds },
              clientVisibilityEnabled: true,
              status: { notIn: ["CANCELLED", "COMPLETED"] },
            },
            orderBy: { updatedAt: "desc" },
            take: 6,
            select: {
              id: true,
              projectNumber: true,
              name: true,
              serviceType: true,
              customServiceName: true,
              status: true,
              targetDueDate: true,
              milestones: {
                where: { clientVisible: true },
                orderBy: { position: "asc" },
                select: { title: true, status: true },
              },
              tasks: {
                where: { clientVisible: true },
                select: { status: true },
              },
            },
          })
        : Promise.resolve([]),
      getPortalAttentionItems(portalUserId, 30),
      listPortalWebsites(portalUserId),
    ]);

  const nextByProject = new Map<string, string>();
  for (const item of attentionByProject) {
    if (item.projectId && item.canAct && !nextByProject.has(item.projectId)) {
      nextByProject.set(item.projectId, item.title);
    }
  }

  const projects: PortalProjectSummary[] = projectsRaw.map((p) => {
    const milestones = p.milestones;
    const current =
      milestones.find((m) => m.status === "IN_PROGRESS" || m.status === "CLIENT_REVIEW") ??
      milestones.find((m) => m.status !== "COMPLETED");
    const progressPercent =
      p.tasks.length > 0
        ? calculateTaskProgressPercent(p.tasks)
        : milestones.length
          ? Math.round(
              (milestones.filter((m) => m.status === "COMPLETED").length / milestones.length) *
                100,
            )
          : 0;

    return {
      id: p.id,
      projectNumber: p.projectNumber,
      name: p.name,
      serviceLabel:
        p.serviceType === "OTHER" && p.customServiceName
          ? p.customServiceName
          : AGENCY_SERVICE_TYPE_LABELS[p.serviceType],
      status: p.status,
      statusLabel: PORTAL_PROJECT_STATUS[p.status],
      progressPercent,
      currentStage: current?.title ?? null,
      targetDueDate: p.targetDueDate,
      targetDueLabel: formatPortalDate(p.targetDueDate),
      nextAction: nextByProject.get(p.id) ?? null,
      href: `/portal/projects/${p.id}`,
    };
  });

  const websites: PortalWebsiteSummary[] = websitesRaw.slice(0, 4);

  const subtitle =
    projects.length > 0
      ? "Here's what's happening with your projects."
      : websites.length > 0
        ? "Here's what's happening with your websites."
        : "Here's what's happening with your Smartlance account.";

  return {
    greeting: portalGreeting(displayName),
    subtitle,
    attention,
    attentionCount: attention.filter((a) => a.canAct).length,
    projects,
    websites,
    timeline,
    allCaughtUp: attention.filter((a) => a.canAct).length === 0,
  };
}

export async function listPortalProjects(portalUserId: string) {
  const projectIds = await listAccessibleProjectIds(portalUserId);
  if (!projectIds.length) return [];

  const projects = await prisma.agencyProject.findMany({
    where: { id: { in: projectIds }, clientVisibilityEnabled: true },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      projectNumber: true,
      name: true,
      serviceType: true,
      customServiceName: true,
      status: true,
      targetDueDate: true,
      milestones: {
        where: { clientVisible: true },
        orderBy: { position: "asc" },
        select: { status: true },
      },
      tasks: { where: { clientVisible: true }, select: { status: true } },
    },
  });

  return projects.map((p) => ({
    id: p.id,
    projectNumber: p.projectNumber,
    name: p.name,
    serviceLabel:
      p.serviceType === "OTHER" && p.customServiceName
        ? p.customServiceName
        : AGENCY_SERVICE_TYPE_LABELS[p.serviceType],
    statusLabel: PORTAL_PROJECT_STATUS[p.status],
    progressPercent:
      p.tasks.length > 0
        ? calculateTaskProgressPercent(p.tasks)
        : p.milestones.length
          ? Math.round(
              (p.milestones.filter((m) => m.status === "COMPLETED").length /
                p.milestones.length) *
                100,
            )
          : 0,
    targetDueLabel: formatPortalDate(p.targetDueDate),
    href: `/portal/projects/${p.id}`,
  }));
}
