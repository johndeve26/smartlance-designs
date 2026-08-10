import { prisma } from "@/lib/db";
import {
  SUPPORT_CATEGORY,
  SUPPORT_PRIORITY,
  SUPPORT_STATUS,
} from "@/lib/client-success/constants";
import {
  listAccessibleWebsiteIds,
  getWebsiteAccessRole,
  websiteRoleCanRespondSupport,
  websiteRoleCanSubmitSupport,
} from "@/lib/client-success/website-access";
import { assertSupportView } from "@/lib/client-success/support";
import { formatPortalDate } from "@/lib/portal/status-labels";
import { PORTAL_CHANGE_STATUS } from "@/lib/portal/status-labels";

export type PortalSupportSummary = {
  id: string;
  supportNumber: string;
  subject: string;
  statusLabel: string;
  websiteName: string;
  websiteDomain: string;
  updatedLabel: string;
  submittedLabel: string;
  needsResponse: boolean;
  href: string;
};

export async function getPortalSupportAttention(portalUserId: string) {
  const websiteIds = await listAccessibleWebsiteIds(portalUserId);
  if (!websiteIds.length) return [];

  const rows = await prisma.agencySupportRequest.findMany({
    where: {
      websiteId: { in: websiteIds },
      status: "WAITING_ON_CLIENT",
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
    include: {
      website: { select: { name: true, domain: true } },
    },
  });

  const items = [];
  for (const row of rows) {
    const role = await getWebsiteAccessRole({ websiteId: row.websiteId, portalUserId });
    if (!websiteRoleCanRespondSupport(role)) continue;
    items.push({
      supportRequestId: row.id,
      supportNumber: row.supportNumber,
      subject: row.subject,
      websiteName: row.website.name,
      websiteDomain: row.website.domain,
      href: `/portal/support/${row.id}`,
    });
  }
  return items;
}

export async function listPortalSupportHome(portalUserId: string) {
  const websiteIds = await listAccessibleWebsiteIds(portalUserId);
  if (!websiteIds.length) {
    return { needsResponse: [], open: [], resolved: [] };
  }

  const rows = await prisma.agencySupportRequest.findMany({
    where: { websiteId: { in: websiteIds } },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: { website: { select: { name: true, domain: true } } },
  });

  const toSummary = (s: (typeof rows)[number]): PortalSupportSummary => ({
    id: s.id,
    supportNumber: s.supportNumber,
    subject: s.subject,
    statusLabel: SUPPORT_STATUS[s.status] ?? s.status,
    websiteName: s.website.name,
    websiteDomain: s.website.domain,
    updatedLabel: formatPortalDate(s.updatedAt) ?? "",
    submittedLabel: formatPortalDate(s.createdAt) ?? "",
    needsResponse: s.status === "WAITING_ON_CLIENT",
    href: `/portal/support/${s.id}`,
  });

  const needsResponse = [];
  for (const s of rows.filter((r) => r.status === "WAITING_ON_CLIENT")) {
    const role = await getWebsiteAccessRole({ websiteId: s.websiteId, portalUserId });
    if (websiteRoleCanRespondSupport(role)) needsResponse.push(toSummary(s));
  }

  return {
    needsResponse,
    open: rows
      .filter((s) => ["OPEN", "IN_PROGRESS"].includes(s.status))
      .map(toSummary),
    resolved: rows
      .filter((s) => ["RESOLVED", "CLOSED"].includes(s.status))
      .slice(0, 15)
      .map(toSummary),
  };
}

export async function getPortalSupportDetail(portalUserId: string, supportRequestId: string) {
  await assertSupportView({ supportRequestId, portalUserId });

  const sr = await prisma.agencySupportRequest.findUniqueOrThrow({
    where: { id: supportRequestId },
    include: {
      website: { select: { id: true, name: true, domain: true } },
      changeRequest: {
        select: {
          id: true,
          changeRequestNumber: true,
          title: true,
          status: true,
          projectId: true,
        },
      },
      messages: {
        where: { clientVisible: true },
        orderBy: { createdAt: "asc" },
        include: {
          portalUser: { select: { email: true, contact: { select: { displayName: true, firstName: true } } } },
          adminUser: { select: { name: true } },
        },
      },
      files: {
        where: { clientVisible: true },
        include: {
          projectFile: { select: { id: true, filename: true, mimeType: true, byteSize: true } },
        },
      },
    },
  });

  const role = await getWebsiteAccessRole({ websiteId: sr.websiteId, portalUserId });

  return {
    request: {
      id: sr.id,
      supportNumber: sr.supportNumber,
      subject: sr.subject,
      description: sr.description,
      status: sr.status,
      statusLabel: SUPPORT_STATUS[sr.status] ?? sr.status,
      categoryLabel: SUPPORT_CATEGORY[sr.category] ?? sr.category,
      priorityLabel: SUPPORT_PRIORITY[sr.priority] ?? sr.priority,
      submittedLabel: formatPortalDate(sr.createdAt),
      resolvedLabel: formatPortalDate(sr.resolvedAt),
      website: sr.website,
      canReply: websiteRoleCanRespondSupport(role) && sr.status !== "CLOSED",
      canConfirmResolved: websiteRoleCanRespondSupport(role) && sr.status === "RESOLVED",
      canStillNeedHelp: websiteRoleCanRespondSupport(role) && sr.status === "RESOLVED",
    },
    messages: sr.messages.map((m) => ({
      id: m.id,
      authorLabel:
        m.authorType === "CLIENT"
          ? m.portalUser?.contact.displayName ?? m.portalUser?.contact.firstName ?? "You"
          : "Smartlance",
      body: m.body,
      dateLabel: formatPortalDate(m.createdAt),
      isClient: m.authorType === "CLIENT",
    })),
    files: sr.files.map((f) => ({
      id: f.projectFile.id,
      name: f.projectFile.filename,
      mimeType: f.projectFile.mimeType,
      byteSize: f.projectFile.byteSize,
      downloadHref: `/api/agency/files/${f.projectFile.id}`,
    })),
    changeRequest: sr.changeRequest
      ? {
          id: sr.changeRequest.id,
          number: sr.changeRequest.changeRequestNumber,
          title: sr.changeRequest.title,
          statusLabel: PORTAL_CHANGE_STATUS[sr.changeRequest.status] ?? sr.changeRequest.status,
          href: `/portal/projects/${sr.changeRequest.projectId}/changes/${sr.changeRequest.id}`,
          needsScopeReview: sr.changeRequest.status === "AWAITING_CLIENT_APPROVAL",
        }
      : null,
  };
}

export async function listPortalWebsitesForSupportForm(portalUserId: string) {
  const websiteIds = await listAccessibleWebsiteIds(portalUserId);
  if (!websiteIds.length) return [];

  const websites = await prisma.agencyManagedWebsite.findMany({
    where: { id: { in: websiteIds }, archivedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true, domain: true, primaryProjectId: true },
  });

  const result = [];
  for (const w of websites) {
    const role = await getWebsiteAccessRole({ websiteId: w.id, portalUserId });
    if (websiteRoleCanSubmitSupport(role)) {
      result.push({ id: w.id, name: w.name, domain: w.domain, hasFileStorage: Boolean(w.primaryProjectId) });
    }
  }
  return result;
}
