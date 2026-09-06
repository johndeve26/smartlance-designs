import { describe, expect, it } from "vitest";
import { can } from "@/lib/admin/rbac";
import { contentRoutes, resourceHref } from "@/lib/content-routes";
import { CACHE_TAGS } from "@/lib/admin/publishing";
import { getPublishedChecklists } from "@/data/checklists";
import { getPublishedTemplates } from "@/data/templates";
import { getPostSlugs } from "@/lib/blog";
import { projects } from "@/data/portfolio";
import { testimonials } from "@/data/testimonials";
import { industriesCatalog } from "@/data/industries";
import { getPublishedGlossaryEntries } from "@/data/glossary";
import { legacyBlogRedirects } from "@/data/legacy-blog-redirects";

describe("Phase 3 inventory parity (source)", () => {
  it("preserves verified content counts", () => {
    expect(getPostSlugs()).toHaveLength(60);
    expect(projects.filter((p) => p.published)).toHaveLength(10);
    expect(testimonials.filter((t) => t.published)).toHaveLength(7);
    expect(industriesCatalog).toHaveLength(20);
    expect(industriesCatalog.filter((i) => i.group === "proven")).toHaveLength(5);
    expect(getPublishedGlossaryEntries()).toHaveLength(12);
    expect(Object.keys(legacyBlogRedirects)).toHaveLength(56);
  });

  it("preserves checklist stable item IDs (127)", () => {
    const checklist = getPublishedChecklists()[0];
    expect(checklist).toBeTruthy();
    const ids: string[] = [];
    for (const section of checklist.sections) {
      for (const item of section.items ?? []) ids.push(item.id);
      for (const group of section.subgroups ?? []) {
        for (const item of group.items ?? []) ids.push(item.id);
      }
    }
    expect(ids).toHaveLength(127);
    expect(new Set(ids).size).toBe(127);
  });

  it("preserves template stable field IDs (73 across 14 sections)", () => {
    const template = getPublishedTemplates()[0];
    expect(template.sections).toHaveLength(14);
    const ids: string[] = [];
    for (const section of template.sections) {
      for (const field of section.fields ?? []) ids.push(field.id);
    }
    expect(ids).toHaveLength(73);
    expect(new Set(ids).size).toBe(73);
  });
});

describe("Phase 3 RBAC", () => {
  it("restricts testimonial verification to Editor/Super Admin", () => {
    expect(can("SUPER_ADMIN", "verify_testimonial")).toBe(true);
    expect(can("EDITOR", "verify_testimonial")).toBe(true);
    expect(can("CONTENT_MANAGER", "verify_testimonial")).toBe(false);
    expect(can("REVIEWER", "verify_testimonial")).toBe(false);
  });
});

describe("Phase 3 routes and cache tags", () => {
  it("builds canonical routes", () => {
    expect(contentRoutes.blog("x")).toBe("/blog/x");
    expect(contentRoutes.work("gemini")).toBe("/work/gemini");
    expect(resourceHref("guide", "website-redesign-guide")).toBe(
      "/guides/website-redesign-guide",
    );
    expect(resourceHref("comparison", "wordpress-vs-webflow")).toBe(
      "/compare/wordpress-vs-webflow",
    );
  });

  it("exposes Phase 3 cache tags", () => {
    expect(CACHE_TAGS.insight("a")).toBe("insight:a");
    expect(CACHE_TAGS.workItem("b")).toBe("work:b");
    expect(CACHE_TAGS.resource("guide", "c")).toBe("resource:guide:c");
  });
});

describe("testimonial publish rule (conceptual)", () => {
  it("requires verified AND published for public render", () => {
    const candidates = [
      { verified: true, status: "PUBLISHED" },
      { verified: false, status: "PUBLISHED" },
      { verified: true, status: "DRAFT" },
    ];
    const publicVisible = candidates.filter(
      (t) => t.verified && t.status === "PUBLISHED",
    );
    expect(publicVisible).toHaveLength(1);
  });
});
