import { createHash, randomBytes } from "node:crypto";

export function createSubscriberToken(): string {
  return randomBytes(32).toString("base64url");
}

function getSubscriberTokenSecret(): string {
  const dedicated =
    process.env.APP_SECRETS_ENCRYPTION_KEY?.trim() ||
    process.env.AI_SECRETS_ENCRYPTION_KEY?.trim();
  if (dedicated && dedicated.length >= 16) return dedicated;
  const session = process.env.ADMIN_SESSION_SECRET?.trim();
  if (session && session.length >= 16) return session;
  return "dev-subscriber-token-secret";
}

export function hashSubscriberToken(token: string): string {
  return createHash("sha256")
    .update(`${getSubscriberTokenSecret()}:subscriber:${token}`)
    .digest("hex");
}

export function confirmationExpiresAt(from = new Date()): Date {
  return new Date(from.getTime() + 24 * 60 * 60 * 1000);
}
