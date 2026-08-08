# AI Content Assistants — Pilot Tuning Report

**Date:** 2026-08-08  
**Scope:** Platform preservation · Service relation ranking · Industry specificity  
**Mode:** Calibration only — **no apply, no publish, no Wave 1**

Related: `docs/SMARTLANCE_CONTENT_IMPROVEMENT_PILOT.md`  
Spot-check artifact: `docs/audit-artifacts/pilot-tuning-spot-check.json`  
Tests: `tests/ai/pilot-tuning-preservation.test.ts`

---

## Executive summary

The pilot correctly identified that assistants were **too willing to replace content**. This sprint adds preservation-first behavior, deterministic Service→Solution ranking, stronger Industry specificity, and regression tests so those failures do not return.

**Writing provider:** not configured  
**Tavily / research:** not configured (manual override path used in spot check)

### Final verdict

**READY FOR PROVIDER-CONFIGURED SPOT CHECK**

Code tuning is complete and heuristic spot checks pass. Re-run WordPress / Short-Term Rentals / Website Redesign with **Writing + Tavily configured** before Wave 1 application. Do not apply Wave 1 yet.

---

## PLATFORM

### Root cause

`RESEARCH_AND_IMPROVE` heuristic path treated “research ran” as “rewrite summary/description”, overwriting strong existing Platform prose when the Writing provider was unavailable.

### Preservation change

- New `researchAndImproveHeuristic()` compares current copy quality before proposing changes.
- **Strong non-empty prose → preserve by default.**
- Empty / thin fields may still be filled safely.
- Missing SEO / empty structured lists may be proposed.
- Outcome modes: `CHANGE_RECOMMENDED`, `NO_CHANGE_RECOMMENDED`, `RESEARCH_NEEDED`, `WRITING_PROVIDER_REQUIRED`, `PARTIAL_CHANGE_RECOMMENDED` via `lib/ai/content-assistants/improvement-result.ts`.
- Admin proposal UI shows outcome mode; run `resultSummary.resultMode` persisted.

### Fallback behavior

When Writing provider is **not** configured:

- `RESEARCH_AND_IMPROVE` uses preservation heuristic (never falls through to aggressive LLM/heuristic rewrite).
- Research override sources attach metadata; findings flag factual review areas without fabricating broad rewrites.
- Valid success: **“No content changes recommended.”**

### Research integration

- Official/manual sources attach to proposal `research` block.
- Heuristic flags `FACTUAL REVIEW AREAS` when sources exist but Writing is unavailable.
- LLM path prompt (when Writing is configured) instructs: map research to affected fields only; preserve strong copy.

### Prompt / version changes

| Item | Version |
| --- | --- |
| `platform.research-improve` | **v2** |
| `PLATFORM_VOICE_MODIFIER` | preservation + field-level research mapping |

### Tests

`tests/ai/pilot-tuning-preservation.test.ts` — strong copy preserved, empty description fill allowed, no broad rewrite without Writing provider, prompt version bump.

---

## SERVICE

### Root cause

`SUGGEST_RELATIONSHIPS` used first-N Solutions from the database pool with generic reasons. `IMPROVE_SERVICE` rewrote strong body copy when only CTA was missing.

### Relation ranking design

New `lib/ai/content-assistants/service/relations.ts`:

| Signal | Weight (internal) |
| --- | --- |
| Reciprocal Solution→Service link | Strong (+100) |
| Problem/capability token overlap | Moderate |
| Service-title problem hints (redesign, migration, SEO, etc.) | Moderate |
| Weak / unrelated candidates | Excluded (min score threshold) |

No public numeric score. No minimum relation quota. Valid result: **2–5 strong suggestions** or **none**.

### Context enrichment

`buildServiceContext` now loads Solution `shortDescription`, `problemSymptoms`, `possibleCauses`, `relatedServiceHrefs`, `category` for ranking — not just slug/name.

### Preservation behavior

- `IMPROVE_SERVICE` preserves strong `summary` / `description` unless review/thin-content gate finds material weakness.
- Targets sparse proposals (e.g. CTA only when review flags empty CTA).
- `primaryCtaLabel`: contextual **“Tell Us About Your Project”** (not generic “Get started”).

### Prompt / version changes

| Item | Version |
| --- | --- |
| `service.improve` | **v2** |
| `service.relations` | **v2** |
| `SERVICE_VOICE_MODIFIER` | preserve + rank + sparse proposals |

### Tests

Relation not first-N, reciprocal honored, weak excluded, Website Redesign regression (preserve body, CTA, ranked Solutions).

