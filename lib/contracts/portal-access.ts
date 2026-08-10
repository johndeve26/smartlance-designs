import { prisma } from "@/lib/db";

async function ensurePortalUser(contactId: string) {
  const contact = await prisma.crmContact.findUniqueOrThrow({ where: { id: contactId } });
  if (!contact.email?.trim()) throw new Error("Contact must have an email.");
  return prisma.clientPortalUser.upsert({
    where: { contactId },
    create: { contactId, email: contact.email.trim().toLowerCase(), status: "INVITED" },
    update: { email: contact.email.trim().toLowerCase() },
  });
}

export async function grantContractAccess(input: {
  contractId: string;
  contactId: string;
  role?: "CLIENT_SIGNATORY" | "AGENCY_SIGNATORY" | "VIEWER";
  grantedById: string;
}) {
  const portalUser = await ensurePortalUser(input.contactId);
  return prisma.agencyContractClientAccess.upsert({
    where: {
      contractId_contactId: { contractId: input.contractId, contactId: input.contactId },
    },
    create: {
      contractId: input.contractId,
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

export async function revokeContractAccess(input: {
  contractId: string;
  contactId: string;
}) {
  const access = await prisma.agencyContractClientAccess.findUnique({
    where: { contractId_contactId: { contractId: input.contractId, contactId: input.contactId } },
  });
  if (!access || access.revokedAt) return { revoked: false as const };
  await prisma.agencyContractClientAccess.update({
    where: { id: access.id },
    data: { revokedAt: new Date() },
  });
  return { revoked: true as const };
}

export async function hasContractAccess(input: {
  contractId: string;
  portalUserId?: string;
  contactId?: string;
}) {
  if (!input.portalUserId && !input.contactId) return false;
  const access = await prisma.agencyContractClientAccess.findFirst({
    where: {
      contractId: input.contractId,
      revokedAt: null,
      ...(input.portalUserId
        ? { portalUserId: input.portalUserId }
        : { contactId: input.contactId! }),
    },
  });
  return Boolean(access);
}

export async function assertContractAccess(input: {
  contractId: string;
  portalUserId: string;
  contactId: string;
}) {
  const allowed = await hasContractAccess(input);
  if (!allowed) throw new Error("You do not have access to this contract.");
}

export async function listAccessibleContracts(portalUserId: string) {
  const rows = await prisma.agencyContractClientAccess.findMany({
    where: { portalUserId, revokedAt: null },
    orderBy: { grantedAt: "desc" },
    include: {
      contract: {
        include: {
          company: { select: { id: true, name: true } },
          versions: {
            where: { publishedAt: { not: null } },
            orderBy: { versionNumber: "desc" },
            take: 1,
            select: { id: true, versionNumber: true, publishedAt: true },
          },
        },
      },
    },
  });

  return rows.map((row) => ({
    accessId: row.id,
    role: row.role,
    contract: {
      id: row.contract.id,
      contractNumber: row.contract.contractNumber,
      title: row.contract.title,
      status: row.contract.status,
      sentAt: row.contract.sentAt,
      expiresAt: row.contract.expiresAt,
      fullySignedAt: row.contract.fullySignedAt,
      company: row.contract.company,
      currentVersion: row.contract.versions[0] ?? null,
    },
  }));
}

export async function recordContractView(input: {
  contractId: string;
  portalUserId: string;
}) {
  const access = await prisma.agencyContractClientAccess.findFirst({
    where: { contractId: input.contractId, portalUserId: input.portalUserId, revokedAt: null },
  });
  if (!access) return;

  const now = new Date();
  const isFirstView = !access.firstViewedAt;

  await prisma.agencyContractClientAccess.update({
    where: { id: access.id },
    data: {
      firstViewedAt: access.firstViewedAt ?? now,
      lastViewedAt: now,
    },
  });

  if (isFirstView) {
    await prisma.agencyContractActivity.create({
      data: {
        contractId: input.contractId,
        type: "CONTRACT_VIEWED",
        summary: "Contract viewed by signer.",
        actorPortalUserId: input.portalUserId,
        clientVisible: true,
      },
    });
  }
}

export async function getSignerForPortalUser(input: {
  contractId: string;
  versionId: string;
  portalUserId: string;
}) {
  return prisma.agencyContractSigner.findFirst({
    where: {
      contractId: input.contractId,
      contractVersionId: input.versionId,
      portalUserId: input.portalUserId,
    },
  });
}
