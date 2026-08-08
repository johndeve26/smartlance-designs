# AI Content Assistants — Phase D Completion Report

**Date:** 2026-08-08  
**Scope:** Guide · Comparison · Checklist · Glossary · Template · Tool Copy  
**Not started:** Homepage AI

---

## GUIDE AI

| Area | Detail |
| --- | --- |
| Actions | FILL_MISSING, IMPROVE_GUIDE, RESEARCH_AND_UPDATE, IMPROVE_SECTION, EXPAND_SECTION, GENERATE_OUTLINE, GENERATE_FAQS, GENERATE_SEO, SUGGEST_INTERNAL_LINKS, CHECK_FRESHNESS, REVIEW_GUIDE |
| Fields | title/description/deck/intro/faqs/sections/SEO/relations (allowlisted) |
| Research | optional / required on research-update; recommended on freshness |
| Prompts | `guide-writer:v1` + ops |
| Claims | freshness/review findings; section ID preserved on merge |
| UI | Guide AI on `/admin/resources/guides/[id]` |

---

## COMPARISON AI

| Area | Detail |
| --- | --- |
| Actions | FILL_MISSING, RESEARCH_OPTIONS, IMPROVE_*, GENERATE_FAQS/DECISION_QUESTIONS/SEO, CHECK_FRESHNESS, REVIEW_COMPARISON |
| Source balance | Research query includes both options; review warns if asymmetric |
| Criteria/matrix | ID-preserving text merges; no /10 ratings |
| Neutrality | Winner-language scrub + blockers |
| UI | Comparison AI panel |

---

## CHECKLIST AI

| Area | Detail |
| --- | --- |
| Actions | FILL_MISSING, IMPROVE_*, SUGGEST_MISSING_ITEMS, SUGGEST_REORDER, GENERATE_SEO, REVIEW_CHECKLIST |
| Stable IDs | Protected; apply rejects lost IDs |
| New items | Server `newStableId`; AI-supplied ids ignored |
| Persistence | Seed checklist unique IDs tested |
| UI | Checklist AI panel |

---

## GLOSSARY AI

| Area | Detail |
| --- | --- |
| Actions | DEFINE_TERM, IMPROVE_*, ADD_EXAMPLE, SUGGEST_ALIASES/RELATED, GENERATE_SEO, CHECK_FRESHNESS, REVIEW_TERM |
| Definitions | Plain-English shortDefinition + fullExplanation |
| Aliases | Slug conflict check on apply |
| Related terms | Existing published glossary slugs only |
| UI | Glossary AI panel |

---

## TEMPLATE ASSISTANT

| Area | Detail |
| --- | --- |
| Actions | IMPROVE_TEMPLATE_COPY / SECTION / FIELD_LABEL / HELP / PLACEHOLDERS, REVIEW_TEMPLATE |
| Protected | field IDs, option values, showWhenAny |
| Allowed | labels, help, placeholders, section titles |
| Persistence | 73 field IDs stable (seed test) |
| UI | Template Assistant panel |

---

## TOOL COPY ASSISTANT

| Area | Detail |
| --- | --- |
| Actions | IMPROVE_TOOL_COPY / QUESTION / HELP / OPTIONS / RESULT_COPY, GENERATE_SEO, REVIEW_TOOL_COPY |
| Scoring isolation | No import of `platform-selector` engine; apply rejects scoreWeight/signals |
| Deterministic | All Platform Selector scenarios still pass |
| CMS only | ToolContent intro/subtitle/SEO |
| UI | Tool Copy Assistant panel |

---

## SHARED

- Registry += GUIDE, COMPARISON, CHECKLIST, GLOSSARY, TEMPLATE, TOOL
- Proposal stack reused; subtype verify on load/apply
- Stale protection / RBAC / CmsResource revision+audit

---

## TOPIC INTELLIGENCE

| Item | Status |
| --- | --- |
| EXPAND_EXISTING_RESOURCE → resource assistant | Implemented when existing CmsResource resolves |
| TEMPLATE/TOOL routine TI | Deferred unless existing hit |
| Insight avoidance | Force checkbox for expand/commercial |
| UPDATE_WORK_PAGE | Still deferred |

---

## SECURITY

- Enquiry exclusion in resource shared context
- Provider secrets unchanged
- Prompt injection: research untrusted; cannot change scoring via payload smuggling
- Structured allowlists + apply validation

---

## QA

| Check | Result |
| --- | --- |
| Tests | `tests/ai/content-assistants-phase-d.test.ts` |
| Total Vitest | **203** passing |
| Lint | pass (1 pre-existing warning) |
| TypeScript | pass |
| Build | pass |
| Platform Selector scenarios | pass via Phase D test |
| Checklist/Template ID contracts | pass |

---

## EXIT CRITERIA

Guide structure preserved · Comparison neutral · Checklist IDs safe · Glossary accurate guards · Template/Tool technical contracts intact · proposal → human review → CMS draft → manual publish.

**Homepage AI not started.**
