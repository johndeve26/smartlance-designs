import { prisma } from "@/lib/db";

async function ensurePortalUser(contactId: string) {
  const contact = await prisma.crmContact.findUniqueOrThrow({
    where: { id: contactId },
  });
  if (!contact.email?.trim()) {
    throw new Error("Contact must have an email for portal access.");
  }
  return prisma.clientPortalUser.upsert({
    where: { contactId },
    create: {
      contactId,
      email: contact.email.trim().toLowerCase(),
      status: "INVITED",
    },
    update: { email: contact.email.trim().toLowerCase() },
  });
}

export async function grantChangeRequestAccess(input: {
  changeRequestId: string;
  contactId: string;
  role?: "VIEWER" | "APPROVER";
  grantedById: string;
}) {
  const portalUser = await ensurePortalUser(input.contactId);

  return prisma.agencyChangeRequestClientAccess.upsert({
    where: {
      changeRequestId_contactId: {
        changeRequestId: input.changeRequestId,
        contactId: input.contactId,
      },
    },
    create: {
      changeRequestId: input.changeRequestId,
      contactId: input.contactId,
      portalUserId: portalUser.id,
      role: (input.role ?? "VIEWER") as never,
      grantedById: input.grantedById,
    },
    update: {
      portalUserId: portalUser.id,
      role: (input.role ?? "VIEWER") as never,
      revokedAt: null,
      grantedById: input.grantedById,
      grantedAt: new Date(),
    },
  });
}

export async function hasChangeRequestViewAccess(input: {
  changeRequestId: string;
  portalUserId: string;
}) {
  const cr = await prisma.agencyChangeRequest.findUnique({
    where: { id: input.changeRequestId },
    select: { projectId: true },
  });
  if (!cr) return false;

  const projectAccess = await prisma.agencyProjectClientAccess.findFirst({
    where: {
      projectId: cr.projectId,
      portalUserId: input.portalUserId,
      revokedAt: null,
    },
  });
  if (!projectAccess) return false;

  const explicit = await prisma.agencyChangeRequestClientAccess.findFirst({
    where: {
      changeRequestId: input.changeRequestId,
      portalUserId: input.portalUserId,
      revokedAt: null,
    },
  });
  return Boolean(explicit) || Boolean(projectAccess);
}

export async function hasChangeRequestApproverAccess(input: {
  changeRequestId: string;
  portalUserId: string;
}) {
  const access = await prisma.agencyChangeRequestClientAccess.findFirst({
    where: {
      changeRequestId: input.changeRequestId,
      portalUserId: input.portalUserId,
      role: "APPROVER",
      revokedAt: null,
    },
  });
  return Boolean(access);
}

export async function assertChangeRequestViewAccess(input: {
  changeRequestId: string;
  portalUserId: string;
}) {
  const allowed = await hasChangeRequestViewAccess(input);
  if (!allowed) {
    throw new Error("You do not have access to this change request.");
  }
}

export async function assertChangeRequestApproverAccess(input: {
  changeRequestId: string;
  portalUserId: string;
}) {
  const allowed = await hasChangeRequestApproverAccess(input);
  if (!allowed) {
    throw new Error("You are not authorized to approve this change request.");
  }
}
