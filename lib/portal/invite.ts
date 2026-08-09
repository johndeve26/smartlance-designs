import type { AgencyProjectClientRole, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { recordAgencyProjectActivity } from "@/lib/agency/activity";
import {
  createPortalToken,
  hashPortalToken,
  portalInviteExpiresAt,
} from "@/lib/portal/tokens";
import {
  createPortalSession,
  setPortalSessionCookie,
} from "@/lib/portal/session";

async function ensurePortalUser(input: {
  contactId: string;
  email: string;
}) {
  return prisma.clientPortalUser.upsert({
    where: { contactId: input.contactId },
    create: {
      contactId: input.contactId,
      email: input.email.trim().toLowerCase(),
      status: "INVITED",
    },
    update: {
      email: input.email.trim().toLowerCase(),
    },
  });
}

export async function createInvite(input: {
  contactId: string;
  projectId?: string | null;
  role?: AgencyProjectClientRole;
  createdById: string;
}) {
  const contact = await prisma.crmContact.findUniqueOrThrow({
    where: { id: input.contactId },
  });

  if (!contact.email?.trim()) {
    throw new Error("Contact must have an email address for portal access.");
  }

  if (input.projectId) {
    await prisma.agencyProject.findUniqueOrThrow({
      where: { id: input.projectId },
    });
  }

  const portalUser = await ensurePortalUser({
    contactId: contact.id,
    email: contact.email,
  });

  const token = createPortalToken();
  const tokenHash = hashPortalToken(token);
  const expiresAt = portalInviteExpiresAt();

  const invite = await prisma.clientPortalInvite.create({
    data: {
      portalUserId: portalUser.id,
      projectId: input.projectId ?? null,
      tokenHash,
      expiresAt,
      createdById: input.createdById,
    },
  });

  if (input.projectId) {
    await prisma.agencyProjectClientAccess.upsert({
      where: {
        projectId_contactId: {
          projectId: input.projectId,
          contactId: contact.id,
        },
      },
      create: {
        projectId: input.projectId,
        contactId: contact.id,
        portalUserId: portalUser.id,
        role: (input.role ?? "CLIENT_MEMBER") as never,
        grantedById: input.createdById,
      },
      update: {
        portalUserId: portalUser.id,
        role: (input.role ?? "CLIENT_MEMBER") as never,
        revokedAt: null,
        grantedById: input.createdById,
        grantedAt: new Date(),
      },
    });

    await recordAgencyProjectActivity({
      projectId: input.projectId,
      type: "CLIENT_ACCESS_GRANTED",
      summary: `Client portal access granted to ${contact.email}.`,
      actorUserId: input.createdById,
      entityType: "AgencyProjectClientAccess",
      entityId: contact.id,
      clientVisible: false,
    });
  }

  return { invite, token, portalUser };
}

export async function acceptInvite(input: { token: string }) {
  const tokenHash = hashPortalToken(input.token);
  const invite = await prisma.clientPortalInvite.findUnique({
    where: { tokenHash },
    include: {
      portalUser: {
        include: { contact: true },
      },
      project: true,
    },
  });

  if (!invite) {
    throw new Error("Invalid or expired invite link.");
  }
  if (invite.status === "REVOKED") {
    throw new Error("This invite has been revoked.");
  }
  if (invite.status === "ACCEPTED") {
    throw new Error("This invite has already been used.");
  }
  if (invite.expiresAt.getTime() < Date.now()) {
    await prisma.clientPortalInvite.update({
      where: { id: invite.id },
      data: { status: "EXPIRED" },
    });
    throw new Error("This invite has expired.");
  }

  await prisma.clientPortalInvite.update({
    where: { id: invite.id },
    data: {
      status: "ACCEPTED",
      acceptedAt: new Date(),
    },
  });

  if (invite.projectId) {
    await prisma.agencyProjectClientAccess.upsert({
      where: {
        projectId_contactId: {
          projectId: invite.projectId,
          contactId: invite.portalUser.contactId,
        },
      },
      create: {
        projectId: invite.projectId,
        contactId: invite.portalUser.contactId,
        portalUserId: invite.portalUserId,
        role: "CLIENT_MEMBER",
        grantedById: invite.createdById,
      },
      update: {
        portalUserId: invite.portalUserId,
        revokedAt: null,
      },
    });
  }

  const session = await createPortalSession(invite.portalUserId);
  await setPortalSessionCookie(session.token, session.expiresAt);

  return {
    portalUser: invite.portalUser,
    projectId: invite.projectId,
    sessionToken: session.token,
  };
}

export async function revokeAccess(input: {
  projectId: string;
  contactId: string;
  actorUserId: string;
}) {
  const access = await prisma.agencyProjectClientAccess.findUnique({
    where: {
      projectId_contactId: {
        projectId: input.projectId,
        contactId: input.contactId,
      },
    },
  });

  if (!access || access.revokedAt) {
    return { revoked: false as const };
  }

  await prisma.agencyProjectClientAccess.update({
    where: { id: access.id },
    data: { revokedAt: new Date() },
  });

  await prisma.clientPortalInvite.updateMany({
    where: {
      portalUserId: access.portalUserId ?? undefined,
      projectId: input.projectId,
      status: "PENDING",
    },
    data: {
      status: "REVOKED",
      revokedAt: new Date(),
    },
  });

  await recordAgencyProjectActivity({
    projectId: input.projectId,
    type: "STATUS_CHANGED",
    summary: "Client portal access revoked.",
    actorUserId: input.actorUserId,
    entityType: "AgencyProjectClientAccess",
    entityId: access.id,
  });

  return { revoked: true as const, accessId: access.id };
}

export async function listPendingInvites(projectId?: string) {
  const where: Prisma.ClientPortalInviteWhereInput = {
    status: "PENDING",
    expiresAt: { gt: new Date() },
    ...(projectId ? { projectId } : {}),
  };

  return prisma.clientPortalInvite.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      portalUser: {
        select: {
          id: true,
          email: true,
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              displayName: true,
            },
          },
        },
      },
      project: { select: { id: true, name: true, projectNumber: true } },
    },
  });
}
