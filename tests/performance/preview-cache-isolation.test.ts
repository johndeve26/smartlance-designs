import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("preview cache isolation", () => {
  it("uses dedicated preview loaders in admin preview route", () => {
    const source = readFileSync(
      path.join(process.cwd(), "app/admin/preview/[entity]/[id]/page.tsx"),
      "utf8",
    );

    expect(source).toContain("getServiceForPreview");
    expect(source).toContain("getHomepageForPreview");
    expect(source).not.toContain("getPublishedServiceBySlug");
    expect(source).not.toContain("@/lib/public/cache");
  });

  it("does not wrap preview loaders in public cache module", () => {
    const source = readFileSync(
      path.join(process.cwd(), "lib/public/cache/cached-reads.ts"),
      "utf8",
    );

    expect(source).not.toContain("ForPreview");
    expect(source).not.toContain("getHomepageAdmin");
    expect(source).not.toContain("Admin");
  });
});

describe("public cache module privacy", () => {
  it("bypasses unstable_cache in test environment", async () => {
    const { shouldBypassPublicCache } = await import("@/lib/public/cache/config");
    expect(shouldBypassPublicCache()).toBe(true);
  });
});
