import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import * as argon2 from "argon2";

export const ADMIN_SESSION_COOKIE = "smartlance_admin_session";
export const ADMIN_PREVIEW_COOKIE = "smartlance_admin_preview";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days
const PREVIEW_TTL_SECONDS = 60 * 60 * 2; // 2 hours

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id });
}

export async function verifyPassword(
  passwordHash: string,
  password: string,
): Promise<boolean> {
  try {
    return await argon2.verify(passwordHash, password);
  } catch {
    return false;
  }
}

let decoyHash: Promise<string> | null = null;

/**
 * Spend the same Argon2 work as a real verification.
 *
 * Returning early for unknown or disabled accounts makes login latency reveal
 * which emails exist, so the rejection path must not skip the hash.
 */
export async function burnPasswordVerification(password: string): Promise<void> {
  decoyHash ??= hashPassword(randomBytes(32).toString("hex"));
  await verifyPassword(await decoyHash, password);
}

export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  const secret = process.env.ADMIN_SESSION_SECRET ?? "";
  return createHash("sha256")
    .update(`${secret}:${token}`)
    .digest("hex");
}

export function sessionExpiresAt(from = new Date()): Date {
  return new Date(from.getTime() + SESSION_TTL_MS);
}

export function getSessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}

function getPreviewSecret() {
  return (
    process.env.ADMIN_PREVIEW_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    "dev-preview-secret"
  );
}

/** Short-lived HMAC preview token: entityType:entityId:exp:sig */
export function createPreviewToken(
  entityType: string,
  entityId: string,
  ttlSeconds = PREVIEW_TTL_SECONDS,
): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${entityType}:${entityId}:${exp}`;
  const sig = createHash("sha256")
    .update(`${getPreviewSecret()}:${payload}`)
    .digest("base64url");
  return `${payload}:${sig}`;
}

export function verifyPreviewToken(
  token: string,
  expectedType?: string,
  expectedId?: string,
): { entityType: string; entityId: string } | null {
  const parts = token.split(":");
  if (parts.length !== 4) return null;
  const [entityType, entityId, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!entityType || !entityId || !Number.isFinite(exp)) return null;
  if (exp * 1000 < Date.now()) return null;
  if (expectedType && entityType !== expectedType) return null;
  if (expectedId && entityId !== expectedId) return null;

  const payload = `${entityType}:${entityId}:${exp}`;
  const expected = createHash("sha256")
    .update(`${getPreviewSecret()}:${payload}`)
    .digest("base64url");

  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return { entityType, entityId };
}

export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}
