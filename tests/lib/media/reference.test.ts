import { afterEach, describe, expect, it } from "vitest";
import {
  classifyMediaReference,
  mediaReferencesMatch,
  normalizePublicMediaPath,
  resolvePublicMediaReference,
  staticStorageKey,
} from "@/lib/media/reference";

describe("media reference contract", () => {
  afterEach(() => {
    delete process.env.MEDIA_PUBLIC_BASE_URL;
  });

  it("normalizes approved static paths", () => {
    expect(normalizePublicMediaPath("/images/projects/padeya.webp")).toBe(
      "/images/projects/padeya.webp",
    );
    expect(normalizePublicMediaPath("images/projects/padeya.webp")).toBe(
      "/images/projects/padeya.webp",
    );
    expect(normalizePublicMediaPath("//images//projects//padeya.webp")).toBe(
      "/images/projects/padeya.webp",
    );
  });

  it("rejects path traversal", () => {
    expect(normalizePublicMediaPath("../../secret")).toBeNull();
    expect(normalizePublicMediaPath("/images/../secret")).toBeNull();
    expect(classifyMediaReference("../../secret")).toBe("INVALID");
  });

  it("rejects unsafe schemes", () => {
    expect(normalizePublicMediaPath("javascript:alert(1)")).toBeNull();
    expect(normalizePublicMediaPath("file:///etc/passwd")).toBeNull();
    expect(classifyMediaReference("data:text/html,x")).toBe("INVALID");
  });

  it("classifies static and external references", () => {
    expect(classifyMediaReference("/images/projects/foo.webp")).toBe(
      "VALID_STATIC",
    );
    expect(classifyMediaReference("https://example.com/a.webp")).toBe(
      "EXTERNAL_URL",
    );
    expect(classifyMediaReference("/uploads/20260101/foo.webp")).toBe(
      "VALID_MANAGED",
    );
  });

  it("matches content refs to asset URLs including CDN prefix", () => {
    process.env.MEDIA_PUBLIC_BASE_URL =
      "https://cdn.example.com";
    expect(
      mediaReferencesMatch(
        "/images/projects/padeya.webp",
        "/images/projects/padeya.webp",
      ),
    ).toBe(true);
    expect(
      mediaReferencesMatch(
        "https://cdn.example.com/images/projects/padeya.webp",
        "/images/projects/padeya.webp",
      ),
    ).toBe(true);
  });

  it("resolves static paths without rewriting managed URLs blindly", () => {
    expect(resolvePublicMediaReference("/images/projects/padeya.webp")).toBe(
      "/images/projects/padeya.webp",
    );
    expect(resolvePublicMediaReference("https://example.com/a.webp")).toBe(
      "https://example.com/a.webp",
    );
  });

  it("builds deterministic static storage keys", () => {
    expect(staticStorageKey("/images/projects/padeya.webp")).toBe(
      "static:/images/projects/padeya.webp",
    );
  });
});

describe("static discovery inventory", () => {
  it("includes known repository assets with normalized public paths", async () => {
    const { discoverStaticMediaAssets } = await import(
      "@/lib/media/static-discovery"
    );
    const assets = discoverStaticMediaAssets();
    const paths = assets.map((item) => item.publicPath);
    expect(paths.some((path) => path.startsWith("/images/"))).toBe(true);
    for (const asset of assets) {
      expect(asset.publicPath.startsWith("/images/") || asset.publicPath.startsWith("/og/")).toBe(
        true,
      );
      expect(asset.byteSize).toBeGreaterThan(0);
    }
  });
});
