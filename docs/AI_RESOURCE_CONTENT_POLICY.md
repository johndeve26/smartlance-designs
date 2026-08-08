# AI Resource Content Policy

**Scope:** Guide · Comparison · Checklist · Glossary · Template · Tool Copy assistants  
**Principle:** Shared infrastructure; separate editorial intelligence per resource job.

---

## GUIDE

| | |
| --- | --- |
| **Purpose** | Deep evergreen education / structured reference |
| **Allowed** | Fill missing, improve/expand sections, outline, FAQs, SEO, links, research update, freshness, review |
| **Forbidden** | Random section ID regeneration; Insight-length shallow rewrite as only output |
| **Research** | Required/recommended for volatile technical facts; optional for conceptual wording |
| **Claims** | Technical/stats/platform/search/legal claims via Claim Ledger patterns; not every sentence |
| **Protected** | status, slug/href, featured flags, wholesale payload dump, section technical IDs |
| **Persistence** | Section IDs / TOC anchors preserved on merge |
| **Human review** | Proposal → partial accept → CmsResource draft → preview → publish |

---

## COMPARISON

| | |
| --- | --- |
| **Purpose** | Neutral decision support between options |
| **Allowed** | Research options, improve criteria/matrix/trade-offs, FAQs, decision questions, SEO, freshness, review |
| **Forbidden** | Universal winner claims; fabricated /10 ratings; asymmetric one-sided “research” as sole evidence |
| **Research** | Strongly recommended/required for product facts; prefer official sources for **both** options |
| **Claims** | Current-product policy; unsupported winner blocked |
| **Protected** | Criterion/matrix IDs; status/slug; no winner field |
| **Human review** | Same proposal flow; neutrality findings visible |

---

## CHECKLIST

| | |
| --- | --- |
| **Purpose** | Execution / verification aid — not an essay |
| **Allowed** | Improve section/item wording; suggest missing items; SEO; review |
| **Forbidden** | Rewrite checklist with new IDs; silent item removal; AI-chosen persistence IDs |
| **Research** | Topic-dependent |
| **Protected** | item/section/subgroup IDs |
| **Persistence** | `smartlance.checklist.${slug}` keyed by item ID — wording changes must not reset progress |
| **New items** | Content + placement only; **server generates ID** on accept |
| **Human review** | Removal/reorder are suggestions with warnings |

---

## GLOSSARY

| | |
| --- | --- |
| **Purpose** | Plain-English precise definitions |
| **Allowed** | Define/improve definition, example, technical explanation, aliases, related terms, SEO, freshness, review |
| **Forbidden** | Obsolete metrics as current (e.g. FID as CWV); invented ranking rules; broken related terms |
| **Research** | Recommended/required for technical/standards terms; official sources preferred |
| **Protected** | glossaryTopicGroup; status/slug |
| **Aliases** | Server validates no conflicting glossary slug |
| **Human review** | Same proposal flow |

---

## TEMPLATE

| | |
| --- | --- |
| **Purpose** | Structured user input — copy assistant only |
| **Allowed** | Section title/description; field label/help/placeholder; option **labels** |
| **Forbidden** | Field IDs; option **values**; showWhenAny; storage key/version; regenerate template |
| **Research** | Generally not needed |
| **Persistence** | `smartlance.template.${slug}` map by field ID |
| **Human review** | Same proposal flow |

---

## TOOL (Copy Assistant)

| | |
| --- | --- |
| **Purpose** | Public ToolContent / SEO clarity — **not** the decision engine |
| **Allowed** | intro/subtitle/description/SEO; advisory question-copy suggestions |
| **Forbidden** | Scoring weights, eligibility, filters, question IDs, option values, storage, “optimize scoring” |
| **Research** | Not for normal copy |
| **Isolation** | Module must not import `lib/platform-selector` or mutate engine files |
| **Persistence** | Engine localStorage unchanged by CMS copy applies |
| **Human review** | Deterministic scenarios must remain identical after copy applies |

---

## Shared

- No auto-publish · stale proposals blocked · RBAC `use_ai_writer` + `edit_draft`
- Wrong subtype apply blocked (e.g. Tool proposal → Checklist)
- Enquiry/PII never in context
- Homepage AI is **out of scope** for this policy phase
