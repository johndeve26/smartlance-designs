import { prisma } from "@/lib/db";
import {
  CARE_EVENT_STATUS,
  CARE_EVENT_TYPE,
  MANAGED_WEBSITE_STATUS,
  OBSERVED_STATUS,
  SUPPORT_CATEGORY,
  SUPPORT_PRIORITY,
  SUPPORT_STATUS,
  WEBSITE_CARE_STATUS,
  WEBSITE_PLATFORM,
} from "@/lib/client-success/constants";
import { visitWebsiteHref } from "@/lib/client-success/domain";
import {
  listAccessibleWebsiteIds,
  getWebsiteAccessRole,
  websiteRoleCanSubmitSupport,
} from "@/lib/client-success/website-access";
import { formatPortalDate } from "@/lib/portal/status-labels";

export type PortalWebsiteSummary = {
  id: string;
  name: string;
  domain: string;
  productionUrl: string | null;
  visitHref: string;
  statusLabel: string;
  careStatusLabel: string;
  carePlanName: string | null;
  lastMaintenanceLabel: string | null;
  openSupportCount: number;
  href: string;
};

function toWebsiteSummary(
  w: {
    id: string;
    name: string;
    domain: string;
    productionUrl: string | null;
    status: string;
    careStatus: string;
    carePlanName: string | null;
    lastMaintenanceAt: Date | null;
  },
  openSupportCount: number,
): PortalWebsiteSummary {
  return {
    id: w.id,
    name: w.name,
    domain: w.domain,
    productionUrl: w.productionUrl,
    visitHref: visitWebsiteHref(w),
    statusLabel: MANAGED_WEBSITE_STATUS[w.status] ?? w.status,
    careStatusLabel: WEBSITE_CARE_STATUS[w.careStatus] ?? w.careStatus,
    carePlanName: w.carePlanName,
    lastMaintenanceLabel: formatPortalDate(w.lastMaintenanceAt),
    openSupportCount,
    href: `/portal/websites/${w.id}`,
  };
}

export async function listPortalWebsites(portalUserId: string) {
  const ids = await listAccessibleWebsiteIds(portalUserId);
  if (!ids.length) return [];

  const [websites, supportCounts] = await Promise.all([
    prisma.agencyManagedWebsite.findMany({
      where: { id: { in: ids }, archivedAt: null },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        domain: true,
        productionUrl: true,
        status: true,
        careStatus: true,
        carePlanName: true,
        lastMaintenanceAt: true,
      },
    }),
    prisma.agencySupportRequest.groupBy({
      by: ["websiteId"],
      where: {
        websiteId: { in: ids },
        status: { in: ["OPEN", "IN_PROGRESS", "WAITING_ON_CLIENT"] },
      },
      _count: { _all: true },
    }),
  ]);

  const countByWebsite = new Map(supportCounts.map((r) => [r.websiteId, r._count._all]));

  return websites.map((w) => toWebsiteSummary(w, countByWebsite.get(w.id) ?? 0));
}

