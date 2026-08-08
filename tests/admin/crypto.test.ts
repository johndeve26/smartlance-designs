import { afterEach, describe, expect, it } from "vitest";
import {
  createPreviewToken,
  hashToken,
  verifyPreviewToken,
} from "@/lib/admin/crypto";

const ORIGINAL_SESSION = process.env.ADMIN_SESSION_SECRET;
const ORIGINAL_PREVIEW = process.env.ADMIN_PREVIEW_SECRET;

afterEach(() => {
  if (ORIGINAL_SESSION === undefined) {
    delete process.env.ADMIN_SESSION_SECRET;
  } else {
    process.env.ADMIN_SESSION_SECRET = ORIGINAL_SESSION;
  }
  if (ORIGINAL_PREVIEW === undefined) {
    delete process.env.ADMIN_PREVIEW_SECRET;
  } else {
    process.env.ADMIN_PREVIEW_SECRET = ORIGINAL_PREVIEW;
  }
});

describe("hashToken", () => {
  it("is deterministic for the same secret and token", () => {
    process.env.ADMIN_SESSION_SECRET = "test-session-secret";
    const a = hashToken("abc");
    const b = hashToken("abc");
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it("changes when the secret changes", () => {
    process.env.ADMIN_SESSION_SECRET = "secret-a";
    const withA = hashToken("token");
    process.env.ADMIN_SESSION_SECRET = "secret-b";
    const withB = hashToken("token");
    expect(withA).not.toBe(withB);
  });
});

describe("preview tokens", () => {
  it("creates and verifies a valid preview token", () => {
    process.env.ADMIN_PREVIEW_SECRET = "preview-secret";
    const token = createPreviewToken("Service", "svc_1", 3600);
    const verified = verifyPreviewToken(token, "Service", "svc_1");
    expect(verified).toEqual({ entityType: "Service", entityId: "svc_1" });
  });

  it("rejects expired preview tokens", () => {
    process.env.ADMIN_PREVIEW_SECRET = "preview-secret";
    const token = createPreviewToken("Service", "svc_1", -10);
    expect(verifyPreviewToken(token)).toBeNull();
  });

  it("rejects tokens with wrong expected type or id", () => {
    process.env.ADMIN_PREVIEW_SECRET = "preview-secret";
    const token = createPreviewToken("Service", "svc_1", 3600);
    expect(verifyPreviewToken(token, "Solution", "svc_1")).toBeNull();
    expect(verifyPreviewToken(token, "Service", "other")).toBeNull();
  });

  it("rejects tampered signatures", () => {
    process.env.ADMIN_PREVIEW_SECRET = "preview-secret";
    const token = createPreviewToken("Service", "svc_1", 3600);
    const parts = token.split(":");
    parts[3] = "tampered";
    expect(verifyPreviewToken(parts.join(":"))).toBeNull();
  });
});
