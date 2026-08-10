import { describe, expect, it } from "vitest";
import {
  isQuestionAnswered,
  parseQuestionOptions,
  validateResponseValue,
} from "@/lib/onboarding/responses";
import {
  computeOnboardingProgress,
  isEligibleToComplete,
} from "@/lib/onboarding/progress";
import { assertNoSecretFields } from "@/lib/agency/requirements";

describe("onboarding response validation", () => {
  it("rejects invalid single select option", () => {
    expect(() =>
      validateResponseValue({
        question: {
          type: "SINGLE_SELECT",
          required: true,
          optionsJson: [{ key: "a", label: "A", position: 0 }],
          validationJson: null,
        },
        valueText: "invalid",
      }),
    ).toThrow(/Invalid selection/);
  });

  it("rejects javascript: URLs", () => {
    expect(() =>
      validateResponseValue({
        question: {
          type: "URL",
          required: true,
          optionsJson: null,
          validationJson: null,
        },
        valueText: "javascript:alert(1)",
      }),
    ).toThrow();
  });

  it("normalizes email", () => {
    const result = validateResponseValue({
      question: {
        type: "EMAIL",
        required: true,
        optionsJson: null,
        validationJson: null,
      },
      valueText: "Test@Example.com",
    });
    expect(result.valueText).toBe("test@example.com");
  });

  it("parses question options", () => {
    const options = parseQuestionOptions([
      { key: "x", label: "X", position: 1 },
      { key: "y", label: "Y", position: 0 },
    ]);
    expect(options.map((o) => o.key)).toEqual(["y", "x"]);
  });
});

describe("onboarding progress", () => {
  it("blocks completion when required requirement outstanding", () => {
    const progress = computeOnboardingProgress({
      questions: [],
      responses: [],
      requirements: [
        {
          id: "r1",
          required: true,
          clientVisible: true,
          status: "REQUESTED",
          dueDate: null,
        } as never,
      ],
      fileCountsByQuestionId: new Map(),
    });
    expect(isEligibleToComplete(progress)).toBe(false);
    expect(progress.requiredRequirementsTotal).toBe(1);
  });

  it("counts answered required questions", () => {
    const progress = computeOnboardingProgress({
      questions: [
        {
          id: "q1",
          required: true,
          clientVisible: true,
          type: "SHORT_TEXT",
        } as never,
      ],
      responses: [
        {
          questionId: "q1",
          valueText: "hello",
          reviewStatus: "ACCEPTED",
        } as never,
      ],
      requirements: [],
      fileCountsByQuestionId: new Map(),
    });
    expect(progress.requiredQuestionsComplete).toBe(1);
    expect(isEligibleToComplete(progress)).toBe(true);
  });

  it("requires file review acceptance", () => {
    expect(
      isQuestionAnswered({
        question: { type: "FILE_REQUEST", required: true },
        fileCount: 1,
      }),
    ).toBe(true);
  });
});

describe("access metadata safety", () => {
  it("rejects password field keys", () => {
    expect(() => assertNoSecretFields({ hostingPassword: "secret" })).toThrow(
      /Secret credential fields/,
    );
  });
});
