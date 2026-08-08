# Smartlance Content Improvement Pilot

**Date:** 2026-08-08  
**Mode:** Proposals only — **no apply, no draft save, no publish**  
**Raw artifact:** `docs/audit-artifacts/content-improvement-pilot-raw.json`  
**Script:** `scripts/run-content-improvement-pilot.ts`

---

## Executive summary

Eight real CMS targets were run through existing specialized assistants.  
`AIContentProposal` / `AIContentRun` records were persisted. **Published CMS content was verified unchanged** (Homepage SEO still empty; Homepage draft untouched; Platform `lastReviewedAt` still null).

### Environment constraint (material)

| Capability | Status |
| --- | --- |
| Writing AI provider | **Not configured** (`configured: false`) |
| Tavily / research provider | **Not configured** (manual-only) |
| Pilot path | Heuristic assistants + **official researchOverride** for Platform/Comparison |

This pilot therefore evaluates **architecture + heuristic proposal quality + official-source attachment**, not full live LLM writing quality.

### Overall go / no-go

**READY WITH ASSISTANT TUNING**

- Homepage SEO proposal is useful (apply later with light edit).  
- Comparison review/freshness correctly **preserved** strong content (0 field rewrites).  
- Platform `RESEARCH_AND_IMPROVE` heuristic **regressed** already-strong summaries/descriptions → keep current.  
- Service improve/relations heuristics need ranking + preservation work.  
- Industry improve still too generic under substitution test.  
- Fixed during pilot: heuristic paths were appending `customInstructions` into proposed public copy (bug).

---

## Exact eight targets

| # | Type | Record | ID / slug |
| --- | --- | --- | --- |
| 1 | Homepage | Published Homepage | `home` |
| 2 | Platform | WordPress | `wordpress` |
| 3 | Platform | Shopify | `shopify` |
| 4 | Platform | Webflow | `webflow` |
| 5 | Platform | WooCommerce | `woocommerce` |
| 6 | Industry | Short-Term Rentals (proven, 3 published Work) | `short-term-rentals` |
| 7 | Service | Website Redesign | `website-redesign` |
| 8 | Comparison | WordPress vs Webflow | `wordpress-vs-webflow` |

---

## Pilot summary table

| PAGE | TYPE | ASSISTANT | ACTION | PROPOSAL VERDICT | EDIT EFFORT | RESEARCH USED | IMPORTANT WARNING | RECOMMEND APPLY? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Homepage | Homepage | Homepage Copy | GENERATE_SEO | ACCEPTABLE FOR HUMAN REVIEW | READY AFTER LIGHT EDIT | No (not needed) | Title mirrors hero; OK | **YES WITH EDITS** |
| WordPress | Platform | Platform AI | RESEARCH_AND_IMPROVE | REJECT | REJECT | Official overrides (3) | Heuristic overwrote stronger current copy | **NO** |
| Shopify | Platform | Platform AI | RESEARCH_AND_IMPROVE | REJECT | REJECT | Official overrides (2) | Same overwrite pattern | **NO** |
| Webflow | Platform | Platform AI | RESEARCH_AND_IMPROVE | REJECT | REJECT | Official overrides (2) | Same overwrite pattern | **NO** |
| WooCommerce | Platform | Platform AI | RESEARCH_AND_IMPROVE | REJECT | REJECT | Official overrides (2) | Same overwrite pattern | **NO** |
| Short-Term Rentals | Industry | Industry AI | IMPROVE_INDUSTRY | PARTIALLY USEFUL | NEEDS MODERATE EDITING | No | Fails strong specificity test | **YES WITH EDITS** (description only after rewrite) |
| Short-Term Rentals | Industry | Industry AI | GENERATE_SEO | PARTIALLY USEFUL | READY AFTER LIGHT EDIT | No | Thin but safe | **YES WITH EDITS** |
| Website Redesign | Service | Service AI | REVIEW_SERVICE | ACCEPTABLE FOR HUMAN REVIEW | READY AFTER LIGHT EDIT | No | Correctly flags empty CTA | N/A (review only) |
| Website Redesign | Service | Service AI | IMPROVE_SERVICE | REJECT (body) / PARTIAL (CTA) | NEEDS MAJOR EDITING | No | Proposed body weaker than current | **NO** for copy; CTA **YES WITH EDITS** |
| Website Redesign | Service | Service AI | SUGGEST_RELATIONSHIPS | PARTIALLY USEFUL | NEEDS MODERATE EDITING | No | First-N pool, weak reasons | **NO** as-is |
| WP vs Webflow | Comparison | Comparison AI | REVIEW_COMPARISON | ACCEPTABLE FOR HUMAN REVIEW | READY AFTER LIGHT EDIT | None in review | Neutrality PASS | N/A |
| WP vs Webflow | Comparison | Comparison AI | RESEARCH_OPTIONS | ACCEPTABLE FOR HUMAN REVIEW | READY AFTER LIGHT EDIT | WP+Webflow official | 0 fields — preserved structure | **NO** field apply (none proposed) |
| WP vs Webflow | Comparison | Comparison AI | CHECK_FRESHNESS | ACCEPTABLE FOR HUMAN REVIEW | READY AFTER LIGHT EDIT | WP+Webflow official | Source balance PASS with overrides | N/A |

