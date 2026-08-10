import { prisma } from "@/lib/db";
import { assertValidDomain, assertValidProductionUrl } from "@/lib/client-success/domain";
import { grantWebsiteAccess } from "@/lib/client-success/website-access";
import type { AgencyManagedWebsitePlatform, AgencyManagedWebsiteCareStatus } from "@prisma/client";

export async function createManagedWebsite(input: {
  name: string;
  domain: string;
  productionUrl?: string | null;
  companyId?: string | null;
  primaryProjectId?: string | null;
  platform?: AgencyManagedWebsitePlatform | null;
  careStatus?: AgencyManagedWebsiteCareStatus;
  carePlanName?: string | null;
  launchDate?: Date | null;
  clientSummary?: string | null;
  clientVisibleNotes?: string | null;
  primaryContactId?: string | null;
  createdById: string;
}) {
  const domain = assertValidDomain(input.domain);
  const productionUrl = assertValidProductionUrl(input.productionUrl);

  const website = await prisma.agencyManagedWebsite.create({
    data: {
      name: input.name.trim(),
      domain,
      productionUrl,
      companyId: input.companyId ?? null,
      primaryProjectId: input.primaryProjectId ?? null,
      platform: input.platform ?? null,
      careStatus: input.careStatus ?? "NOT_ENROLLED",
      carePlanName: input.carePlanName?.trim() || null,
      launchDate: input.launchDate ?? null,
      clientSummary: input.clientSummary?.trim() || null,
      clientVisibleNotes: input.clientVisibleNotes?.trim() || null,
      createdById: input.createdById,
    },
  });

  if (input.primaryContactId) {
    await grantWebsiteAccess({
      websiteId: website.id,
      contactId: input.primaryContactId,
      role: "WEBSITE_ADMIN",
      grantedById: input.createdById,
    });
  }

  return website;
}

export async function createCareEvent(input: {
  websiteId: string;
  type: Parameters<typeof prisma.agencyWebsiteCareEvent.create>[0]["data"]["type"];
  status?: Parameters<typeof prisma.agencyWebsiteCareEvent.create>[0]["data"]["status"];
  title: string;
  clientSummary?: string | null;
  internalNotes?: string | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  performedById: string;
  clientVisible?: boolean;
}) {
  const event = await prisma.agencyWebsiteCareEvent.create({
    data: {
      websiteId: input.websiteId,
      type: input.type,
      status: input.status ?? (input.completedAt ? "COMPLETED" : "SCHEDULED"),
      title: input.title.trim(),
      clientSummary: input.clientSummary?.trim() || null,
      internalNotes: input.internalNotes?.trim() || null,
      startedAt: input.startedAt ?? null,
      completedAt: input.completedAt ?? null,
      performedById: input.performedById,
      clientVisible: input.clientVisible ?? true,
    },
  });

  if (event.status === "COMPLETED" && event.completedAt) {
    await prisma.agencyManagedWebsite.update({
      where: { id: input.websiteId },
      data: { lastMaintenanceAt: event.completedAt },
    });
  }

  if (event.status === "SCHEDULED" && event.startedAt) {
    await prisma.agencyManagedWebsite.update({
      where: { id: input.websiteId },
      data: { nextMaintenanceAt: event.startedAt },
    });
  }

  return event;
}

export async function listManagedWebsitesForAdmin(filters?: {
  companyId?: string;
  status?: string;
}) {
  return prisma.agencyManagedWebsite.findMany({
    where: {
      ...(filters?.companyId ? { companyId: filters.companyId } : {}),
      ...(filters?.status ? { status: filters.status as never } : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: {
      company: { select: { id: true, name: true } },
      primaryProject: { select: { id: true, name: true, projectNumber: true } },
      _count: { select: { supportRequests: true, clientAccess: true } },
    },
  });
}

export async function getManagedWebsiteForAdmin(id: string) {
  return prisma.agencyManagedWebsite.findUniqueOrThrow({
    where: { id },
    include: {
      company: { select: { id: true, name: true } },
      primaryProject: { select: { id: true, name: true, projectNumber: true } },
      clientAccess: {
        where: { revokedAt: null },
        include: {
          contact: {
            select: { id: true, displayName: true, firstName: true, lastName: true, email: true },
          },
        },
      },
      careEvents: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
}
