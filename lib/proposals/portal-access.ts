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

export async function grantProposalAccess(input: {
  proposalId: string;
  contactId: string;
  role?: "VIEWER" | "DECISION_MAKER";
  grantedById: string;
}) {
  const portalUser = await ensurePortalUser(input.contactId);

  return prisma.agencyProposalClientAccess.upsert({
    where: {
      proposalId_contactId: {
        proposalId: input.proposalId,
        contactId: input.contactId,
      },
    },
    create: {
      proposalId: input.proposalId,
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

export async function revokeProposalAccess(input: {
  proposalId: string;
  contactId: string;
}) {
  const access = await prisma.agencyProposalClientAccess.findUnique({
    where: {
      proposalId_contactId: {
        proposalId: input.proposalId,
        contactId: input.contactId,
      },
    },
  });
  if (!access || access.revokedAt) {
    return { revoked: false as const };
  }
  await prisma.agencyProposalClientAccess.update({
    where: { id: access.id },
    data: { revokedAt: new Date() },
  });
  return { revoked: true as const, accessId: access.id };
}

export async function hasProposalAccess(input: {
  proposalId: string;
  portalUserId?: string;
  contactId?: string;
}) {
  if (!input.portalUserId && !input.contactId) return false;

  const access = await prisma.agencyProposalClientAccess.findFirst({
    where: {
      proposalId: input.proposalId,
      revokedAt: null,
      ...(input.portalUserId
        ? { portalUserId: input.portalUserId }
        : { contactId: input.contactId! }),
    },
  });
  return Boolean(access);
}

export async function assertProposalAccess(input: {
  proposalId: string;
  portalUserId: string;
  contactId: string;
}) {
  const allowed = await hasProposalAccess(input);
  if (!allowed) {
    throw new Error("You do not have access to this proposal.");
  }
}

export async function listAccessibleProposals(portalUserId: string) {
  const rows = await prisma.agencyProposalClientAccess.findMany({
    where: { portalUserId, revokedAt: null },
    orderBy: { grantedAt: "desc" },
    include: {
      proposal: {
        include: {
          company: { select: { id: true, name: true } },
          versions: {
            where: { publishedAt: { not: null } },
            orderBy: { versionNumber: "desc" },
            take: 1,
            select: {
              id: true,
              versionNumber: true,
              totalAmount: true,
              currency: true,
              publishedAt: true,
            },
          },
        },
      },
    },
  });

  return rows.map((row) => ({
    accessId: row.id,
    role: row.role,
    proposal: {
      id: row.proposal.id,
      proposalNumber: row.proposal.proposalNumber,
      title: row.proposal.title,
      status: row.proposal.status,
      sentAt: row.proposal.sentAt,
      expiresAt: row.proposal.expiresAt,
      acceptedAt: row.proposal.acceptedAt,
      company: row.proposal.company,
      currentVersion: row.proposal.versions[0] ?? null,
    },
  }));
}

export async function recordProposalView(input: {
  proposalId: string;
  portalUserId: string;
}) {
  const access = await prisma.agencyProposalClientAccess.findFirst({
    where: {
      proposalId: input.proposalId,
      portalUserId: input.portalUserId,
      revokedAt: null,
    },
  });
  if (!access) return;

  const now = new Date();
  await prisma.agencyProposalClientAccess.update({
    where: { id: access.id },
    data: {
      firstViewedAt: access.firstViewedAt ?? now,
      lastViewedAt: now,
    },
  });

  await prisma.agencyProposalActivity.create({
    data: {
      proposalId: input.proposalId,
      type: "VIEWED",
      summary: "Proposal viewed by client.",
      actorPortalUserId: input.portalUserId,
      clientVisible: true,
    },
  });
}

export async function getProposalAccessRole(input: {
  proposalId: string;
  portalUserId: string;
}) {
  const access = await prisma.agencyProposalClientAccess.findFirst({
    where: {
      proposalId: input.proposalId,
      portalUserId: input.portalUserId,
      revokedAt: null,
    },
    select: { role: true, contactId: true },
  });
  return access;
}
