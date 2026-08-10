import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

import {
  revalidateService,
  revalidateSolution,
  revalidateWork,
  revalidateNavigation,
  revalidateSiteSettings,
  revalidateManagedPage,
  CACHE_TAGS,
} from "@/lib/admin/publishing";
import { revalidateTag, revalidatePath } from "next/cache";

const mockRevalidateTag = vi.mocked(revalidateTag);
const mockRevalidatePath = vi.mocked(revalidatePath);

describe("public cache invalidation helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("invalidates service list and slug tags on publish", () => {
    revalidateService("website-design");

    expect(mockRevalidateTag).toHaveBeenCalledWith(
      CACHE_TAGS.service("website-design"),
      "max",
    );
    expect(mockRevalidateTag).toHaveBeenCalledWith(CACHE_TAGS.services, "max");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/services/website-design");
  });

  it("invalidates solution tags", () => {
    revalidateSolution("slow-website");
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      CACHE_TAGS.solution("slow-website"),
      "max",
    );
  });

  it("invalidates work, homepage, and industries on work publish", () => {
    revalidateWork("the-coast");
    expect(mockRevalidateTag).toHaveBeenCalledWith(CACHE_TAGS.workItem("the-coast"), "max");
    expect(mockRevalidateTag).toHaveBeenCalledWith(CACHE_TAGS.homepage, "max");
    expect(mockRevalidateTag).toHaveBeenCalledWith(CACHE_TAGS.industries, "max");
  });

  it("invalidates navigation layout", () => {
    revalidateNavigation();
    expect(mockRevalidateTag).toHaveBeenCalledWith(CACHE_TAGS.navigation, "max");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("invalidates site settings and dependent routes", () => {
    revalidateSiteSettings();
    expect(mockRevalidateTag).toHaveBeenCalledWith(CACHE_TAGS.siteSettings, "max");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/contact");
  });

  it("invalidates managed page tag and public route", () => {
    revalidateManagedPage("about");
    expect(mockRevalidateTag).toHaveBeenCalledWith(CACHE_TAGS.managedPage("about"), "max");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/about");
  });
});
