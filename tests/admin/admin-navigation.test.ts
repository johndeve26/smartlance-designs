import { describe, expect, it } from "vitest";
import type { AdminRole } from "@prisma/client";
import { adminNavigation, flattenAdminNavItems } from "@/lib/admin/navigation";
import {
  activeAdminNavItemId,
  adminBreadcrumbs,
  filterAdminNavigation,
  isAdminNavItemActive,
  itemAllowed,
  viewSiteUrl,
} from "@/lib/admin/navigation-active";

describe("admin navigation IA", () => {
  it("defines the expected sidebar groups", () => {
    expect(adminNavigation.map((g) => g.label)).toEqual([
      "Overview",
      "Content",
      "Editorial",
      "Site Management",
      "Operations",
      "System",
    ]);
  });

  it("orders content entities for CMS workflows", () => {
    const content = adminNavigation.find((g) => g.id === "content");
    expect(content?.items.map((i) => i.label)).toEqual([
      "Homepage",
      "Services",
      "Solutions",
      "Platforms",
      "Industries",
      "Work",
      "Testimonials",
    ]);
  });

  it("keeps editorial tools separate", () => {
    const editorial = adminNavigation.find((g) => g.id === "editorial");
    expect(editorial?.items.map((i) => i.label)).toEqual([
      "Insights",
      "Resources",
      "AI Writer",
      "Topic Intelligence",
      "Content Audit",
    ]);
  });

  it("uses only valid internal admin hrefs", () => {
    for (const item of flattenAdminNavItems()) {
      expect(item.href.startsWith("/admin")).toBe(true);
      expect(item.href).not.toBe("#");
    }
  });

  it("maps active routes for nested editors", () => {
    expect(activeAdminNavItemId("/admin/services/abc")).toBe("services");
    expect(activeAdminNavItemId("/admin/resources/comparison/abc")).toBe(
      "resources",
    );
    expect(activeAdminNavItemId("/admin/ai-writer/abc")).toBe("ai-writer");
    expect(activeAdminNavItemId("/admin/ai-writer/discover")).toBe(
      "topic-intelligence",
    );
    expect(activeAdminNavItemId("/admin/content-audit")).toBe("content-audit");
    expect(activeAdminNavItemId("/admin/seo")).toBe("seo");
    expect(activeAdminNavItemId("/admin/enquiries/contact/1")).toBe("enquiries");
  });

  it("distinguishes AI Writer from Topic Intelligence", () => {
    expect(isAdminNavItemActive("/admin/ai-writer/discover", "topic-intelligence")).toBe(
      true,
    );
    expect(isAdminNavItemActive("/admin/ai-writer/discover", "ai-writer")).toBe(
      false,
    );
    expect(isAdminNavItemActive("/admin/ai-writer/settings", "ai-writer")).toBe(
      true,
    );
  });

  it("filters navigation by role capabilities", () => {
    const editor = filterAdminNavigation("EDITOR" as AdminRole);
    const labels = editor.flatMap((g) => g.items.map((i) => i.label));
    expect(labels).toContain("Services");
    expect(labels).toContain("AI Writer");
    expect(labels).not.toContain("Users");

    const reviewer = filterAdminNavigation("REVIEWER" as AdminRole);
    const reviewerLabels = reviewer.flatMap((g) => g.items.map((i) => i.label));
    expect(reviewerLabels).toContain("Dashboard");
    expect(reviewerLabels).not.toContain("Users");
    expect(reviewerLabels).not.toContain("Settings");
  });

  it("hides super-admin items from editors", () => {
    expect(itemAllowed("EDITOR", { id: "users", label: "Users", href: "/admin/users", capability: "manage_users" })).toBe(
      false,
    );
    expect(itemAllowed("SUPER_ADMIN", { id: "users", label: "Users", href: "/admin/users", capability: "manage_users" })).toBe(
      true,
    );
  });

  it("builds admin breadcrumbs", () => {
    expect(adminBreadcrumbs("/admin/services")).toEqual([
      { label: "Admin", href: "/admin" },
      { label: "Services" },
    ]);
    expect(adminBreadcrumbs("/admin/ai-writer/discover")[2]?.label).toBe(
      "Topic Intelligence",
    );
  });

  it("exposes a public site URL for View Site", () => {
    expect(viewSiteUrl().startsWith("http")).toBe(true);
  });
});
