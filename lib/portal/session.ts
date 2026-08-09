import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ClientPortalUser } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  createPortalToken,
  getPortalSessionCookieOptions,
  hashPortalToken,
  PORTAL_SESSION_COOKIE,
  portalSessionExpiresAt,
} from "@/lib/portal/tokens";

export { PORTAL_SESSION_COOKIE };

export type PortalSessionUser = Pick<
  ClientPortalUser,
  "id" | "contactId" | "email" | "status"
>;

export async function createPortalSession(portalUserId: string): Promise<{
  token: string;
  expiresAt: Date;
}> {
  const token = createPortalToken();
  const tokenHash = hashPortalToken(token);
  const expiresAt = portalSessionExpiresAt();

  await prisma.clientPortalSession.create({
    data: {
      portalUserId,
      tokenHash,
      expiresAt,
    },
  });

  await prisma.clientPortalUser.update({
    where: { id: portalUserId },
    data: {
      status: "ACTIVE",
      lastLoginAt: new Date(),
    },
  });

  return { token, expiresAt };
}

export async function setPortalSessionCookie(token: string, expiresAt: Date) {
  const jar = await cookies();
  jar.set(PORTAL_SESSION_COOKIE, token, getPortalSessionCookieOptions(expiresAt));
}

export async function clearPortalSessionCookie() {
  const jar = await cookies();
  jar.set(PORTAL_SESSION_COOKIE, "", {
    ...getPortalSessionCookieOptions(new Date(0)),
    maxAge: 0,
  });
}

export async function revokePortalSessionByToken(token: string) {
  const tokenHash = hashPortalToken(token);
  await prisma.clientPortalSession.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getPortalUser(): Promise<PortalSessionUser | null> {
  return getPortalSessionUser();
}

export async function getPortalSessionUser(): Promise<PortalSessionUser | null> {
  const jar = await cookies();
  const token = jar.get(PORTAL_SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashPortalToken(token);
  const session = await prisma.clientPortalSession.findUnique({
    where: { tokenHash },
    include: {
      portalUser: {
        select: {
          id: true,
          contactId: true,
          email: true,
          status: true,
        },
      },
    },
  });

  if (!session || session.revokedAt) return null;
  if (session.expiresAt.getTime() < Date.now()) return null;
  if (session.portalUser.status === "DISABLED") return null;

  return session.portalUser;
}

export async function requirePortalUser(): Promise<PortalSessionUser> {
  const user = await getPortalSessionUser();
  if (!user) {
    redirect("/portal/login");
  }
  return user;
}
