import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {},
}));

import { CACHE_TAGS } from "@/lib/admin/publishing";

describe("CACHE_TAGS", () => {
  it("exposes hub and entity tag constants", () => {
    expect(CACHE_TAGS.homepage).toBe("homepage");
    expect(CACHE_TAGS.sitemap).toBe("sitemap");
    expect(CACHE_TAGS.servicesHub).toBe("services-hub");
    expect(CACHE_TAGS.solutionsHub).toBe("solutions-hub");
    expect(CACHE_TAGS.platformsHub).toBe("platforms-hub");
    expect(CACHE_TAGS.services).toBe("service");
    expect(CACHE_TAGS.solutions).toBe("solution");
    expect(CACHE_TAGS.platforms).toBe("platform");
  });

  it("builds per-slug entity tags", () => {
    expect(CACHE_TAGS.service("website-design")).toBe("service:website-design");
    expect(CACHE_TAGS.solution("slow-website")).toBe("solution:slow-website");
    expect(CACHE_TAGS.platform("wordpress")).toBe("platform:wordpress");
    expect(CACHE_TAGS.managedPage("about")).toBe("managed-page:about");
  });
});