export async function getPortalWebsiteDetail(portalUserId: string, websiteId: string) {
  const ids = await listAccessibleWebsiteIds(portalUserId);
  if (!ids.includes(websiteId)) return null;

  const [website, role, openSupport, recentCare, recentActivity] = await Promise.all([
    prisma.agencyManagedWebsite.findFirst({
      where: { id: websiteId, archivedAt: null },
      select: {
        id: true,
        name: true,
        domain: true,
        productionUrl: true,
        platform: true,
        status: true,
        careStatus: true,
        carePlanName: true,
        launchDate: true,
        clientSummary: true,
        clientVisibleNotes: true,
        nextMaintenanceAt: true,
        lastMaintenanceAt: true,
        observedStatus: true,
        statusSource: true,
        lastCheckedAt: true,
        sslStatusLabel: true,
        hostingLabel: true,
        primaryProjectId: true,
        primaryProject: { select: { id: true, name: true, projectNumber: true } },
      },
    }),
    getWebsiteAccessRole({ websiteId, portalUserId }),
    prisma.agencySupportRequest.findMany({
      where: {
        websiteId,
        status: { in: ["OPEN", "IN_PROGRESS", "WAITING_ON_CLIENT", "RESOLVED"] },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        supportNumber: true,
        subject: true,
        status: true,
        waitingOn: true,
        updatedAt: true,
      },
    }),
    prisma.agencyWebsiteCareEvent.findMany({
      where: { websiteId, clientVisible: true, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        type: true,
        clientSummary: true,
        completedAt: true,
      },
    }),
    prisma.agencyWebsiteCareEvent.findMany({
      where: { websiteId, clientVisible: true },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, createdAt: true, type: true },
    }),
  ]);

  if (!website) return null;

  const observedLabel =
    website.statusSource === "MONITORING_PROVIDER" || website.statusSource === "MANUAL"
      ? website.observedStatus
        ? OBSERVED_STATUS[website.observedStatus]
        : "Status unavailable"
      : "Not monitored";

  return {
    website: {
      ...website,
      visitHref: visitWebsiteHref(website),
      statusLabel: MANAGED_WEBSITE_STATUS[website.status] ?? website.status,
      careStatusLabel: WEBSITE_CARE_STATUS[website.careStatus] ?? website.careStatus,
      platformLabel: website.platform ? WEBSITE_PLATFORM[website.platform] ?? website.platform : null,
      launchLabel: formatPortalDate(website.launchDate),
      nextMaintenanceLabel: formatPortalDate(website.nextMaintenanceAt),
      lastMaintenanceLabel: formatPortalDate(website.lastMaintenanceAt),
      lastCheckedLabel: formatPortalDate(website.lastCheckedAt),
      observedLabel,
      canSubmitSupport: websiteRoleCanSubmitSupport(role),
    },
    openSupport: openSupport.map((s) => ({
      id: s.id,
      supportNumber: s.supportNumber,
      subject: s.subject,
      statusLabel: SUPPORT_STATUS[s.status] ?? s.status,
      updatedLabel: formatPortalDate(s.updatedAt),
      href: `/portal/support/${s.id}`,
    })),
    recentCare: recentCare.map((e) => ({
      id: e.id,
      title: e.title,
      typeLabel: CARE_EVENT_TYPE[e.type] ?? e.type,
      summary: e.clientSummary,
      dateLabel: formatPortalDate(e.completedAt),
    })),
    recentActivity: recentActivity.map((e) => ({
      id: e.id,
      title: e.title,
      typeLabel: CARE_EVENT_TYPE[e.type] ?? e.type,
      dateLabel: formatPortalDate(e.createdAt),
    })),
  };
}

export async function listPortalWebsiteCareEvents(portalUserId: string, websiteId: string, limit = 20) {
  const ids = await listAccessibleWebsiteIds(portalUserId);
  if (!ids.includes(websiteId)) return [];

  const events = await prisma.agencyWebsiteCareEvent.findMany({
    where: { websiteId, clientVisible: true },
    orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      title: true,
      type: true,
      status: true,
      clientSummary: true,
      startedAt: true,
      completedAt: true,
    },
  });

  return events.map((e) => ({
    id: e.id,
    title: e.title,
    typeLabel: CARE_EVENT_TYPE[e.type] ?? e.type,
    statusLabel: CARE_EVENT_STATUS[e.status] ?? e.status,
    summary: e.clientSummary,
    dateLabel: formatPortalDate(e.completedAt ?? e.startedAt),
  }));
}

export async function listPortalWebsiteSupport(portalUserId: string, websiteId: string) {
  const ids = await listAccessibleWebsiteIds(portalUserId);
  if (!ids.includes(websiteId)) return { open: [], resolved: [] };

  const rows = await prisma.agencySupportRequest.findMany({
    where: { websiteId },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: {
      id: true,
      supportNumber: true,
      subject: true,
      status: true,
      category: true,
      priority: true,
      waitingOn: true,
      updatedAt: true,
      createdAt: true,
    },
  });

  const map = (s: (typeof rows)[number]) => ({
    id: s.id,
    supportNumber: s.supportNumber,
    subject: s.subject,
    statusLabel: SUPPORT_STATUS[s.status] ?? s.status,
    categoryLabel: SUPPORT_CATEGORY[s.category] ?? s.category,
    priorityLabel: SUPPORT_PRIORITY[s.priority] ?? s.priority,
    updatedLabel: formatPortalDate(s.updatedAt),
    submittedLabel: formatPortalDate(s.createdAt),
    needsResponse: s.status === "WAITING_ON_CLIENT",
    href: `/portal/support/${s.id}`,
  });

  return {
    open: rows.filter((s) => ["OPEN", "IN_PROGRESS", "WAITING_ON_CLIENT"].includes(s.status)).map(map),
    resolved: rows.filter((s) => ["RESOLVED", "CLOSED"].includes(s.status)).map(map),
  };
}
