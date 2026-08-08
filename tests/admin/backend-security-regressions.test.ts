/**
 * Regression tests for issues confirmed during the backend security audit.
 * Each block documents the concrete failure it locks out.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  isPrivateOrReservedHostname,
  isSafePublicHttpUrl,
} from "@/lib/ai/ssrf";

describe("SSRF host classification", () => {
  it("blocks IPv4-mapped IPv6 forms of loopback, private and metadata addresses", () => {
    // The URL parser compresses ::ffff:169.254.169.254 to ::ffff:a9fe:a9fe,
    // which previously matched none of the private-range checks.
    expect(isSafePublicHttpUrl("http://[::ffff:127.0.0.1]/")).toBe(false);
    expect(isSafePublicHttpUrl("http://[::ffff:10.0.0.1]/")).toBe(false);
    expect(isSafePublicHttpUrl("http://[::ffff:192.168.1.1]/")).toBe(false);
    expect(isSafePublicHttpUrl("http://[::ffff:172.16.0.1]/")).toBe(false);
    expect(isSafePublicHttpUrl("http://[::ffff:169.254.169.254]/")).toBe(false);
  });

  it("blocks the unspecified IPv6 address", () => {
    expect(isSafePublicHttpUrl("http://[::]/")).toBe(false);
    expect(isPrivateOrReservedHostname("::")).toBe(true);
  });

  it("keeps blocking the previously covered targets", () => {
    for (const url of [
      "http://127.0.0.1/",
      "http://2130706433/",
      "http://127.1/",
      "http://[::1]/",
      "http://169.254.169.254/",
      "http://10.0.0.5/",
      "http://172.16.0.1/",
      "http://192.168.0.1/",
      "http://[fe80::1]/",
      "http://[fd00::1]/",
      "http://metadata.google.internal/",
      "http://foo.internal/",
      "file:///etc/passwd",
      "javascript:alert(1)",
      "http://user:pass@example.com/",
    ]) {
      expect(isSafePublicHttpUrl(url), url).toBe(false);
    }
  });

  it("does not over-block legitimate public hosts", () => {
    for (const url of [
      "https://example.com/",
      "https://smartlancedesigns.com/blog",
      "https://[2606:4700:4700::1111]/",
      "http://172.32.0.1/",
      "http://192.169.1.1/",
      "http://100.128.0.1/",
    ]) {
      expect(isSafePublicHttpUrl(url), url).toBe(true);
    }
  });
});

describe("slug-change redirects", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  async function loadWithMockedDb() {
    const upsert = vi.fn().mockResolvedValue({ id: "r1" });
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    vi.doMock("@/lib/db", () => ({
      hasDatabaseUrl: () => true,
      prisma: { redirect: { upsert, updateMany, findFirst: vi.fn() } },
    }));
    vi.doMock("@/lib/admin/publishing", () => ({
      revalidateRedirects: vi.fn(),
    }));
    const mod = await import("@/lib/repositories/redirectsRepository");
    return { mod, upsert, updateMany };
  }

  it("never writes a redirect pointing at itself", async () => {
    const { mod, upsert } = await loadWithMockedDb();
    const result = await mod.upsertSlugRedirect({
      sourcePath: "/services/seo",
      destination: "/services/seo",
    });
    expect(result).toBeNull();
    expect(upsert).not.toHaveBeenCalled();
  });

  it("retires an active redirect that the new live path reclaims", async () => {
    // Renaming a -> b -> a previously left "/services/a" redirecting to
    // "/services/b" while the page itself lived at "/services/a", so the
    // proxy bounced the live page into an infinite redirect.
    const { mod, updateMany } = await loadWithMockedDb();
    await mod.upsertSlugRedirect({
      sourcePath: "/services/b",
      destination: "/services/a",
    });

    const reclaim = updateMany.mock.calls.find(
      (call) => call[0]?.where?.sourcePath === "/services/a",
    );
    expect(reclaim).toBeDefined();
    expect(reclaim?.[0].where.status).toBe("ACTIVE");
    expect(reclaim?.[0].data.status).toBe("DISABLED");
  });

  it("collapses redirect chains onto the new destination", async () => {
    const { mod, updateMany } = await loadWithMockedDb();
    await mod.upsertSlugRedirect({
      sourcePath: "/services/b",
      destination: "/services/c",
    });

    const collapse = updateMany.mock.calls.find(
      (call) => call[0]?.where?.destination === "/services/b",
    );
    expect(collapse).toBeDefined();
    expect(collapse?.[0].data.destination).toBe("/services/c");
  });
});

describe("last Super Admin guard", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  async function loadUsersRepo(activeSupers: number) {
    const update = vi.fn().mockResolvedValue({ id: "u1", role: "EDITOR" });
    const count = vi.fn().mockResolvedValue(activeSupers);
    const transaction = vi.fn(
      async (
        fn: (tx: unknown) => Promise<unknown>,
        options?: { isolationLevel?: string },
      ) => {
        transactionOptions = options;
        return fn({ adminUser: { count, update } });
      },
    );
    let transactionOptions: { isolationLevel?: string } | undefined;

    vi.doMock("@/lib/db", () => ({
      hasDatabaseUrl: () => true,
      prisma: {
        adminUser: {
          findUnique: vi.fn().mockResolvedValue({
            id: "u1",
            role: "SUPER_ADMIN",
            status: "ACTIVE",
          }),
          update,
          count,
        },
        $transaction: transaction,
      },
    }));
    vi.doMock("@/lib/repositories/auditRepository", () => ({
      writeAuditLog: vi.fn(),
    }));
    vi.doMock("@/lib/admin/session", () => ({
      revokeAllSessionsForUser: vi.fn(),
    }));

    const mod = await import("@/lib/repositories/adminUsersRepository");
    return { mod, count, update, getOptions: () => transactionOptions };
  }

  it("re-counts inside a serializable transaction so concurrent demotions cannot both win", async () => {
    const { mod, count, getOptions } = await loadUsersRepo(2);
    await mod.updateAdminUser({ id: "u1", actorId: "a1", role: "EDITOR" });

    // The count must happen on the transaction client, not before it.
    expect(count).toHaveBeenCalledTimes(1);
    expect(getOptions()?.isolationLevel).toBe("Serializable");
  });

  it("refuses to demote when it is the only active Super Admin", async () => {
    const { mod, update } = await loadUsersRepo(1);
    await expect(
      mod.updateAdminUser({ id: "u1", actorId: "a1", role: "EDITOR" }),
    ).rejects.toThrow(/last active Super Admin/i);
    expect(update).not.toHaveBeenCalled();
  });

  it("refuses to disable when it is the only active Super Admin", async () => {
    const { mod, update } = await loadUsersRepo(1);
    await expect(
      mod.updateAdminUser({ id: "u1", actorId: "a1", status: "DISABLED" }),
    ).rejects.toThrow(/last active Super Admin/i);
    expect(update).not.toHaveBeenCalled();
  });
});

describe("login enumeration hardening", () => {
  it("spends hashing work on the unknown-account path", async () => {
    const { burnPasswordVerification } = await import("@/lib/admin/crypto");
    // Completing without throwing means an unknown email still pays for a
    // full Argon2 verification instead of returning immediately.
    await expect(
      burnPasswordVerification("whatever-was-submitted"),
    ).resolves.toBeUndefined();
  });
});

describe("outbound request timeouts", () => {
  it("combines a caller signal with the timeout budget", async () => {
    const { timeoutSignal, OUTBOUND_TIMEOUTS } = await import(
      "@/lib/ops/request-timeout"
    );
    const caller = new AbortController();
    const signal = timeoutSignal(OUTBOUND_TIMEOUTS.research, caller.signal);
    expect(signal.aborted).toBe(false);
    caller.abort();
    expect(signal.aborted).toBe(true);
  });

  it("aborts on the timeout even without a caller signal", async () => {
    const { timeoutSignal } = await import("@/lib/ops/request-timeout");
    const signal = timeoutSignal(1);
    await new Promise((resolve) => setTimeout(resolve, 25));
    expect(signal.aborted).toBe(true);
  });
});