---

## INDUSTRY

### Root cause

Improvement template produced agency-generic copy that failed the substitution test (industry name was the only sector signal).

### Specificity context

New `lib/ai/content-assistants/industry/specificity.ts`:

- Sector **profiles** (short-term rentals, hospitality, real estate, professional services, e-commerce, local business) derive visitor decisions, trust factors, tasks, SEO angles.
- **Not hard-coded to three pilot pages** — pattern-matched by industry name/slug.
- `buildSpecificIndustryDescription()` produces sector-specific journey copy.
- `buildIndustrySeo()` avoids mechanical “Web Design for {Industry}” and unsupported “Expert … Agency” claims.

### Substitution test

- Strengthened `looksLikeGenericIndustryCopy()` + `failsIndustrySubstitutionTest()`.
- `GENERIC_COPY` warning in review findings when proposal fails.
- **Preserve** already-specific descriptions; only replace empty/generic blurbs.

### Prompt / version changes

| Item | Version |
| --- | --- |
| `industry.improve` | **v2** |
| `industry.seo` | **v2** |
| `industry.specificity` | **v2** |
| `INDUSTRY_VOICE_MODIFIER` | specificity > length, proof boundaries |

### Tests

Sector outputs differ; generic paragraph flagged; STR improve produces booking/guest/property cues; SEO non-mechanical.

---

## CONFIGURATION

| Capability | Status | Notes |
| --- | --- | --- |
| Writing provider | **Not configured** | Admin AI Writer / env — see `docs/AI_CONTENT_ASSISTANTS_OPERATIONS.md` |
| Tavily | **Not configured** | `TAVILY_API_KEY` or `AI_RESEARCH_API_KEY` |
| API keys in source | **None added** | |

**Note:** `ManualOnlyResearchProvider.isConfigured()` returns `true` — use `getResearchProviderStatus().configured` (Tavily actually wired) when deciding whether live search is available. Spot-check script fixed to pass official overrides when Tavily is not configured.

---

## SPOT CHECK (heuristic — proposals only)

Script: `scripts/run-pilot-tuning-spot-check.ts`  
Artifact: `docs/audit-artifacts/pilot-tuning-spot-check.json`

| Target | Action | Result |
| --- | --- | --- |
| WordPress | `RESEARCH_AND_IMPROVE` | **PASS** — 0 summary/description rewrites; research attached; preservation findings |
| Short-Term Rentals | `IMPROVE_INDUSTRY` | **PASS** — current description already sector-specific; SEO-only proposal |
| Website Redesign | `SUGGEST_RELATIONSHIPS` + `IMPROVE_SERVICE` | **PASS** — ranked reciprocal Solutions; CTA only (body preserved) |

**Not applied. CMS unchanged** (`lastReviewedAt` still null; Homepage SEO still empty).

After Writing + Tavily are configured: re-run the same three targets and confirm LLM path preserves strong fields with targeted, source-backed edits.

---

## QA

| Check | Result |
| --- | --- |
| New tests | `tests/ai/pilot-tuning-preservation.test.ts` (+15) |
| Vitest total | 242 passing |
| lint | pass (1 pre-existing unrelated warning) |
| `tsc --noEmit` | pass |
| production build | pass |

---

## System issues addressed (this sprint)

| Issue | Fix |
| --- | --- |
| Platform heuristic overwrote strong copy | Preservation gate + result modes |
| Service first-N relations | Deterministic ranking + enriched context |
| Industry generic templates | Sector profiles + substitution test |
| Pilot bug: `customInstructions` in public copy | Fixed earlier + hygiene test retained |
| Manual research provider `isConfigured()` confusion | Documented; spot-check override logic fixed |

**Homepage / Comparison:** not tuned (per scope). Comparison preservation behavior unchanged.

---

## Next steps (do not execute yet)

1. Configure Writing provider + Tavily.
2. Re-run `scripts/run-pilot-tuning-spot-check.ts` (or Admin UI equivalent) on WordPress, Short-Term Rentals, Website Redesign.
3. If provider spot check passes → proceed to **Wave 1 application** (edited Homepage SEO, Platform re-test, etc.) per `docs/SMARTLANCE_CONTENT_IMPROVEMENT_PILOT.md`.
4. Do **not** mass-generate or apply pilot proposals from the first run without human review.

---

## Final verdict

**READY FOR PROVIDER-CONFIGURED SPOT CHECK**

Architecture and heuristic behavior are calibrated. Live provider quality must be confirmed before Wave 1 application.
