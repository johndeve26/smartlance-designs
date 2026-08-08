import {
  validateImageUpload,
  getMaxUploadBytes,
  buildStorageKey,
} from "@/lib/media/validation";
import { isSafePublicUrl, normalizeInternalPath } from "@/lib/ops/url-safety";
import { can } from "@/lib/admin/rbac";
import { describe, expect, it, vi, beforeEach } from "vitest";

function png1x1() {
  // Minimal 1x1 PNG
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );
}

describe("media validation", () => {
  it("accepts a valid PNG", () => {
    const result = validateImageUpload({
      buffer: png1x1(),
      originalFilename: "test.png",
      reportedMime: "image/png",
    });
    expect(result.mimeType).toBe("image/png");
    expect(result.extension).toBe("png");
    expect(result.width).toBe(1);
    expect(result.height).toBe(1);
  });

  it("rejects SVG by extension", () => {
    expect(() =>
      validateImageUpload({
        buffer: Buffer.from("<svg></svg>"),
        originalFilename: "x.svg",
      }),
    ).toThrow(/Unsupported|SVG/i);
  });

  it("rejects mismatched extension vs contents", () => {
    expect(() =>
      validateImageUpload({
        buffer: png1x1(),
        originalFilename: "photo.jpg",
      }),
    ).toThrow(/extension does not match/i);
  });

  it("rejects oversized files", () => {
    const max = getMaxUploadBytes();
    const huge = Buffer.alloc(max + 1, 0xff);
    // Pretend JPEG header
    huge[0] = 0xff;
    huge[1] = 0xd8;
    huge[2] = 0xff;
    expect(() =>
      validateImageUpload({
        buffer: huge,
        originalFilename: "big.jpg",
      }),
    ).toThrow(/upload limit/i);
  });

  it("builds safe storage keys", () => {
    const key = buildStorageKey("My Photo!!.PNG", "png");
    expect(key).toMatch(/^uploads\/\d{8}\/[a-z0-9]+-my-photo-?\.png$/);
  });
});

describe("url safety", () => {
  it("allows internal paths and https", () => {
    expect(isSafePublicUrl("/contact")).toBe(true);
    expect(isSafePublicUrl("https://example.com")).toBe(true);
    expect(isSafePublicUrl("mailto:a@b.com")).toBe(true);
  });

  it("rejects javascript and protocol-relative", () => {
    expect(isSafePublicUrl("javascript:alert(1)")).toBe(false);
    expect(isSafePublicUrl("//evil.com")).toBe(false);
    expect(isSafePublicUrl("data:text/html,hi")).toBe(false);
  });

  it("normalizes internal paths", () => {
    expect(normalizeInternalPath("/a/b")).toBe("/a/b");
    expect(normalizeInternalPath("https://x.com/a")).toBe(null);
  });
});

describe("rbac phase 4", () => {
  it("grants media and settings capabilities appropriately", () => {
    expect(can("SUPER_ADMIN", "media_permanent_delete")).toBe(true);
    expect(can("EDITOR", "media_permanent_delete")).toBe(false);
    expect(can("EDITOR", "manage_media")).toBe(true);
    expect(can("CONTENT_MANAGER", "manage_media")).toBe(true);
    expect(can("REVIEWER", "manage_settings")).toBe(false);
    expect(can("SUPER_ADMIN", "settings_critical")).toBe(true);
  });
});

describe("redirect loop helpers (mocked db)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("flags source == destination via detectRedirectLoop with empty db", async () => {
    vi.mock("@/lib/db", () => ({
      hasDatabaseUrl: () => true,
      prisma: {
        redirect: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
      },
    }));
    const { detectRedirectLoop: detect } = await import(
      "@/lib/repositories/redirectsRepository"
    );
    const result = await detect("/a", "/a");
    expect(result.loop).toBe(true);
  });
});

describe("seo health summary shape", () => {
  it("exports buildSeoInventory", async () => {
    const mod = await import("@/lib/ops/seo-health");
    expect(typeof mod.buildSeoInventory).toBe("function");
  });
});

describe("storage provider selection", () => {
  it("defaults to local outside production", async () => {
    vi.resetModules();
    process.env.MEDIA_STORAGE_PROVIDER = "local";
    delete process.env.VERCEL_ENV;
    const { getConfiguredStorageProviderName, resetMediaStorageCache } =
      await import("@/lib/media/storage");
    resetMediaStorageCache();
    expect(getConfiguredStorageProviderName()).toBe("local");
  });
});
