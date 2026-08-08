import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { AdminRole, AdminUser } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  ADMIN_SESSION_COOKIE,
  createSessionToken,
  getSessionCookieOptions,
  hashIp,
  hashToken,
  sessionExpiresAt,
} from "@/lib/admin/crypto";
import { assertCan, can, type AdminCapability } from "@/lib/admin/rbac";
import { isFormRateLimited } from "@/lib/forms";

export type SessionUser = Pick<
  AdminUser,
  "id" | "name" | "email" | "role" | "status"
>;

export async function createAdminSession(userId: string): Promise<{
  token: string;
  expiresAt: Date;
}> {
  const token = createSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt = sessionExpiresAt();
  const headerStore = await headers();
  const ua = headerStore.get("user-agent")?.slice(0, 300) ?? null;
  const forwarded = headerStore.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip")?.trim() ||
    "unknown";

  await prisma.adminSession.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      userAgent: ua,
      ipHash: hashIp(ip),
    },
  });

  return { token, expiresAt };
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const jar = await cookies();
  jar.set(ADMIN_SESSION_COOKIE, token, getSessionCookieOptions(expiresAt));
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(ADMIN_SESSION_COOKIE, "", {
    ...getSessionCookieOptions(new Date(0)),
    maxAge: 0,
  });
}

export async function revokeSessionByToken(token: string) {
  const tokenHash = hashToken(token);
  await prisma.adminSession.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllSessionsForUser(userId: string) {
  await prisma.adminSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = await prisma.adminSession.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
        },
      },
    },
  });

  if (!session || session.revokedAt) return null;
  if (session.expiresAt.getTime() < Date.now()) return null;
  if (session.user.status !== "ACTIVE") return null;

  return session.user;
}

export async function requireAdminUser(
  capability?: AdminCapability,
): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/admin/login");
  }
  if (capability) {
    try {
      assertCan(user.role, capability);
    } catch {
      redirect("/admin");
    }
  }
  return user;
}

export function userCan(user: SessionUser, capability: AdminCapability) {
  return can(user.role as AdminRole, capability);
}

/** Same-origin check for mutating admin server actions. */
export async function assertSameOrigin(): Promise<void> {
  const headerStore = await headers();
  const origin = headerStore.get("origin");
  const host = headerStore.get("host");
  if (!origin || !host) {
    // Server Actions from same app usually send Origin; reject if both missing in prod
    if (process.env.NODE_ENV === "production") {
      throw new Error("Missing origin");
    }
    return;
  }
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new Error("Invalid origin");
  }
  if (originHost !== host) {
    throw new Error("Cross-origin request blocked");
  }
}

export function isLoginRateLimited(key: string): boolean {
  return isFormRateLimited(`admin-login:${key}`, 10, 15 * 60 * 1000);
}

/**
 * Best-effort client address for login throttling.
 *
 * The proxy chain is not authenticated, so a spoofed header only moves an
 * attacker between buckets — the per-account limit still bounds each user.
 */
export async function getRequestIpHash(): Promise<string> {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || headerStore.get("x-real-ip")?.trim() || "unknown";
  return hashIp(ip);
}

/** Throttle per account and per source address; credential stuffing rotates emails. */
export async function isLoginAttemptBlocked(email: string): Promise<boolean> {
  const ipBlocked = isFormRateLimited(
    `admin-login-ip:${await getRequestIpHash()}`,
    30,
    15 * 60 * 1000,
  );
  return ipBlocked || isLoginRateLimited(email);
}
