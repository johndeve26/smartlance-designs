/**
 * Shared improvement outcome modes for content assistants.
 * Sparse / no-change results are first-class — not errors.
 */

export type ImprovementResultMode =
  | "CHANGE_RECOMMENDED"
  | "NO_CHANGE_RECOMMENDED"
  | "RESEARCH_NEEDED"
  | "WRITING_PROVIDER_REQUIRED"
  | "PARTIAL_CHANGE_RECOMMENDED";

export function resolveImprovementResultMode(input: {
  fieldCount: number;
  writingProviderRequired?: boolean;
  researchNeeded?: boolean;
}): ImprovementResultMode {
  if (input.writingProviderRequired) return "WRITING_PROVIDER_REQUIRED";
  if (input.researchNeeded) return "RESEARCH_NEEDED";
  if (input.fieldCount === 0) return "NO_CHANGE_RECOMMENDED";
  if (input.fieldCount <= 3) return "PARTIAL_CHANGE_RECOMMENDED";
  return "CHANGE_RECOMMENDED";
}

/** Prose is "strong enough" that heuristic rewrite should not replace it. */
export function isStrongProseField(value: unknown, minChars = 80): boolean {
  if (typeof value !== "string") return false;
  const t = value.trim();
  if (t.length < minChars) return false;
  // Avoid treating placeholder stubs as strong
  if (/^TODO\b/i.test(t)) return false;
  return true;
}

export function isThinProseField(value: unknown, minChars = 80): boolean {
  if (value == null) return true;
  if (typeof value !== "string") return false;
  return value.trim().length > 0 && value.trim().length < minChars;
}