---

## Target 1 — Homepage SEO

**Audit finding:** Missing published SEO title/description.  
**Assistant:** Homepage Copy Assistant · `GENERATE_SEO`  
**Proposal:** `cmskh28120001mkxprjx458hs` · Run: `cmskh27ms0000mkxp79m2ciu4` · Prompt: `homepage.seo:v1`

**Strengths preserved:** Hero/CTAs/curation locked — not proposed.  
**Proposed:**

| Field | Recommendation |
| --- | --- |
| seoTitle / metaTitle / ogTitle = `Smartlance Designs \| Websites Built to Rank, Convert and Grow.` | **EDIT** — consider slightly clearer commercial framing without keyword stuffing |
| seoDescription / meta / og = hero supporting copy | **ACCEPT** with light trim if needed |

**Claims:** None invented (no awards/client counts).  
**International tone:** OK.  
**Edit effort:** READY AFTER LIGHT EDIT  
**Verdict:** ACCEPTABLE FOR HUMAN REVIEW  
**Recommend apply:** YES WITH EDITS  

---

## Targets 2–5 — Platforms (Research & improve)

**Official sources attached** (researchOverride; Tavily unavailable):

| Platform | Official sources |
| --- | --- |
| WordPress | wordpress.org, 7.0.3 news, developer.wordpress.org |
| Shopify | shopify.com/plus, shopify.dev |
| Webflow | webflow.com, university.webflow.com |
| WooCommerce | woocommerce.com, developer.woocommerce.com |

**What worked**
- Research metadata persisted (`research.performed`, OFFICIAL sourceType).  
- Protected fields (`verifiedExperience`, `lastReviewedAt`, status) not proposed.  
- No partner/certification inventions in claims array.  
- Shopify marketing metrics (CAC/conversion %) correctly treated as vendor marketing — not copied as Smartlance proof.

**What failed (repeated / material)**
1. Heuristic **replaced stronger current summaries/descriptions** with generic “X fit, strengths, and trade-offs…” templates.  
2. `customInstructions` were being **concatenated into proposed public copy** (bug — fixed after pilot generation; see System issues).  
3. Research snippets were **not meaningfully integrated** into field text beyond a boilerplate “align with official documentation (domain)” line.  
4. Would a human prefer AI over current? **No** — KEEP CURRENT for all four summary/description pairs.

**Edit effort:** REJECT  
**Verdict:** REJECT  
**Recommend apply:** **NO**  
**`lastReviewedAt`:** unchanged (correct — not modified during proposal generation)

---

## Target 6 — Industry (Short-Term Rentals)

**Why chosen:** `group=proven`, 3 published Work links, audit HIGH priority, commercially central.

### IMPROVE_INDUSTRY — `cmskh2prx000gmkxpxgr8zbeo`
- Proposed description expands beyond one-line blurb (good intent).  
- Still largely **substitutable** (“organisations typically need websites…”) — Industry specificity incomplete.  
- Mentions verified Work context when available (proof-safe).  
- **Recommend:** EDIT heavily or KEEP CURRENT until live WRITING provider + STR-specific instructions.

### GENERATE_SEO — `cmskh2ubt000jmkxpm5iry79r`
- Safe titles/descriptions; thin but non-hype.  
- **Recommend apply:** YES WITH EDITS (human polish for STR keywords / direct-booking intent).

**Edit effort:** MODERATE (improve) / LIGHT (SEO)  
**Verdict:** PARTIALLY USEFUL  

---

## Target 7 — Service (Website Redesign)

### REVIEW_SERVICE — `cmskh2yza000mmkxp324i6ynh`
Useful findings: CTA empty (WARNING), differentiation REVIEW, proof/SEO PASS.  
**Verdict:** ACCEPTABLE FOR HUMAN REVIEW  

### IMPROVE_SERVICE — `cmskh31st000pmkxpdz21dkpu`
| Field | Rec |
| --- | --- |
| summary / description | **KEEP CURRENT** (proposed more generic) |
| primaryCtaLabel `Request a free review` | **EDIT** → `Get a Free Website Review` |
| primaryCtaHref `/free-website-review` | **ACCEPT** (existing-site problem fit) |

