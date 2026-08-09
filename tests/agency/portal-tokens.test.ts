import { describe, expect, it } from "vitest";
import {
  createPortalToken,
  hashPortalToken,
  portalInviteExpiresAt,
} from "@/lib/portal/tokens";

describe("portal tokens", () => {
  it("hashes tokens deterministically", () => {
    const token = "test-token-value";
    expect(hashPortalToken(token)).toBe(hashPortalToken(token));
    expect(hashPortalToken(token)).not.toBe(token);
  });

  it("creates URL-safe tokens", () => {
    const token = createPortalToken();
    expect(token.length).toBeGreaterThan(20);
    expect(token).not.toMatch(/[\s+/=]/);
  });

  it("sets invite expiry in the future", () => {
    const expires = portalInviteExpiresAt();
    expect(expires.getTime()).toBeGreaterThan(Date.now());
  });
});
