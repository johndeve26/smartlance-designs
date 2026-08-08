# AI Content Assistants — Phase E Completion Report

**Date:** 2026-08-08  
**Scope:** Homepage draft safety · Homepage Copy Assistant · Topic Intelligence content-type routing · sitewide coverage docs  
**Not started:** Further major AI features (Phase E is the final content-assistant phase)

---

## HOMEPAGE DRAFT SYSTEM

| Area | Detail |
| --- | --- |
| Previous | Live save via `saveHomepage` → revalidated public Homepage on every admin save |
| New | `draftJson` / `draftUpdatedAt` / `draftUpdatedById` on `HomepageContent`; published columns remain live |
| Migration | Additive (`20260808220000_ai_content_assistants_phase_e`); existing live columns unchanged |
| Editor | Save draft · Preview · Publish · Discard draft |
| Preview | `/admin/preview/homepage/home` via `getHomepageForPreview` |
| Publish | Human-only `publishHomepage` (`publish` RBAC); copies draft → live columns; clears draft; revalidates |
| Revisions | Draft saves create `ContentRevision` with `kind: "draft"`; publish creates full snapshot |
| Rollback | Same ContentRevision restore path as other CMS entities where supported |
| Revalidation | Draft save does **not** call `revalidateHomepage`; publish does |

Public `getHomepageContent()` never reads `draftJson`.

---

## HOMEPAGE COPY ASSISTANT

| Area | Detail |
| --- | --- |
| Registry | `HOMEPAGE` → `lib/ai/content-assistants/homepage/` |
| Actions | FILL_MISSING, IMPROVE_HOMEPAGE, IMPROVE_HERO, IMPROVE_SECTION, IMPROVE_CTA, GENERATE_SEO, SUGGEST_SERVICE/WORK/TESTIMONIAL_CURATION, REVIEW_HOMEPAGE |
| Eligible | Hero/CTA/SEO/sections/curated IDs (allowlisted) |
| Protected | `sectionVisibility`, `noIndex`, `canonicalOverride`, draft system fields, IDs, timestamps |
| Context | Draft/live homepage, published Services/Work, verified Testimonials, Brand Voice, site config — no Enquiry/PII |
| Prompts | `homepage-copy-assistant:v1` + action versions |
| Schemas | `HomepageHeroOutput`, `HomepageSectionOutput`, `HomepageCtaOutput`, `HomepageSeoOutput`, `HomepageCurationSuggestionOutput`, `HomepageFullProposalOutput`, `HomepageReviewOutput` |
| Curation | Suggestion-only; server verifies Testimonial IDs on apply |
| Proof | Blocks invented client counts, awards, fake metrics |
| SEO | Title/description/OG proposal only — not `noIndex` / canonical override |
| Apply | `saveHomepageDraft` only — never publish |
| UI | Homepage Copy Assistant on `/admin/homepage` |

---

## TOPIC INTELLIGENCE ROUTER

| Recommendation | Assistant |
| --- | --- |
| WRITE_NEW | Insight AI Editorial Studio (unchanged) |
| UPDATE_SERVICE_PAGE | Service AI |
| UPDATE_SOLUTION_PAGE | Solution AI |
| UPDATE_PLATFORM_PAGE | Platform AI |
| UPDATE_INDUSTRY_PAGE | Industry AI |
| UPDATE_WORK_PAGE | Case Study AI (existing Work only) |
| UPDATE_HOMEPAGE | Homepage Copy Assistant (high-confidence positioning issues) |
| EXPAND_EXISTING_RESOURCE | Guide / Comparison / Checklist / Glossary / Template / Tool by subtype |
| MONITOR / IGNORE | No default Insight; force override required |

| Area | Detail |
| --- | --- |
| Central module | `lib/ai/topic-intelligence/content-assistant-handoff.ts` |
| Target entity | Prefer `targetEntityType` / `targetEntityId`; reject mismatches |
| Work | Never invent Case Study from news; external signals ≠ project proof |
| Homepage | Only when recommendation is UPDATE_HOMEPAGE |
| Template/Tool | Only when existing resource identified |
| Testimonial | Never GENERATE/CREATE/WRITE_TESTIMONIAL |
| Tool scoring | Isolated — handoff never touches scoring |
| Initiation | Opens editor + context; human starts Generate proposal |

---

## SHARED ARCHITECTURE

| Area | Detail |
| --- | --- |
| Registry count | **13** specialized assistants |
| Proposals / runs | Unchanged `AIContentProposal` / `AIContentRun` |
| Permissions | `use_ai_writer` + `edit_draft`; publish separate |
| Stale | Homepage keys off `draftUpdatedAt ?? updatedAt` |
| Audit | `homepage.save_draft`, `homepage.publish`, `homepage.discard_draft`, `homepage.ai_assisted_draft` |

---

## SECURITY

PII exclusion, proof controls, verified-testimonial curation only, technical-field protection, provider secret isolation, SSRF/prompt injection unchanged. AI cannot publish Homepage.

---

## QA

| Check | Result |
| --- | --- |
| Full Vitest | **218** passed |
| Lint | Pass (pre-existing unrelated warning in phase3-public only if any) |
| TypeScript | Pass (`tsc --noEmit`) |
| Production build | Pass |
| Platform Selector scenarios | Pass (Phase E suite) |
| Homepage draft/public isolation | Pass |
| TI routing / mismatch / no testimonial gen | Pass |

---

## EXIT CRITERIA

- [x] Homepage no longer live-saves for AI-assisted edits  
- [x] Homepage Copy Assistant proposes to draft only  
- [x] Trust/proof invents blocked  
- [x] Curation uses real candidates  
- [x] TI routes to specialized assistants  
- [x] Work cannot invent proof from news  
- [x] Testimonials non-generative  
- [x] Tool scoring isolated  
- [x] Proposal → human → draft → preview → human publish  

**Phase E complete.** Do not start another major AI feature after this.
