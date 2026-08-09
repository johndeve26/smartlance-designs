import { prisma } from "@/lib/db";
import {
  createPortalToken,
  hashPortalToken,
  portalInviteExpiresAt,
} from "@/lib/portal/crypto";
import { createPortalSession } from "@/lib/portal/session";

export async function requestPortalMagicLink(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return { ok: false as const, error: "Email is required." };

  const contact = await prisma.crmContact.findFirst({
    where: { email: { equals: normalized, mode: "insensitive" } },
    select: { id: true, email: true },
  });

  if (!contact?.email) {
    return { ok: true as const };
  }

  const accessCount = await prisma.agencyProjectClientAccess.count({
    where: {
      contactId: contact.id,
      revokedAt: null,
      project: { clientVisibilityEnabled: true },
    },
  });

  if (accessCount === 0) {
    return { ok: true as const };
  }

  let portalUser = await prisma.clientPortalUser.findUnique({
    where: { contactId: contact.id },
  });

  if (!portalUser) {
    portalUser = await prisma.clientPortalUser.create({
      data: {
        contactId: contact.id,
        email: contact.email,
        status: "INVITED",
      },
    });
  }

  const token = createPortalToken();
  const tokenHash = hashPortalToken(token);
  const expiresAt = portalInviteExpiresAt();

  await prisma.clientPortalInvite.create({
    data: {
      portalUserId: portalUser.id,
      tokenHash,
      expiresAt,
      createdById: await resolveSystemAdminId(),
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "";
  const loginUrl = `${baseUrl}/portal/auth/${token}`;

  return { ok: true as const, loginUrl, email: contact.email };
}

async function resolveSystemAdminId() {
  const admin = await prisma.adminUser.findFirst({
    where: { status: "ACTIVE", role: "SUPER_ADMIN" },
    select: { id: true },
  });
  if (admin) return admin.id;
  const fallback = await prisma.adminUser.findFirst({
    where: { status: "ACTIVE" },
    select: { id: true },
  });
  if (!fallback) throw new Error("No active admin user available for portal invite.");
  return fallback.id;
}

export async function acceptPortalToken(token: string) {
  const tokenHash = hashPortalToken(token.trim());
  const invite = await prisma.clientPortalInvite.findUnique({
    where: { tokenHash },
    include: { portalUser: true },
  });

  if (!invite || invite.status !== "PENDING" || invite.expiresAt < new Date()) {
    return { ok: false as const, error: "This link is invalid or has expired." };
  }

  await prisma.$transaction([
    prisma.clientPortalInvite.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
    }),
    prisma.clientPortalUser.update({
      where: { id: invite.portalUserId },
      data: { status: "ACTIVE", lastLoginAt: new Date() },
    }),
  ]);

  const session = await createPortalSession(invite.portalUserId);
  return { ok: true as const, ...session };
}

export async function acceptPortalInviteToken(token: string) {
  return acceptPortalToken(token);
}
