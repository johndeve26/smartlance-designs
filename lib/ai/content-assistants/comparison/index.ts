/**
 * Comparison AI — neutral decision-support assistant.
 */

import {
  COMPARISON_FIELD_ALLOWLIST,
  COMPARISON_FIELD_LABELS,
  COMPARISON_PROTECTED_FIELDS,
} from "@/lib/ai/content-assistants/allowlists";
import {
  buildResourceFieldChanges,
  createResourceAssistant,
  resourceSeoFields,
} from "@/lib/ai/content-assistants/resource-factory";
import {
  containsFabricatedWinnerClaim,
  containsFakeRating,
  mergeComparisonRowsById,
  mergeSectionsById,
} from "@/lib/ai/content-assistants/resource-id-safety";
import { copyStringFields } from "@/lib/ai/content-assistants/resource-shared";
import type { ProposalPayload } from "@/lib/ai/content-assistants/types";
import { PROMPT_VERSIONS } from "@/lib/ai/prompts";
import { isEmptyValue } from "@/lib/ai/content-assistants/helpers";

export const COMPARISON_ACTIONS = [
  { id: "FILL_MISSING", label: "Fill missing fields", promptVersion: PROMPT_VERSIONS.comparisonFillMissing, loadingLabel: "Filling missing Comparison fields…", researchPolicy: "optional" as const },
  { id: "RESEARCH_OPTIONS", label: "Research options", promptVersion: PROMPT_VERSIONS.comparisonResearch, loadingLabel: "Researching comparison options…", researchPolicy: "required" as const },
  { id: "IMPROVE_COMPARISON", label: "Improve this Comparison", promptVersion: PROMPT_VERSIONS.comparisonImprove, loadingLabel: "Improving Comparison…", researchPolicy: "recommended" as const },
  { id: "IMPROVE_CRITERIA", label: "Improve criteria", promptVersion: PROMPT_VERSIONS.comparisonCriteria, loadingLabel: "Improving comparison criteria…", researchPolicy: "recommended" as const },
  { id: "IMPROVE_DECISION_MATRIX", label: "Improve decision matrix", promptVersion: PROMPT_VERSIONS.comparisonMatrix, loadingLabel: "Improving decision matrix…", researchPolicy: "recommended" as const },
  { id: "IMPROVE_TRADEOFFS", label: "Improve trade-offs", promptVersion: PROMPT_VERSIONS.comparisonTradeoffs, loadingLabel: "Improving trade-offs…", researchPolicy: "recommended" as const },
  { id: "GENERATE_FAQS", label: "Create FAQs", promptVersion: PROMPT_VERSIONS.comparisonFaq, loadingLabel: "Creating Comparison FAQs…", researchPolicy: "optional" as const },
  { id: "GENERATE_DECISION_QUESTIONS", label: "Create decision questions", promptVersion: PROMPT_VERSIONS.comparisonQuestions, loadingLabel: "Creating decision questions…", researchPolicy: "optional" as const },
  { id: "GENERATE_SEO", label: "Generate SEO", promptVersion: PROMPT_VERSIONS.comparisonSeo, loadingLabel: "Generating Comparison SEO…", researchPolicy: "optional" as const },
  { id: "CHECK_FRESHNESS", label: "Check freshness", promptVersion: PROMPT_VERSIONS.comparisonFreshness, loadingLabel: "Checking Comparison freshness…", researchPolicy: "required" as const },
  { id: "REVIEW_COMPARISON", label: "Review Comparison", promptVersion: PROMPT_VERSIONS.comparisonReview, loadingLabel: "Reviewing Comparison…", researchPolicy: "optional" as const },
] as const;

function scrubWinner(text: string): string | null {
  if (containsFabricatedWinnerClaim(text) || containsFakeRating(text)) return null;
  return text;
}

