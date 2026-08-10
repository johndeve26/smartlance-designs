import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import type { EncryptedSecret } from "@/lib/ai/secrets";

/**
 * Dedicated application secrets (SMTP passwords, etc.).
 * Requires a persistent encryption key — never ADMIN_SESSION_SECRET.
 */
function getDedicatedKeyMaterial(): Buffer {
  const ai = process.env.AI_SECRETS_ENCRYPTION_KEY?.trim();
  const app = process.env.APP_SECRETS_ENCRYPTION_KEY?.trim();
  const raw = ai || app;
  if (!raw || raw.length < 16) {
    throw new Error(
      "Dedicated secrets encryption requires AI_SECRETS_ENCRYPTION_KEY or APP_SECRETS_ENCRYPTION_KEY (≥16 chars).",
    );
  }
  return createHash("sha256").update(raw).digest();
}

export function canEncryptDedicatedSecrets(): boolean {
  const ai = process.env.AI_SECRETS_ENCRYPTION_KEY?.trim();
  const app = process.env.APP_SECRETS_ENCRYPTION_KEY?.trim();
  return Boolean((ai && ai.length >= 16) || (app && app.length >= 16));
}

export function encryptDedicatedSecret(plaintext: string): EncryptedSecret {
  const key = getDedicatedKeyMaterial();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

export function decryptDedicatedSecret(payload: EncryptedSecret): string {
  const key = getDedicatedKeyMaterial();
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(payload.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(payload.tag, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
