import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import {
  GUIDE_FIELD_ALLOWLIST,
  GUIDE_PROTECTED_FIELDS,
  COMPARISON_FIELD_ALLOWLIST,
  COMPARISON_PROTECTED_FIELDS,
  CHECKLIST_FIELD_ALLOWLIST,
  CHECKLIST_PROTECTED_FIELDS,
  GLOSSARY_FIELD_ALLOWLIST,
  GLOSSARY_PROTECTED_FIELDS,
  TEMPLATE_FIELD_ALLOWLIST,
  TEMPLATE_PROTECTED_FIELDS,
  TOOL_FIELD_ALLOWLIST,
  TOOL_PROTECTED_FIELDS,
  filterAllowedFields,
} from "@/lib/ai/content-assistants/allowlists";
import {
  applyChecklistItemOps,
  applyTemplateCopyOps,
  collectChecklistItemIds,
  collectTemplateFieldIds,
  containsFabricatedWinnerClaim,
  containsFakeRating,
} from "@/lib/ai/content-assistants/resource-id-safety";
import { getContentAssistant } from "@/lib/ai/content-assistants/registry";
import { canUseContentAssistant } from "@/lib/ai/content-assistants/security";
import {
  isResourceExpandRecommendation,
  isCommercialPageRecommendation,
} from "@/lib/ai/topic-intelligence/content-assistant-handoff";
import { assertPlatformSelectorScenarios } from "@/lib/platform-selector-scenarios";
import { getChecklistItemIds } from "@/data/checklists";
import { websiteProjectBriefTemplate } from "@/data/templates/website-project-brief-template";

describe("Phase D registry", () => {
  it("registers all six resource assistants distinctly", () => {
    expect(getContentAssistant("GUIDE").displayName).toBe("Guide");
    expect(getContentAssistant("COMPARISON").displayName).toBe("Comparison");
    expect(getContentAssistant("CHECKLIST").displayName).toBe("Checklist");
    expect(getContentAssistant("GLOSSARY").displayName).toBe("Glossary");
    expect(getContentAssistant("TEMPLATE").displayName).toBe("Template");
    expect(getContentAssistant("TOOL").displayName).toBe("Tool");
    expect(getContentAssistant("GUIDE").actions.some((a) => a.id === "RESEARCH_AND_UPDATE")).toBe(
      true,
    );
    expect(
      getContentAssistant("COMPARISON").actions.some((a) => a.id === "RESEARCH_OPTIONS"),
    ).toBe(true);
    expect(
      getContentAssistant("TOOL").actions.some((a) => a.id === "OPTIMIZE_SCORING"),
    ).toBe(false);
  });
});

describe("Allowlists + wrong-type protection", () => {
  it("rejects protected resource fields", () => {
    expect(
      filterAllowedFields(
        { intro: "ok", status: "PUBLISHED", payload: { hack: true }, slug: "x" },
        GUIDE_FIELD_ALLOWLIST,
        GUIDE_PROTECTED_FIELDS,
      ),
    ).toEqual({ intro: "ok" });

    expect(
      filterAllowedFields(
        { summary: "ok", scoreWeight: 999 },
        TOOL_FIELD_ALLOWLIST,
        TOOL_PROTECTED_FIELDS,
      ),
    ).toEqual({});
  });

  it("loadEntity rejects wrong subtype", async () => {
    // Static contract: assistants declare distinct entity types
    expect(getContentAssistant("GUIDE").entityType).not.toBe(
      getContentAssistant("CHECKLIST").entityType,
    );
    expect(getContentAssistant("COMPARISON").entityType).not.toBe(
      getContentAssistant("TOOL").entityType,
    );
  });
});

describe("Comparison neutrality", () => {
  it("blocks fabricated winners and fake ratings", () => {
    expect(containsFabricatedWinnerClaim("WordPress is clearly the winner")).toBe(
      true,
    );
    expect(containsFakeRating("WordPress 9.3/10")).toBe(true);
    expect(
      containsFabricatedWinnerClaim(
        "WordPress may fit editorial teams; Webflow may fit design-led teams.",
      ),
    ).toBe(false);
  });

  it("Comparison allowlist excludes winner fields", () => {
    expect(COMPARISON_FIELD_ALLOWLIST.has("winner")).toBe(false);
    expect(COMPARISON_PROTECTED_FIELDS.has("payload")).toBe(true);
  });
});

