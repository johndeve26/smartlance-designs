import type { AgencyOnboardingQuestion, AgencyOnboardingQuestionType } from "@prisma/client";
import { z } from "zod";

export type QuestionOption = {
  key: string;
  label: string;
  position: number;
  active?: boolean;
};

export function parseQuestionOptions(optionsJson: unknown): QuestionOption[] {
  if (!Array.isArray(optionsJson)) return [];
  const parsed: QuestionOption[] = [];
  optionsJson.forEach((raw, index) => {
    if (!raw || typeof raw !== "object") return;
    const o = raw as Record<string, unknown>;
    const key = typeof o.key === "string" ? o.key.trim() : "";
    const label = typeof o.label === "string" ? o.label.trim() : "";
    if (!key || !label) return;
    parsed.push({
      key,
      label,
      position: typeof o.position === "number" ? o.position : index,
      active: o.active !== false,
    });
  });
  return parsed.sort((a, b) => a.position - b.position);
}

function activeOptionKeys(options: QuestionOption[]) {
  return new Set(options.filter((o) => o.active !== false).map((o) => o.key));
}

const emailSchema = z.string().email().max(320);
const urlSchema = z
  .string()
  .url()
  .max(2048)
  .refine((v) => /^https?:\/\//i.test(v), "URL must use http or https.");

export function validateResponseValue(input: {
  question: Pick<
    AgencyOnboardingQuestion,
    "type" | "required" | "optionsJson" | "validationJson"
  >;
  valueText?: string | null;
  valueJson?: unknown;
}): { valueText: string | null; valueJson: unknown | null } {
  const { question } = input;
  const trimmedText = input.valueText?.trim() ?? "";

  if (!trimmedText && input.valueJson == null) {
    if (question.required) {
      throw new Error("This field is required.");
    }
    return { valueText: null, valueJson: null };
  }

  switch (question.type as AgencyOnboardingQuestionType) {
    case "SHORT_TEXT":
    case "LONG_TEXT":
      if (!trimmedText) throw new Error("This field is required.");
      if (trimmedText.length > 20_000) throw new Error("Response is too long.");
      return { valueText: trimmedText, valueJson: null };

    case "EMAIL": {
      if (!trimmedText) throw new Error("This field is required.");
      const email = emailSchema.parse(trimmedText.toLowerCase());
      return { valueText: email, valueJson: null };
    }

    case "PHONE":
      if (!trimmedText) throw new Error("This field is required.");
      if (trimmedText.length > 40) throw new Error("Phone number is too long.");
      return { valueText: trimmedText, valueJson: null };

    case "URL": {
      if (!trimmedText) throw new Error("This field is required.");
      const url = urlSchema.parse(trimmedText);
      return { valueText: url, valueJson: null };
    }

    case "NUMBER": {
      if (!trimmedText) throw new Error("This field is required.");
      const num = Number(trimmedText);
      if (!Number.isFinite(num)) throw new Error("Enter a valid number.");
      const validation =
        question.validationJson && typeof question.validationJson === "object"
          ? (question.validationJson as Record<string, unknown>)
          : {};
      if (typeof validation.min === "number" && num < validation.min) {
        throw new Error(`Minimum value is ${validation.min}.`);
      }
      if (typeof validation.max === "number" && num > validation.max) {
        throw new Error(`Maximum value is ${validation.max}.`);
      }
      return { valueText: String(num), valueJson: null };
    }

    case "DATE": {
      if (!trimmedText) throw new Error("This field is required.");
      const parsed = Date.parse(trimmedText);
      if (Number.isNaN(parsed)) throw new Error("Enter a valid date.");
      return { valueText: new Date(parsed).toISOString().slice(0, 10), valueJson: null };
    }

    case "BOOLEAN": {
      const bool =
        trimmedText === "true" ||
        trimmedText === "1" ||
        trimmedText.toLowerCase() === "yes";
      const falseVal =
        trimmedText === "false" ||
        trimmedText === "0" ||
        trimmedText.toLowerCase() === "no";
      if (!bool && !falseVal && question.required) {
        throw new Error("Select yes or no.");
      }
      if (!bool && !falseVal) return { valueText: null, valueJson: null };
      return { valueText: bool ? "true" : "false", valueJson: null };
    }

    case "SINGLE_SELECT": {
      if (!trimmedText) throw new Error("This field is required.");
      const options = parseQuestionOptions(question.optionsJson);
      const keys = activeOptionKeys(options);
      if (!keys.has(trimmedText)) throw new Error("Invalid selection.");
      return { valueText: trimmedText, valueJson: null };
    }

    case "MULTI_SELECT": {
      const raw = Array.isArray(input.valueJson)
        ? input.valueJson
        : trimmedText
          ? trimmedText.split(",").map((s) => s.trim())
          : [];
      if (!raw.length && question.required) throw new Error("Select at least one option.");
      const options = parseQuestionOptions(question.optionsJson);
      const keys = activeOptionKeys(options);
      const selected = raw.filter((k): k is string => typeof k === "string" && keys.has(k));
      if (question.required && !selected.length) throw new Error("Select at least one option.");
      if (selected.length !== raw.length) throw new Error("Invalid selection.");
      return { valueText: null, valueJson: selected };
    }

    case "FILE_REQUEST":
      // File answers are tracked via AgencyOnboardingFileSubmission, not text value.
      return { valueText: null, valueJson: null };

    default:
      throw new Error("Unsupported question type.");
  }
}

export function isQuestionAnswered(input: {
  question: Pick<AgencyOnboardingQuestion, "type" | "required">;
  valueText?: string | null;
  valueJson?: unknown;
  fileCount?: number;
}): boolean {
  if (input.question.type === "FILE_REQUEST") {
    return (input.fileCount ?? 0) > 0;
  }
  if (input.valueJson != null) {
    if (Array.isArray(input.valueJson)) return input.valueJson.length > 0;
    return true;
  }
  return Boolean(input.valueText?.trim());
}

export function isResponseCompleteForProgress(input: {
  question: Pick<AgencyOnboardingQuestion, "type" | "required">;
  valueText?: string | null;
  valueJson?: unknown;
  fileCount?: number;
  reviewStatus?: string;
}): boolean {
  if (!input.question.required) return true;
  if (!isQuestionAnswered(input)) return false;
  if (input.question.type === "FILE_REQUEST") {
    return input.reviewStatus === "ACCEPTED";
  }
  return input.reviewStatus === "ACCEPTED";
}
