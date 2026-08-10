import { describe, expect, it, afterEach, vi } from "vitest";
import {
  formatProjectNumber,
  parseProjectNumber,
} from "@/lib/agency/project-number";

describe("agency project number format", () => {
  it("formats SL-YYYY-#### with zero padding", () => {
    expect(formatProjectNumber(2026, 12)).toBe("SL-2026-0012");
    expect(formatProjectNumber(2026, 1)).toBe("SL-2026-0001");
  });

  it("expands width beyond four digits without truncation", () => {
    expect(formatProjectNumber(2026, 10000)).toBe("SL-2026-10000");
  });

  it("parses canonical project numbers", () => {
    expect(parseProjectNumber("SL-2026-0012")).toEqual({ year: 2026, sequence: 12 });
    expect(parseProjectNumber("SL-2026-10000")).toEqual({ year: 2026, sequence: 10000 });
    expect(parseProjectNumber("INVALID")).toBeNull();
  });
});

describe("agency private storage production guard", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    vi.unstubAllEnvs();
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  it("requires s3 in production-like environments", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AGENCY_PRIVATE_STORAGE_DRIVER", "local");
    delete process.env.AGENCY_ALLOW_LOCAL_IN_PRODUCTION;

    const { validateAgencyPrivateStorageConfig } = await import("@/lib/agency/private-storage");
    const result = validateAgencyPrivateStorageConfig({ throwOnError: false });
    expect(result.ok).toBe(false);
    expect(result.issues.join(" ")).toMatch(/s3/i);
  });

  it("allows local driver in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("AGENCY_PRIVATE_STORAGE_DRIVER", "local");

    const { validateAgencyPrivateStorageConfig } = await import("@/lib/agency/private-storage");
    const result = validateAgencyPrivateStorageConfig({ throwOnError: false });
    expect(result.ok).toBe(true);
  });
});
