/**
 * Route editorial CMS actions through deterministic heuristics first.
 * LLM paths often return sparse/empty JSON for improve runs, which breaks the admin UI.
 */

import type { ContentAssistantEntityType } from "@/lib/ai/content-assistants/types";

const EDITORIAL_HEURISTIC_ACTIONS: Partial<
  Record<ContentAssistantEntityType, ReadonlySet<string>>
> = {
  INDUSTRY: new Set([
    "IMPROVE_INDUSTRY",
    "IMPROVE_SPECIFICITY",
    "FILL_MISSING",
    "GENERATE_SEO",
    "RESEARCH_INDUSTRY_NEEDS",
  ]),
  SERVICE: new Set([
    "IMPROVE_SERVICE",
    "FILL_MISSING",
    "GENERATE_SEO",
    "IMPROVE_PROCESS",
    "GENERATE_FAQS",
    "REWRITE_POSITIONING",
  ]),
  SOLUTION: new Set([
    "IMPROVE_SOLUTION",
    "FILL_MISSING",
    "GENERATE_SEO",
    "CLARIFY_PROBLEM",
    "IMPROVE_DIAGNOSTIC_FLOW",
    "IMPROVE_APPROACH",
    "GENERATE_FAQS",
  ]),
  PLATFORM: new Set([
    "IMPROVE_PLATFORM",
    "IMPROVE_FIT",
    "IMPROVE_TRADEOFFS",
    "FILL_MISSING",
    "GENERATE_SEO",
  ]),
  WORK: new Set([
    "FILL_MISSING",
    "BUILD_FROM_PROJECT_FACTS",
    "IMPROVE_CASE_STUDY",
    "IMPROVE_CHALLENGE",
    "IMPROVE_SOLUTION",
    "IMPROVE_RESULTS",
    "GENERATE_SEO",
  ]),
  HOMEPAGE: new Set([
    "IMPROVE_HOMEPAGE",
    "IMPROVE_HERO",
    "IMPROVE_SECTION",
    "IMPROVE_CTA",
    "IMPROVE_SERVICES",
    "IMPROVE_PROOF",
    "GENERATE_SEO",
    "FILL_MISSING",
  ]),
  GUIDE: new Set(["IMPROVE_GUIDE", "FILL_MISSING", "GENERATE_SEO", "EXPAND_GUIDE", "IMPROVE_SECTION"]),
  COMPARISON: new Set([
    "IMPROVE_COMPARISON",
    "FILL_MISSING",
    "GENERATE_SEO",
    "RESEARCH_COMPARISON",
    "IMPROVE_CRITERIA",
    "IMPROVE_DECISION_MATRIX",
    "IMPROVE_TRADEOFFS",
  ]),
  CHECKLIST: new Set([
    "IMPROVE_CHECKLIST",
    "FILL_MISSING",
    "GENERATE_SEO",
    "IMPROVE_SECTION",
    "IMPROVE_ITEM",
  ]),
  GLOSSARY: new Set([
    "IMPROVE_DEFINITION",
    "IMPROVE_TECHNICAL_EXPLANATION",
    "FILL_MISSING",
    "GENERATE_SEO",
  ]),
  TEMPLATE: new Set([
    "IMPROVE_TEMPLATE_COPY",
    "IMPROVE_SECTION",
    "IMPROVE_FIELD_LABEL",
    "IMPROVE_HELP_TEXT",
    "IMPROVE_PLACEHOLDERS",
    "FILL_MISSING",
  ]),
  TOOL: new Set([
    "IMPROVE_TOOL_COPY",
    "IMPROVE_QUESTION",
    "IMPROVE_HELP_TEXT",
    "IMPROVE_OPTION_LABELS",
    "IMPROVE_RESULT_COPY",
    "FILL_MISSING",
    "GENERATE_SEO",
  ]),
};

export function shouldUseHeuristicFirst(
  entityType: ContentAssistantEntityType,
  action: string,
): boolean {
  if (action.startsWith("IMPROVE_FIELD:")) return true;
  if (action.startsWith("SUGGEST_")) return true;
  if (action.startsWith("REVIEW_")) return true;
  return EDITORIAL_HEURISTIC_ACTIONS[entityType]?.has(action) ?? false;
}
