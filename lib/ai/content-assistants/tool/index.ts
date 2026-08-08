/**
 * Tool Copy Assistant — CMS ToolContent copy only.
 * Must NEVER import or write scoring weights / selection engine.
 */

import {
  TOOL_FIELD_ALLOWLIST,
  TOOL_FIELD_LABELS,
  TOOL_PROTECTED_FIELDS,
} from "@/lib/ai/content-assistants/allowlists";
import {
  buildResourceFieldChanges,
  createResourceAssistant,
  resourceSeoFields,
} from "@/lib/ai/content-assistants/resource-factory";
import { copyStringFields } from "@/lib/ai/content-assistants/resource-shared";
import type { ProposalPayload } from "@/lib/ai/content-assistants/types";
import { PROMPT_VERSIONS } from "@/lib/ai/prompts";
import { isEmptyValue } from "@/lib/ai/content-assistants/helpers";

export const TOOL_ACTIONS = [
  { id: "IMPROVE_TOOL_COPY", label: "Improve tool copy", promptVersion: PROMPT_VERSIONS.toolCopy, loadingLabel: "Improving tool copy…" },
  { id: "IMPROVE_QUESTION", label: "Improve question copy", promptVersion: PROMPT_VERSIONS.toolQuestion, loadingLabel: "Improving question copy…" },
  { id: "IMPROVE_HELP_TEXT", label: "Improve help text", promptVersion: PROMPT_VERSIONS.toolHelp, loadingLabel: "Improving tool help text…" },
  { id: "IMPROVE_OPTION_LABELS", label: "Improve option labels", promptVersion: PROMPT_VERSIONS.toolOptions, loadingLabel: "Improving option labels…" },
  { id: "IMPROVE_RESULT_COPY", label: "Improve result copy", promptVersion: PROMPT_VERSIONS.toolResultCopy, loadingLabel: "Reviewing tool result copy…" },
  { id: "GENERATE_SEO", label: "Generate SEO", promptVersion: PROMPT_VERSIONS.toolSeo, loadingLabel: "Generating Tool SEO…" },
  { id: "REVIEW_TOOL_COPY", label: "Review tool copy", promptVersion: PROMPT_VERSIONS.toolReview, loadingLabel: "Reviewing tool copy…" },
] as const;

function heuristicToolProposal(input: {
  entity: Record<string, unknown>;
  action: string;
  lockedFields: string[];
}): ProposalPayload {
  const e = input.entity;
  const payload = (e.payload || {}) as Record<string, unknown>;

  if (input.action === "REVIEW_TOOL_COPY") {
    return {
      fields: [],
      reviewFindings: [
        { section: "SCORING INTEGRITY", severity: "PASS", message: "Scoring/weights live in the Platform Selector engine file — this assistant cannot modify them." },
        { section: "TECHNICAL-ID SAFETY", severity: "PASS", message: "Question IDs and option values are engine-owned." },
        { section: "QUESTION CLARITY", severity: "REVIEW", message: "Question/option copy suggestions are advisory until applied in the engine data file." },
        { section: "RESULT EXPLANATION", severity: "REVIEW", message: "Result wording must remain faithful to deterministic reasons — never change which platform wins." },
        { section: "SEO", severity: !e.seoTitle ? "WARNING" : "PASS", message: !e.seoTitle ? "SEO incomplete." : "SEO present." },
      ],
    };
  }

  const proposed: Record<string, unknown> = {};

  if (
    input.action === "GENERATE_SEO" ||
    (input.action === "IMPROVE_TOOL_COPY" && isEmptyValue(e.seoTitle))
  ) {
    Object.assign(proposed, resourceSeoFields(e, "Tool"));
  }

  if (input.action === "IMPROVE_TOOL_COPY") {
    if (isEmptyValue(payload.intro) && typeof e.description === "string") {
      proposed.intro = e.description;
    }
    if (isEmptyValue(payload.subtitle) && typeof e.deck === "string") {
      proposed.subtitle = e.deck;
    }
  }

  if (
    input.action === "IMPROVE_QUESTION" ||
    input.action === "IMPROVE_HELP_TEXT" ||
    input.action === "IMPROVE_OPTION_LABELS" ||
    input.action === "IMPROVE_RESULT_COPY"
  ) {
    // Advisory only — engine questions are not CMS payload
    proposed.questionCopySuggestions = [
      {
        note: "Engine-owned questions/options/scoring are not modified by Tool Copy Assistant. Review wording in data/tools/website-platform-selector.ts manually if needed.",
        action: input.action,
      },
    ];
    return {
      fields: buildResourceFieldChanges({
        entity: { ...e, questionCopySuggestions: null },
        proposed,
        labels: TOOL_FIELD_LABELS,
        allowlist: TOOL_FIELD_ALLOWLIST,
        protectedFields: TOOL_PROTECTED_FIELDS,
        lockedFields: input.lockedFields,
      }),
      reviewFindings: [
        {
          section: "SCORING INTEGRITY",
          severity: "PASS",
          message:
            "Question/option/result engine copy is advisory here. CMS apply only updates ToolContent intro/SEO — never scoring.",
        },
      ],
    };
  }

  const fields = buildResourceFieldChanges({
    entity: { ...e, intro: payload.intro, subtitle: payload.subtitle },
    proposed,
    labels: TOOL_FIELD_LABELS,
    allowlist: TOOL_FIELD_ALLOWLIST,
    protectedFields: TOOL_PROTECTED_FIELDS,
    lockedFields: input.lockedFields,
  });

  return { fields };
}

export const toolAssistant = createResourceAssistant({
  entityType: "TOOL",
  displayName: "Tool",
  promptNamespace: PROMPT_VERSIONS.toolCopyAssistant,
  actions: TOOL_ACTIONS,
  fieldAllowlist: TOOL_FIELD_ALLOWLIST,
  protectedFields: TOOL_PROTECTED_FIELDS,
  fieldLabels: TOOL_FIELD_LABELS,
  auditAction: "resource.tool_copy_ai_draft",
  heuristic: heuristicToolProposal,
  mergePayload(current, fields) {
    // Explicitly drop any smuggled scoring keys
    for (const banned of [
      "scoreWeight",
      "weights",
      "signals",
      "questions",
      "candidates",
      "showWhen",
    ]) {
      if (banned in fields) {
        throw new Error(
          "This tool proposal attempted to modify scoring behavior and was rejected.",
        );
      }
    }
    const next = { ...current };
    copyStringFields(next, fields, [
      "intro",
      "subtitle",
      "title",
      "description",
      "seoTitle",
      "seoDescription",
    ]);
    // questionCopySuggestions are advisory — never written into payload engine
    return next;
  },
});
