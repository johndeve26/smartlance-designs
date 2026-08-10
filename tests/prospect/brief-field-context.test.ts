import { describe, expect, it } from "vitest";
import {
  buildBriefContextForField,
  combineBriefFieldInput,
  getBriefFieldWritingGuidance,
  isSparseBriefFieldInput,
} from "@/lib/prospect/ai/brief-field-context";

describe("brief field context", () => {
  it("detects sparse input", () => {
    expect(isSparseBriefFieldInput("i want to create a new website")).toBe(true);
    expect(
      isSparseBriefFieldInput(
        "We are redesigning our site to improve lead quality. The new site should support our expanded service line across West Africa.",
      ),
    ).toBe(false);
  });

  it("combines current value and rough notes", () => {
    expect(combineBriefFieldInput("", "new website for launch")).toBe(
      "new website for launch",
    );
    expect(combineBriefFieldInput("Draft", "more notes")).toBe("Draft\nmore notes");
  });

  it("returns guidance for project summary", () => {
    expect(getBriefFieldWritingGuidance("project-summary")).toMatch(/3–5 sentences/i);
  });

  it("builds brief context excluding current field", () => {
    const context = buildBriefContextForField(
      {
        "business-name": "Padeya",
        "project-summary": "New marketing site",
      },
      "project-summary",
    );
    expect(context.some((row) => row.fieldId === "project-summary")).toBe(false);
    expect(context.some((row) => row.label === "Business name")).toBe(true);
  });
});

describe("improveFieldSchema", () => {
  it("requires substantive suggestions", async () => {
    const { improveFieldSchema } = await import("@/lib/prospect/ai/brief-assistant");
    expect(() =>
      improveFieldSchema.parse({
        suggestion: "Too short",
        rationale: "test",
        openQuestions: [],
      }),
    ).toThrow();
  });
});
