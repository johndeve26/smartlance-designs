import { describe, expect, it } from "vitest";
import type { CmsResource } from "@prisma/client";
import { websiteRedesignChecklist } from "@/data/checklists/website-redesign-checklist";
import { websiteRedesignGuide } from "@/data/guides/website-redesign-guide";
import { wordpressVsWebflow } from "@/data/comparisons/wordpress-vs-webflow";
import { websiteProjectBriefTemplate } from "@/data/templates/website-project-brief-template";
import { websitePlatformSelectorTool } from "@/data/tools/website-platform-selector";
import { glossaryEntries } from "@/data/glossary/entries";
import {
  columnsFromResourceRow,
  composeResourcePayload,
  composeResourceSaveData,
  resolvePublicResourceContent,
} from "@/lib/resources/canonical";

function row(
  type: CmsResource["type"],
  payload: unknown,
  overrides: Partial<CmsResource> = {},
): CmsResource {
  const basePayload =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : {};
  return {
    id: "res-1",
    type,
    slug: String(basePayload.slug ?? "sample"),
    title: String(basePayload.title ?? "Sample"),
    description: String(basePayload.description ?? "Description"),
    deck: null,
    href: "/sample",
    payload,
    featured: false,
    featuredOnResources: false,
    featuredOrder: 0,
    readingTime: null,
    author: null,
    heroImagePath: null,
    heroImageAlt: null,
    relatedServiceHrefs: null,
    relatedSolutionSlugs: null,
    relatedPlatformSlugs: null,
    relatedInsightSlugs: null,
    relatedResourceIds: null,
    aliases: null,
    acronym: null,
    shortDefinition: null,
    seoTitle: null,
    seoDescription: null,
    ogTitle: null,
    ogDescription: null,
    ogImagePath: null,
    noIndex: false,
    canonicalOverride: null,
    status: "PUBLISHED",
    publishedAt: new Date("2026-08-07"),
    materialUpdatedAt: null,
    createdById: null,
    updatedById: null,
    createdAt: new Date("2026-08-07"),
    updatedAt: new Date("2026-08-07"),
    ...overrides,
  } as CmsResource;
}

describe("resource canonical save + resolve", () => {
  it("merges authoritative columns into guide payload on save", () => {
    const structural = structuredClone(websiteRedesignGuide);
    structural.title = "Stale payload title";

    const data = composeResourceSaveData({
      type: "guide",
      columns: {
        slug: websiteRedesignGuide.slug,
        title: "Updated Guide Title",
        description: "Updated description",
        deck: "Updated deck",
        readingTime: "30 min read",
      },
      structuralPayload: structural,
      existing: row("guide", websiteRedesignGuide),
    });

    const payload = data.payload as Record<string, unknown>;
    expect(payload.title).toBe("Updated Guide Title");
    expect(payload.description).toBe("Updated description");
    expect(payload.deck).toBe("Updated deck");
    expect(Array.isArray(payload.sections)).toBe(true);
  });

  it("preserves checklist item IDs while updating column title", () => {
    const itemId = websiteRedesignChecklist.sections[0]?.items[0]?.id;
    expect(itemId).toBeTruthy();

    const payload = composeResourcePayload(
      "checklist",
      {
        slug: websiteRedesignChecklist.slug,
        title: "Updated Checklist Title",
        description: websiteRedesignChecklist.description,
      },
      websiteRedesignChecklist,
    ) as typeof websiteRedesignChecklist;

    expect(payload.title).toBe("Updated Checklist Title");
    expect(payload.sections[0]?.items[0]?.id).toBe(itemId);
  });

  it("preserves template field IDs and showWhenAny conditions", () => {
    const field = websiteProjectBriefTemplate.sections
      .flatMap((section) => section.fields)
      .find((item) => item.showWhenAny?.length);
    expect(field?.id).toBeTruthy();

    const payload = composeResourcePayload(
      "template",
      {
        slug: websiteProjectBriefTemplate.slug,
        title: "Updated Template",
        description: websiteProjectBriefTemplate.description,
      },
      websiteProjectBriefTemplate,
    ) as typeof websiteProjectBriefTemplate;

    const updatedField = payload.sections
      .flatMap((section) => section.fields)
      .find((item) => item.id === field?.id);
    expect(updatedField?.showWhenAny).toEqual(field?.showWhenAny);
  });

  it("strips tool scoring engine fields from generated payload", () => {
    const structural = {
      ...websitePlatformSelectorTool,
      platformSelectorQuestions: [{ id: "q1" }],
      scoreWeight: 99,
    };

    const payload = composeResourcePayload(
      "tool",
      {
        slug: websitePlatformSelectorTool.slug,
        title: "Updated Tool Title",
        description: websitePlatformSelectorTool.description,
      },
      structural,
    ) as Record<string, unknown>;

    expect(payload.title).toBe("Updated Tool Title");
    expect(payload.platformSelectorQuestions).toBeUndefined();
    expect(payload.scoreWeight).toBeUndefined();
  });

  it("maps glossary columns to term and shortDefinition in payload", () => {
    const clsEntry = glossaryEntries.find((entry) => entry.slug === "cls")!;
    const payload = composeResourcePayload(
      "glossary",
      {
        slug: clsEntry.slug,
        title: "Cumulative Layout Shift",
        description: "Layout movement metric",
        shortDefinition: "Layout movement metric",
      },
      clsEntry,
    ) as typeof clsEntry;

    expect(payload.term).toBe("Cumulative Layout Shift");
    expect(payload.shortDefinition).toBe("Layout movement metric");
  });

  it("does not wipe glossary columns when saving a guide", () => {
    const existing = row("guide", websiteRedesignGuide, {
      shortDefinition: "keep-me",
      aliases: ["alias-a"],
    });

    const data = composeResourceSaveData({
      type: "guide",
      columns: columnsFromResourceRow(existing),
      structuralPayload: websiteRedesignGuide,
      existing,
    });

    expect(data.shortDefinition).toBeUndefined();
    expect(data.aliases).toBeUndefined();
  });

  it("resolvePublicResourceContent validates payload from row columns", () => {
    const existing = row("comparison", wordpressVsWebflow, {
      title: "Column Title Wins",
      description: "Column description",
    });

    const resolved = resolvePublicResourceContent<typeof wordpressVsWebflow>(
      existing,
    );

    expect(resolved.title).toBe("Column Title Wins");
    expect(resolved.comparisonCriteria[0]?.id).toBe(
      wordpressVsWebflow.comparisonCriteria[0]?.id,
    );
  });
});
