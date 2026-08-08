# AI Content Assistants — Operations (Phases A–E)

Sitewide editor guide: `docs/AI_CONTENT_ASSISTANTS_SITEWIDE_OPERATIONS.md`  
Coverage matrix: `docs/AI_CONTENT_ASSISTANTS_COVERAGE_MATRIX.md`

## Prerequisites

1. `use_ai_writer` **and** `edit_draft`
2. **Writing provider** — configure in Admin AI Writer settings / env (`WRITING_MODEL` routing). Without it, assistants use preservation-first heuristics (no aggressive rewrite of strong copy).
3. **Research provider (Tavily)** — set `TAVILY_API_KEY` or `AI_RESEARCH_API_KEY`. Recommended for Platform / Comparison / Glossary freshness ops. Without it, research-required actions should attach official/manual sources or fail closed — they must **not** invent broad rewrites.

Do not store API keys in source code.

---

## Service / Solution AI

Generate → CURRENT/PROPOSED → accept selected → apply draft → preview → publish.

---

## Platform AI

1. Open **Admin → Platforms →** existing Platform  
2. Prefer **Research & improve** / **Check freshness** for volatile facts  
3. Review Research used / claim blockers  
4. Apply → draft → preview → publish  

Required research ops fail closed when research unavailable.

---

## Industry AI

Respect proven vs supported experience boundaries. Apply → draft → preview → publish.

---

## Case Study / Testimonial

- **Work:** presentation from verified project facts; news is not proof  
- **Testimonial:** format/excerpt only — never invent quotes  

---

## Resource assistants (Guide → Tool)

Open `/admin/resources/...`. Subtype panel selects actions. Checklist/Template IDs and Tool scoring are protected.

---

## Homepage Copy Assistant

1. Open `/admin/homepage`  
2. Status shows draft vs published  
3. Propose → apply to **draft**  
4. Preview → **Publish** manually  

Public site unchanged until Publish. See `docs/HOMEPAGE_DRAFT_AND_AI.md`.

---

## Topic Intelligence handoffs

| Recommendation | Action |
| --- | --- |
| UPDATE_SERVICE/SOLUTION/PLATFORM/INDUSTRY_PAGE | Update matching page |
| UPDATE_WORK_PAGE | Update Case Study (existing only) |
| UPDATE_HOMEPAGE | Update Homepage |
| EXPAND_EXISTING_RESOURCE | Update resource subtype |
| WRITE_NEW | Create Insight Project |

Handoffs open the editor with context — they do **not** auto-generate. Never “Generate a testimonial.” Never Tool scoring changes.

Force override required to create an Insight project from MONITOR / IGNORE / commercial / expand / Work / Homepage recommendations.

---

## Stale proposals

If content (Homepage: `draftUpdatedAt`) changes after proposal creation → STALE — regenerate before apply.
