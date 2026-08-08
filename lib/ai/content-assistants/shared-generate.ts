/**
 * Shared proposal field helpers + structured-output runner for content assistants.
 */

import { z } from "zod";
import { createAIProviderOrTestOverride } from "@/lib/ai/providers";
import type { AIRoleModel } from "@/lib/ai/types";
import {
  isEmptyValue,
} from "@/lib/ai/content-assistants/helpers";
import type { ProposedFieldChange } from "@/lib/ai/content-assistants/types";

export function buildFieldChanges(input: {
  entity: Record<string, unknown>;
  proposed: Record<string, unknown>;
  labels: Record<string, string>;
  allowlist: ReadonlySet<string>;
  protectedFields: ReadonlySet<string>;
  lockedFields: string[];
  /** When true, only include fields that are currently empty */
  missingOnly?: boolean;
  reasons?: Record<string, string>;
}): ProposedFieldChange[] {
  const out: ProposedFieldChange[] = [];
  for (const [field, proposed] of Object.entries(input.proposed)) {
    if (!input.allowlist.has(field)) continue;
    if (input.protectedFields.has(field)) continue;
    if (input.lockedFields.includes(field)) continue;
    if (proposed === undefined) continue;
    const current = input.entity[field];
    if (input.missingOnly && !isEmptyValue(current)) continue;
    if (!input.missingOnly && JSON.stringify(current) === JSON.stringify(proposed)) {
      continue;
    }
    out.push({
      field,
      label: input.labels[field] || field,
      current: current ?? null,
      proposed,
      reason: input.reasons?.[field],
    });
  }
  return out;
}

export async function runStructuredOrHeuristic<T>(input: {
  schema: z.ZodType<T>;
  schemaName: string;
  system: string;
  user: string;
  role?: AIRoleModel;
  forceHeuristic?: boolean;
  heuristic: () => T;
}): Promise<{
  data: T;
  provider: string;
  model?: string;
  tokenUsageInput?: number;
  tokenUsageOutput?: number;
}> {
  if (input.forceHeuristic) {
    return { data: input.heuristic(), provider: "heuristic" };
  }

  try {
    const provider = await createAIProviderOrTestOverride(
      input.role || "WRITING_MODEL",
    );
    if (!provider.isConfigured()) {
      return { data: input.heuristic(), provider: "heuristic" };
    }
    const result = await provider.generateStructured({
      modelRole: input.role || "WRITING_MODEL",
      schema: input.schema,
      schemaName: input.schemaName,
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.user },
      ],
    });
    return {
      data: result.data,
      provider: result.provider,
      model: result.model,
      tokenUsageInput: result.usage?.input,
      tokenUsageOutput: result.usage?.output,
    };
  } catch {
    return { data: input.heuristic(), provider: "heuristic-fallback" };
  }
}

export const faqItemSchema = z.object({
  question: z.string().min(1).max(400),
  answer: z.string().min(1).max(2000),
});

export const processStepSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
});

export const stringListSchema = z.array(z.string().min(1).max(500)).max(20);

export const reviewFindingSchema = z.object({
  section: z.string(),
  severity: z.enum(["PASS", "WARNING", "REVIEW", "BLOCKER"]),
  message: z.string().min(1).max(1000),
});

export const relationSuggestionSchema = z.object({
  kind: z.enum(["service", "solution", "platform", "work", "resource", "industry"]),
  id: z.string().optional(),
  href: z.string().optional(),
  slug: z.string().optional(),
  title: z.string(),
  reason: z.string().optional(),
});
