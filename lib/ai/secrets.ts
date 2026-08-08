import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export type EncryptedSecret = {
  ciphertext: string;
  iv: string;
  tag: string;
};

function getMasterKeyMaterial(): Buffer {
  const dedicated = process.env.AI_SECRETS_ENCRYPTION_KEY?.trim();
  const fallback = process.env.ADMIN_SESSION_SECRET?.trim();
  const raw = dedicated || fallback;
  if (!raw || raw.length < 16) {
    throw new Error(
      "AI secrets encryption requires AI_SECRETS_ENCRYPTION_KEY or ADMIN_SESSION_SECRET (≥16 chars).",
    );
  }
  return createHash("sha256").update(raw).digest();
}

export function encryptSecret(plaintext: string): EncryptedSecret {
  const key = getMasterKeyMaterial();
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

export function decryptSecret(payload: EncryptedSecret): string {
  const key = getMasterKeyMaterial();
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

export function maskSecretLast4(secret: string): string {
  const trimmed = secret.trim();
  if (trimmed.length < 4) return "••••";
  return `••••${trimmed.slice(-4)}`;
}

export function canEncryptAiSecrets(): boolean {
  const dedicated = process.env.AI_SECRETS_ENCRYPTION_KEY?.trim();
  const fallback = process.env.ADMIN_SESSION_SECRET?.trim();
  return Boolean((dedicated && dedicated.length >= 16) || (fallback && fallback.length >= 16));
}
