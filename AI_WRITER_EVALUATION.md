# AI Writer Evaluation

## Purpose

Validate that AI Editorial Studio produces a **strong editorial starting point** with predictable quality and safe failure — not merely that “generation works.”

## Dimensions (no master score)

FACTUAL_SUPPORT · SOURCE_QUALITY · SOURCE_ACCURACY · ORIGINAL_VALUE · SEARCH_INTENT · TOPIC_COVERAGE · BRAND_VOICE · CLARITY · STRUCTURE · INTERNAL_LINK_QUALITY · COMMERCIAL_RESTRAINT · CANNIBALIZATION_HANDLING · AI_SEARCH_READABILITY · SEO_FUNDAMENTALS · HALLUCINATION_RISK · EDITORIAL_EFFICIENCY

Verdicts: **PASS · WARNING · FAIL** (never a single 0–100 SEO score).

## Golden fixtures

Defined in `lib/ai/evaluation/fixtures.ts` (traffic/enquiries, migration SEO, CWV, WP vs Webflow, redesign, local, ecommerce, hospitality, cannibalization, duplicate, distinct angle, commodity listicle, Google claim invention, unsupported stat, fake Smartlance result, prompt injection, mixed source quality).

## How to run

| Mode | Where | Cost |
| --- | --- | --- |
| Mock (CI) | `npm test` → `tests/ai/hardening.test.ts` | None |
| Mock (Admin) | `/admin/ai-writer/evaluations` → Run mock golden suite | None |
| Live | Manual only — never on every deploy | Warns estimated generations |

Snapshots stored in `AIEvaluationSnapshot`.

## Regression gate

Before changing default prompts/models, mock suite must not regress on: hallucinated sources, unsupported stats, fake Smartlance claims, cannibalization, unsafe URLs.