function heuristicComparisonProposal(input: {
  entity: Record<string, unknown>;
  action: string;
  lockedFields: string[];
  researchSources?: unknown[];
}): ProposalPayload {
  const e = input.entity;
  const payload = (e.payload || {}) as Record<string, unknown>;
  const optionA = String(payload.optionA || e.optionA || "Option A");
  const optionB = String(payload.optionB || e.optionB || "Option B");
  const sources = Array.isArray(input.researchSources) ? input.researchSources : [];

  if (input.action === "REVIEW_COMPARISON" || input.action === "CHECK_FRESHNESS") {
    const blob = JSON.stringify(payload);
    return {
      fields: [],
      reviewFindings: [
        { section: "NEUTRALITY", severity: containsFabricatedWinnerClaim(blob) ? "BLOCKER" : "PASS", message: containsFabricatedWinnerClaim(blob) ? "Universal winner language detected." : "No universal winner language found." },
        { section: "DECISION MATRIX", severity: containsFakeRating(blob) ? "BLOCKER" : "PASS", message: containsFakeRating(blob) ? "Numeric /10 ratings are not allowed." : "No fabricated numeric ratings." },
        { section: "SOURCE BALANCE", severity: sources.length >= 2 ? "PASS" : "WARNING", message: sources.length >= 2 ? "Multiple sources present — confirm both options covered." : "Research both options; avoid asymmetric sourcing." },
        { section: "FACTUAL FRESHNESS", severity: "REVIEW", message: "Pricing, plans, and product limits need current official sources." },
        { section: "USE-CASE FIT", severity: "REVIEW", message: "Recommendations must be scoped to who each option fits." },
        { section: "SEO", severity: !e.seoTitle ? "WARNING" : "PASS", message: !e.seoTitle ? "SEO incomplete." : "SEO present." },
      ],
      research: undefined,
    };
  }

  const proposed: Record<string, unknown> = {};

  if (input.action === "GENERATE_SEO" || (input.action === "FILL_MISSING" && isEmptyValue(e.seoTitle))) {
    Object.assign(proposed, resourceSeoFields(e, `${optionA} vs ${optionB}`));
  }

  if (input.action === "FILL_MISSING" || input.action === "IMPROVE_COMPARISON") {
    if (isEmptyValue(payload.summary) && typeof e.description === "string") {
      const s = scrubWinner(e.description);
      if (s) proposed.summary = s;
    }
  }

  if (input.action === "IMPROVE_TRADEOFFS" || input.action === "IMPROVE_COMPARISON") {
    const tradeoffs = Array.isArray(payload.tradeoffs) ? [...(payload.tradeoffs as string[])] : [];
    if (!tradeoffs.length) {
      proposed.tradeoffs = [
        `${optionA} may suit teams that need one set of strengths; ${optionB} may fit a different workflow — choose by constraints, not a universal winner.`,
      ];
    }
  }

  if (input.action === "GENERATE_DECISION_QUESTIONS") {
    if (!Array.isArray(payload.decisionQuestions) || !(payload.decisionQuestions as unknown[]).length) {
      proposed.decisionQuestions = [
        `Who will publish and maintain content day to day?`,
        `How important is design flexibility versus editorial simplicity?`,
        `What integrations and ownership constraints matter most?`,
      ];
    }
  }

  if (input.action === "GENERATE_FAQS") {
    proposed.faqs = [
      {
        question: `Is ${optionA} always better than ${optionB}?`,
        answer: `No. Fit depends on content workflow, design needs, maintenance, and integrations — not a universal winner.`,
      },
    ];
  }

  if (input.action === "IMPROVE_CRITERIA" || input.action === "IMPROVE_DECISION_MATRIX") {
    // No structural regeneration — empty proposal if nothing to safely polish
  }

  // Block any proposed text with winner/ratings
  for (const [k, v] of Object.entries(proposed)) {
    const text = typeof v === "string" ? v : JSON.stringify(v);
    if (containsFabricatedWinnerClaim(text) || containsFakeRating(text)) {
      delete proposed[k];
    }
  }

  const fields = buildResourceFieldChanges({
    entity: {
      ...e,
      summary: payload.summary,
      tradeoffs: payload.tradeoffs,
      decisionQuestions: payload.decisionQuestions,
      faqs: payload.faqs,
    },
    proposed,
    labels: COMPARISON_FIELD_LABELS,
    allowlist: COMPARISON_FIELD_ALLOWLIST,
    protectedFields: COMPARISON_PROTECTED_FIELDS,
    lockedFields: input.lockedFields,
    missingOnly: input.action === "FILL_MISSING",
  });

  return { fields };
}

export const comparisonAssistant = createResourceAssistant({
  entityType: "COMPARISON",
  displayName: "Comparison",
  promptNamespace: PROMPT_VERSIONS.comparisonWriter,
  actions: COMPARISON_ACTIONS,
  fieldAllowlist: COMPARISON_FIELD_ALLOWLIST,
  protectedFields: COMPARISON_PROTECTED_FIELDS,
  fieldLabels: COMPARISON_FIELD_LABELS,
  auditAction: "resource.comparison_ai_draft",
  researchQuery: (e) => {
    const p = (e.payload || {}) as Record<string, unknown>;
    return `${p.optionA} vs ${p.optionB} official documentation features limitations pricing`;
  },
  heuristic: heuristicComparisonProposal,
  mergePayload(current, fields) {
    const next = { ...current };
    copyStringFields(next, fields, [
      "summary",
      "decisionGuidance",
      "title",
      "description",
      "deck",
      "seoTitle",
      "seoDescription",
    ]);
    for (const key of ["quickFitA", "quickFitB", "bestForA", "bestForB", "decisionQuestions", "tradeoffs", "faqs"] as const) {
      if (fields[key] !== undefined) next[key] = fields[key];
    }
    if (fields.comparisonCriteria !== undefined) {
      next.comparisonCriteria = mergeComparisonRowsById(
        current.comparisonCriteria,
        fields.comparisonCriteria,
      );
    }
    if (fields.decisionMatrix !== undefined) {
      next.decisionMatrix = mergeComparisonRowsById(
        current.decisionMatrix,
        fields.decisionMatrix,
      );
    }
    if (fields.sections !== undefined) {
      next.sections = mergeSectionsById(current.sections, fields.sections, {
        allowNew: false,
      });
    }
    return next;
  },
});