Differentiation test: proposed body fails — could fit many Services.  
**Recommend apply:** NO for body; YES WITH EDITS for CTA only.

### SUGGEST_RELATIONSHIPS — `cmskh34u6000smkxpczhg4y9f`
Suggested: E-commerce Growth, Local Business Visibility, Low Website Conversions + BigCommerce, Clixlo.  
**Issues:** first-N from pool; reasons generic; better targets would be `outdated-website`, `slow-website`, `low-website-conversions`, `website-not-ranking`.  
**Recommend apply:** NO as-is (human should pick Solutions manually or regenerate after relation ranking fix).

---

## Target 8 — Comparison (WordPress vs Webflow)

**Review / Research / Freshness** produced **0 field changes** while attaching balanced official sources for WP + Webflow.  
This is a **success**: strong Comparison structure preserved; findings advise freshness without forced rewrite.

| Finding area | Result |
| --- | --- |
| Neutrality | PASS (no winner language / fake ratings) |
| Source balance (with overrides) | PASS on CHECK_FRESHNESS |
| Factual freshness | REVIEW (pricing/plans still need ongoing official checks) |

**Recommend apply:** NO fields (none proposed) — correct.  
**Verdict:** ACCEPTABLE FOR HUMAN REVIEW  

---

## Assistant performance

### Homepage Copy Assistant
- **Worked:** Scope control via locked fields; safe SEO fill for missing metadata.  
- **Failed:** Nothing material.  
- Light human polish recommended.

### Platform AI
- **Worked:** Source attachment; protected fields; no unsafe partner claims.  
- **Failed (material):** Heuristic RESEARCH_AND_IMPROVE overwrites strong copy; weak research→copy integration without live WRITING model.  
- **Tuning needed** before Wave 1 Platform application.

### Industry AI
- **Worked:** Proof-safe Work mention; SEO fill.  
- **Failed:** Specificity still weak under substitution test in heuristic mode.

### Service AI
- **Worked:** Review findings useful (CTA gap).  
- **Failed:** Improve body regression; relationship suggestions unranked.

### Comparison AI
- **Worked:** Neutrality checks; preservation; dual-option source attachment.  
- **Failed:** Nothing material in this pilot.

---

## System issues

### Bug fixed during pilot
| | |
| --- | --- |
| **Bug** | Heuristic assistants appended `Editor note: ${customInstructions}` into proposed public fields |
| **Cause** | `note` concatenated into summary/description templates in platform/service/industry/solution heuristics |
| **Fix** | Stopped appending instructions into proposed copy (`void input.customInstructions` in heuristics) |
| **Tests** | Existing assistant suites + re-run full Vitest |

### Context / tuning deficiencies (not fixed in pilot)
1. Platform `RESEARCH_AND_IMPROVE` should **prefer KEEP CURRENT** when existing prose is stronger and research only confirms freshness.  
2. Service `SUGGEST_RELATIONSHIPS` needs relevance ranking (not alphabet/first-N).  
3. Industry improve needs STR-specific templates or live WRITING model.  
4. **Configure writing provider + Tavily** before judging LLM proposal quality.

### Provider usage
- Writing tokens: **0** (heuristic)  
- Research: official overrides only (no Tavily calls)  
- Durations: ~3–6s per proposal (DB + generation)

---

## Recommended next wave (DO NOT EXECUTE)

From the existing backlog, after tuning + provider config:

1. Apply Homepage SEO (edited)  
2. Re-test Platform RESEARCH_AND_IMPROVE on WordPress only with live WRITING + Tavily  
3. Industry SEO for remaining proven industries (Hospitality, Cabin, Real Estate, Property Management)  
4. Manual or improved Service→Solution linking for Website Design / Development / Redesign / Strategy  
5. Guide freshness (Website Redesign Guide)  
6. Hold Insight VR consolidation and remaining Platforms until Platform AI preserves strong copy  

**Do not touch the 48 STRONG pages.**

---

## QA

| Check | Result |
| --- | --- |
| Vitest | **227** passed |
| Lint | Pass (1 pre-existing warning) |
| tsc | Pass |
| Build | Pass |
| CMS mutation | None (spot-checked) |

---

## Final verdict

# READY WITH ASSISTANT TUNING

Architecture and proposal persistence work. Comparison preservation and Homepage SEO are encouraging.  
**Do not apply Platform/Service body proposals from this heuristic pilot.**  
Configure providers, keep the instruction-leak fix, tune Platform research preservation + Service relation ranking, then re-run a short Platform+Service spot-check before Wave 1 application.
