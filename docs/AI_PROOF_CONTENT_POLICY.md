# AI Proof Content Policy

**Scope:** Case Study AI (Work) + Testimonial Assistant  
**Principle:** Truth and provenance outrank stronger marketing copy.

---

## What AI may do

### Case Study AI

- Improve presentation of **verified** project facts into Case Study structure (summary, challenge, solution, SEO)
- Format **existing** verified metrics/outcome wording faithfully
- Suggest relations only when project facts / existing labels support them
- Review proof and Case Study sections (advisory findings — no vanity score)

### Testimonial Assistant

- Light punctuation / whitespace normalization of an existing quote
- Extract a shorter **display excerpt** using only words from the original
- Classify editorial themes from quote wording
- Suggest related Work when clientName matching supports it
- Review quote integrity / verification / publication readiness

---

## What counts as a verified project fact

- Structured `approvedProjectFacts` when `approvedForAI` is true
- Existing Work public fields that already encode known project copy (challenge, solution, resultSummary, measurableResults, platformLabel, servicesLabels, technologies)
- Verified published testimonials linked to the project

Does **not** count:

- Related Service catalogue pages alone
- Related Industry/Platform terminology alone
- Client website crawl inference
- Private unapproved Admin notes (`designNotes`, etc.)
- Enquiries / billing / contracts

---

## What AI must never invent

Client names, scope, technology, challenges, deliverables, results, traffic/conversion/ranking/revenue/ROI/time-savings, quotes, dates, industries, platforms, services delivered, awards, certifications, outcomes — unless present in verified source data.

---

## Metric handling

- Numerical performance claims require explicit verified metrics/outcome text
- Preserve numbers faithfully — no “increased by 50%” unless that derivation is validated in code (not casually by the LLM)
- No embellishment (“explosive growth”, “game-changing”)
- Qualitative results allowed only when evidenced (“mobile navigation was simplified”)
- Unsupported result fields are **blocked** from accept; other fields may still apply

---

## Platform / Service / Industry proof

- Platform: only when verified facts or authoritative existing Work relation supports it — not from screenshots/style/domain
- Services: only when project facts indicate those capabilities were delivered — SEO opportunity does not outrank proof
- Industry: suggest only from existing Industry records; human accepts

---

## Testimonial quote integrity

- Never generate or creatively rewrite client quotes
- `originalQuote` is the immutable source (seeded from existing `quote` on migration)
- `displayExcerpt` = extraction only (subsequence validation)
- Attribution (`name` / `role` / `company`) and `verified` / status are human-controlled

---

## Private project data

Default excluded from providers. Opt-in via **Approved for AI use** + structured approved facts. Never send credentials, private URLs, contacts, contracts, billing, or dispute notes.

---

## AI provider boundary

Send only when an authorized editor explicitly invokes an action. Opening the editor is not enough.

---

## Human review

All proposals require CURRENT vs PROPOSED review. Partial accept is allowed. CMS draft/publish remains authoritative. No auto-publish.
