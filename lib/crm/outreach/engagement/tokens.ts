import { createHash, randomBytes } from "node:crypto";

export function createEngagementToken(): string {
  return randomBytes(32).toString("base64url");
}

function getEngagementTokenSecret(): string {
  const dedicated =
    process.env.APP_SECRETS_ENCRYPTION_KEY?.trim() ||
    process.env.AI_SECRETS_ENCRYPTION_KEY?.trim();
  if (dedicated && dedicated.length >= 16) return dedicated;
  const session = process.env.ADMIN_SESSION_SECRET?.trim();
  if (session && session.length >= 16) return session;
  return "dev-engagement-token-secret";
}

export function hashEngagementToken(token: string): string {
  return createHash("sha256")
    .update(`${getEngagementTokenSecret()}:crm-engagement:${token}`)
    .digest("hex");
}

export function hashEngagementFingerprint(value: string): string {
  return createHash("sha256")
    .update(`${getEngagementTokenSecret()}:fingerprint:${value}`)
    .digest("hex")
    .slice(0, 32);
}
