import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  canEncryptAiSecrets,
  decryptSecret,
  encryptSecret,
  maskSecretLast4,
} from "@/lib/ai/secrets";
import { mapMessagesForAnthropic } from "@/lib/ai/providers/anthropic";
import { envFallbackKey, getCatalogDefaultModel, getCatalogEntry, isCatalogProviderId } from "@/lib/ai/providers/catalog";
import { can } from "@/lib/admin/rbac";

describe("AI secrets", () => {
  const prevEnc = process.env.AI_SECRETS_ENCRYPTION_KEY;
  const prevSession = process.env.ADMIN_SESSION_SECRET;

  beforeEach(() => {
    process.env.AI_SECRETS_ENCRYPTION_KEY = "test-ai-secrets-key-32chars-min!!";
    delete process.env.ADMIN_SESSION_SECRET;
  });

  afterEach(() => {
    if (prevEnc === undefined) delete process.env.AI_SECRETS_ENCRYPTION_KEY;
    else process.env.AI_SECRETS_ENCRYPTION_KEY = prevEnc;
    if (prevSession === undefined) delete process.env.ADMIN_SESSION_SECRET;
    else process.env.ADMIN_SESSION_SECRET = prevSession;
  });

  it("round-trips encrypt/decrypt", () => {
    const enc = encryptSecret("sk-test-secret-value");
    expect(enc.ciphertext).toBeTruthy();
    expect(enc.iv).toBeTruthy();
    expect(enc.tag).toBeTruthy();
    expect(decryptSecret(enc)).toBe("sk-test-secret-value");
  });

  it("fails decrypt with wrong master key", () => {
    const enc = encryptSecret("sk-test-secret-value");
    process.env.AI_SECRETS_ENCRYPTION_KEY = "different-master-key-32chars!!!!";
    expect(() => decryptSecret(enc)).toThrow();
  });

  it("masks last4 without exposing full secret", () => {
    expect(maskSecretLast4("sk-abcdefghijklmnop")).toBe("••••mnop");
    expect(maskSecretLast4("ab")).toBe("••••");
  });

  it("reports encryption readiness", () => {
    expect(canEncryptAiSecrets()).toBe(true);
    delete process.env.AI_SECRETS_ENCRYPTION_KEY;
    expect(canEncryptAiSecrets()).toBe(false);
  });
});

describe("Anthropic message mapping", () => {
  it("extracts system and merges consecutive roles", () => {
    const mapped = mapMessagesForAnthropic([
      { role: "system", content: "Be careful." },
      { role: "user", content: "Hello" },
      { role: "user", content: "World" },
      { role: "assistant", content: "Hi" },
    ]);
    expect(mapped.system).toBe("Be careful.");
    expect(mapped.messages).toEqual([
      { role: "user", content: "Hello\n\nWorld" },
      { role: "assistant", content: "Hi" },
    ]);
  });

  it("ensures first message is user", () => {
    const mapped = mapMessagesForAnthropic([
      { role: "assistant", content: "Already started" },
    ]);
    expect(mapped.messages[0]?.role).toBe("user");
  });
});

describe("provider catalog", () => {
  it("includes industry providers with default models", () => {
    for (const id of ["openai", "anthropic", "google", "xai", "openrouter", "agentrouter", "custom"]) {
      expect(isCatalogProviderId(id)).toBe(true);
      expect(getCatalogEntry(id)?.label).toBeTruthy();
      expect(getCatalogEntry(id)?.defaultModel).toBeTruthy();
    }
  });

  it("resolves per-provider default models", () => {
    expect(getCatalogDefaultModel("openai", "WRITING")).toBe("gpt-4o");
    expect(getCatalogDefaultModel("anthropic", "FAST")).toBe("claude-3-5-haiku-20241022");
    expect(getCatalogDefaultModel("google", "WRITING")).toBe("gemini-2.5-pro");
    expect(getCatalogDefaultModel("xai")).toBe("grok-3");
    expect(getCatalogDefaultModel("openrouter", "RESEARCH")).toBe("openai/gpt-4o-mini");
    expect(getCatalogDefaultModel("agentrouter")).toBe("gpt-4o");
  });

  it("reads env fallback keys without leaking into catalog", () => {
    const prev = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    expect(envFallbackKey("anthropic")).toBe("sk-ant-test");
    if (prev === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = prev;
  });
});

describe("RBAC for AI provider settings", () => {
  it("allows Editor/Super Admin manage_ai_settings, not Content Manager", () => {
    expect(can("SUPER_ADMIN", "manage_ai_settings")).toBe(true);
    expect(can("EDITOR", "manage_ai_settings")).toBe(true);
    expect(can("CONTENT_MANAGER", "manage_ai_settings")).toBe(false);
    expect(can("REVIEWER", "manage_ai_settings")).toBe(false);
  });
});

describe("status mask contract", () => {
  it("mask helper never returns the full key", () => {
    const secret = "sk-live-super-secret-key-value";
    const masked = maskSecretLast4(secret);
    expect(masked.includes(secret)).toBe(false);
    expect(masked.startsWith("••••")).toBe(true);
  });
});

describe("settings UI presentation registry", () => {
  it("exposes blurbs and initials for every catalog provider", async () => {
    const { listProviderPresentations, ROUTING_TASKS } = await import(
      "@/lib/ai/providers/presentation"
    );
    const list = listProviderPresentations();
    expect(list.length).toBeGreaterThanOrEqual(7);
    for (const p of list) {
      expect(p.blurb.length).toBeGreaterThan(10);
      expect(p.initials.length).toBeGreaterThanOrEqual(2);
      expect(p.id).toBeTruthy();
      // Never embed secrets in presentation metadata
      expect(JSON.stringify(p)).not.toMatch(/sk-/i);
    }
    expect(ROUTING_TASKS.map((t) => t.id)).toEqual([
      "writing",
      "research",
      "editor",
      "fast",
    ]);
  });
});

// silence unused vi import if tree-shaken oddly
void vi;
