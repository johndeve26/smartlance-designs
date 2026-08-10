import { createHash, randomBytes } from "node:crypto";

function getClaimTokenSecret(): string {
  const dedicated =
    process.env.APP_SECRETS_ENCRYPTION_KEY?.trim() ||
    process.env.AI_SECRETS_ENCRYPTION_KEY?.trim();
  if (dedicated && dedicated.length >= 16) return dedicated;
  const session = process.env.ADMIN_SESSION_SECRET?.trim();
  if (session && session.length >= 16) return session;
  return "dev-prospect-claim-secret";
}

export function createClaimToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashClaimToken(token: string): string {
  return createHash("sha256")
    .update(`${getClaimTokenSecret()}:prospect-claim:${token}`)
    .digest("hex");
}
