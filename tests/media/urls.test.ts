import { afterEach, describe, expect, it } from "vitest";
import { resolveMediaUrl } from "@/lib/media/urls";

describe("resolveMediaUrl", () => {
  afterEach(() => {
    delete process.env.MEDIA_PUBLIC_BASE_URL;
  });

  it("returns the original path when no public base is configured", () => {
    expect(resolveMediaUrl("/images/projects/padeya/hero.webp")).toBe(
      "/images/projects/padeya/hero.webp",
    );
  });

  it("maps site-relative paths to the configured R2 public base", () => {
    process.env.MEDIA_PUBLIC_BASE_URL =
      "https://pub-4261197fb4914f20b677a4b3d5ff4253.r2.dev";
    expect(resolveMediaUrl("/images/projects/padeya/hero.webp")).toBe(
      "https://pub-4261197fb4914f20b677a4b3d5ff4253.r2.dev/images/projects/padeya/hero.webp",
    );
  });

  it("leaves absolute URLs unchanged", () => {
    process.env.MEDIA_PUBLIC_BASE_URL =
      "https://pub-4261197fb4914f20b677a4b3d5ff4253.r2.dev";
    expect(resolveMediaUrl("https://example.com/image.webp")).toBe(
      "https://example.com/image.webp",
    );
  });
});