describe("Checklist stable IDs", () => {
  it("preserves existing item IDs on wording update", () => {
    const sections = [
      {
        id: "sec-a",
        title: "A",
        items: [
          { id: "item-1", text: "Do thing" },
          { id: "item-2", text: "Do other" },
        ],
      },
    ];
    const before = collectChecklistItemIds(sections);
    const { sections: next } = applyChecklistItemOps(
      sections,
      [{ id: "item-1", text: "Do the thing clearly." }],
      undefined,
    );
    expect(collectChecklistItemIds(next)).toEqual(before);
    expect((next[0] as { items: Array<{ text: string }> }).items[0].text).toBe(
      "Do the thing clearly.",
    );
  });

  it("generates server IDs for new items and ignores AI-supplied ids", () => {
    const sections = [
      {
        id: "sec-a",
        title: "A",
        items: [{ id: "item-1", text: "Existing" }],
      },
    ];
    const { sections: next, warnings } = applyChecklistItemOps(sections, undefined, [
      {
        sectionId: "sec-a",
        text: "Brand new step",
        id: "ai-chose-this-id",
      },
    ]);
    const ids = collectChecklistItemIds(next);
    expect(ids).toContain("item-1");
    expect(ids).not.toContain("ai-chose-this-id");
    expect(ids.length).toBe(2);
    expect(warnings.some((w) => /ignored/i.test(w))).toBe(true);
  });

  it("seed checklist IDs remain unique (localStorage contract)", async () => {
    const { websiteRedesignChecklist } = await import(
      "@/data/checklists/website-redesign-checklist"
    );
    const ids = getChecklistItemIds(websiteRedesignChecklist);
    expect(ids.length).toBeGreaterThan(100);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("Template technical protection", () => {
  it("updates labels without changing field ids or option values", () => {
    const sections = [
      {
        id: "s1",
        title: "Section",
        fields: [
          {
            id: "field-a",
            kind: "select",
            label: "Old",
            help: "Help",
            placeholder: "Enter text here",
            options: [
              { value: "new-build", label: "New" },
              { value: "redesign", label: "Redesign" },
            ],
            showWhenAny: [{ fieldId: "other", values: ["x"] }],
          },
        ],
      },
    ];
    const beforeIds = collectTemplateFieldIds(sections);
    const conditionBefore = JSON.stringify(
      (sections[0].fields[0] as { showWhenAny: unknown }).showWhenAny,
    );
    const { sections: next } = applyTemplateCopyOps(
      sections,
      [{ id: "s1", title: "Updated section" }],
      [
        {
          id: "field-a",
          label: "Project type",
          placeholder: "e.g. Launch a new marketing site in Q4",
          optionLabels: [{ value: "new-build", label: "New website" }],
        },
      ],
    );
    expect(collectTemplateFieldIds(next)).toEqual(beforeIds);
    const field = (next[0] as { fields: Array<Record<string, unknown>> }).fields[0];
    expect(field.id).toBe("field-a");
    expect(field.label).toBe("Project type");
    expect(JSON.stringify(field.showWhenAny)).toBe(conditionBefore);
    const opts = field.options as Array<{ value: string; label: string }>;
    expect(opts.find((o) => o.value === "new-build")?.label).toBe("New website");
    expect(opts.map((o) => o.value).sort()).toEqual(["new-build", "redesign"]);
  });

  it("project brief template field count remains stable", () => {
    const ids = websiteProjectBriefTemplate.sections.flatMap((s) =>
      s.fields.map((f) => f.id),
    );
    expect(ids.length).toBe(73);
    expect(new Set(ids).size).toBe(73);
  });
});

describe("Tool scoring isolation", () => {
  it("Tool Copy module does not import platform-selector engine", () => {
    const src = readFileSync(
      join(process.cwd(), "lib/ai/content-assistants/tool/index.ts"),
      "utf8",
    );
    expect(src).not.toMatch(/from ["']@\/lib\/platform-selector/);
    expect(src).not.toMatch(/from ["']@\/data\/tools\/website-platform-selector/);
    expect(src).not.toMatch(/evaluatePlatformSelector/);
    expect(TOOL_FIELD_ALLOWLIST.has("scoreWeight")).toBe(false);
    expect(TOOL_PROTECTED_FIELDS.has("weights")).toBe(true);
  });

  it("all Platform Selector scenarios still pass", () => {
    const results = assertPlatformSelectorScenarios();
    const failures = results.filter((r) => !r.ok);
    expect(failures).toEqual([]);
    expect(results.length).toBeGreaterThanOrEqual(8);
  });
});

describe("Glossary / Guide / privacy", () => {
  it("Glossary allowlist includes definitions not topic group", () => {
    expect(GLOSSARY_FIELD_ALLOWLIST.has("shortDefinition")).toBe(true);
    expect(GLOSSARY_PROTECTED_FIELDS.has("glossaryTopicGroup")).toBe(true);
  });

  it("Checklist/Template/Tool context builders exclude Enquiry", () => {
    for (const file of [
      "lib/ai/content-assistants/resource-shared.ts",
      "lib/ai/content-assistants/guide/index.ts",
      "lib/ai/content-assistants/checklist/index.ts",
      "lib/ai/content-assistants/tool/index.ts",
    ]) {
      const src = readFileSync(join(process.cwd(), file), "utf8");
      expect(src).not.toMatch(/prisma\.enquiry/i);
    }
  });

  it("RBAC still requires AI + draft", () => {
    expect(canUseContentAssistant("EDITOR")).toBe(true);
    expect(canUseContentAssistant("REVIEWER")).toBe(false);
  });

  it("TI resource expand vs commercial detection", () => {
    expect(isResourceExpandRecommendation("EXPAND_EXISTING_RESOURCE")).toBe(true);
    expect(isCommercialPageRecommendation("EXPAND_EXISTING_RESOURCE")).toBe(false);
    expect(isCommercialPageRecommendation("UPDATE_PLATFORM_PAGE")).toBe(true);
  });
});

describe("Checklist allowlist forbids rewrite-all IDs", () => {
  it("itemUpdates allowed; raw id override fields protected", () => {
    expect(CHECKLIST_FIELD_ALLOWLIST.has("itemUpdates")).toBe(true);
    expect(CHECKLIST_PROTECTED_FIELDS.has("itemIds")).toBe(true);
    expect(TEMPLATE_FIELD_ALLOWLIST.has("fieldCopyUpdates")).toBe(true);
    expect(TEMPLATE_PROTECTED_FIELDS.has("showWhenAny")).toBe(true);
  });
});
