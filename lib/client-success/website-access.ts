import type { AgencyManagedWebsiteClientRole } from "@prisma/client";
import { prisma } from "@/lib/db";

export function websiteRoleCanView(role: AgencyManagedWebsiteClientRole | null | undefined) {
  return role != null;
}

export function websiteRoleCanSubmitSupport(role: AgencyManagedWebsiteClientRole | null | undefined) {
  return role === "MEMBER" || role === "WEBSITE_ADMIN";
}

export function websiteRoleCanRespondSupport(role: AgencyManagedWebsiteClientRole | null | undefined) {
  return role === "MEMBER" || role === "WEBSITE_ADMIN";
}

export async function listAccessibleWebsiteIds(portalUserId: string) {
  const rows = await prisma.agencyManagedWebsiteClientAccess.findMany({
    where: {
      portalUserId,
      revokedAt: null,
      website: { archivedAt: null, status: { not: "ARCHIVED" } },
    },
    select: { websiteId: true },
  });
  return rows.map((r) => r.websiteId);
}

export async function getWebsiteAccessRole(input: {
  websiteId: string;
  portalUserId: string;
}) {
  const access = await prisma.agencyManagedWebsiteClientAccess.findFirst({
    where: {
      websiteId: input.websiteId,
      portalUserId: input.portalUserId,
      revokedAt: null,
    },
    select: { role: true },
  });
  return access?.role ?? null;
}

export async function hasWebsiteAccess(input: {
  websiteId: string;
  portalUserId: string;
}) {
  const role = await getWebsiteAccessRole(input);
  return websiteRoleCanView(role);
}

export async function assertWebsiteAccess(input: {
  websiteId: string;
  portalUserId: string;
}) {
  const allowed = await hasWebsiteAccess(input);
  if (!allowed) throw new Error("You do not have access to this website.");
}

export async function assertWebsiteSubmitSupport(input: {
  websiteId: string;
  portalUserId: string;
}) {
  const role = await getWebsiteAccessRole(input);
  if (!websiteRoleCanSubmitSupport(role)) {
    throw new Error("You do not have permission to submit support requests for this website.");
  }
}

async function ensurePortalUser(contactId: string) {
  const contact = await prisma.crmContact.findUniqueOrThrow({ where: { id: contactId } });
  if (!contact.email?.trim()) throw new Error("Contact must have an email.");
  return prisma.clientPortalUser.upsert({
    where: { contactId },
    create: { contactId, email: contact.email.trim().toLowerCase(), status: "INVITED" },
    update: { email: contact.email.trim().toLowerCase() },
  });
}

export async function grantWebsiteAccess(input: {
  websiteId: string;
  contactId: string;
  role?: AgencyManagedWebsiteClientRole;
  grantedById: string;
}) {
  const portalUser = await ensurePortalUser(input.contactId);
  return prisma.agencyManagedWebsiteClientAccess.upsert({
    where: {
      websiteId_contactId: { websiteId: input.websiteId, contactId: input.contactId },
    },
    create: {
      websiteId: input.websiteId,
      contactId: input.contactId,
      portalUserId: portalUser.id,
      role: input.role ?? "MEMBER",
      grantedById: input.grantedById,
    },
    update: {
      portalUserId: portalUser.id,
      role: input.role ?? "MEMBER",
      revokedAt: null,
      grantedById: input.grantedById,
      grantedAt: new Date(),
    },
  });
}

export async function revokeWebsiteAccess(input: {
  websiteId: string;
  contactId: string;
}) {
  const access = await prisma.agencyManagedWebsiteClientAccess.findUnique({
    where: { websiteId_contactId: { websiteId: input.websiteId, contactId: input.contactId } },
  });
  if (!access || access.revokedAt) return { revoked: false as const };
  await prisma.agencyManagedWebsiteClientAccess.update({
    where: { id: access.id },
    data: { revokedAt: new Date() },
  });
  return { revoked: true as const };
}
