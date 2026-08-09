import { createHash, randomBytes } from "node:crypto";

export const PORTAL_SESSION_COOKIE = "smartlance_portal_session";

const PORTAL_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function getPortalTokenSecret(): string {
  const dedicated =
    process.env.APP_SECRETS_ENCRYPTION_KEY?.trim() ||
    process.env.AI_SECRETS_ENCRYPTION_KEY?.trim();
  if (dedicated && dedicated.length >= 16) return dedicated;
  const session = process.env.ADMIN_SESSION_SECRET?.trim();
  if (session && session.length >= 16) return session;
  return "dev-portal-token-secret";
}

export function createPortalToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashPortalToken(token: string): string {
  return createHash("sha256")
    .update(`${getPortalTokenSecret()}:portal:${token}`)
    .digest("hex");
}

export function portalSessionExpiresAt(from = new Date()): Date {
  return new Date(from.getTime() + PORTAL_SESSION_TTL_MS);
}

export function portalInviteExpiresAt(from = new Date()): Date {
  return new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
}

export function getPortalSessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}
