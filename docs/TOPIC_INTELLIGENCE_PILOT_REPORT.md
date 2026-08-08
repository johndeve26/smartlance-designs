# Topic Intelligence Pilot Report

Status as of calibration pass for Topic Intelligence V1 (quality calibration + editorial strategy validation).

## Scope

- Calibrate editorial judgement (write / update / ignore / formats)  
- Offline gold set + diagnostic suite  
- Admin feedback + original recommendation preservation  
- **No** cron enablement  
- **No** Google Trends / Search Console implementation  
- **No** mass paid discovery scans  

## Calibration dataset

| Item | Count |
| --- | --- |
| Training fixtures | ~36 |
| Holdout fixtures | ~10 (~22%) |
| Categories | design, development, SEO, conversion, performance, ecommerce, platforms, local, hospitality, real estate, professional services, industry news, format boundaries, duplicates, bad ideas |

Gold labels live in `lib/ai/topic-intelligence/calibration/fixtures.ts`.

## Decision quality (offline heuristic)

Training suite (`includeHoldout: false`):

| Metric | Result |
| --- | --- |
| Fixtures | 36 |
| Decision matches | 36 / 36 |
| False WRITE positives | 0 |
| False IGNORE/MONITOR on strong opps | 0 |
| Format checked / matches | 18 / 16 |

Holdout (post-tuning check): ~45 / 46 decision matches; inspect remaining mismatches manually — do not overfit.

Run via `runTopicCalibrationSuite()` or Admin → Evaluations.

## Cannibalization

Covered by strong Insight overlap, Comparison/Checklist/Glossary expand paths, and commodity IGNORE rules. Distinct intents (e.g. traffic not converting vs enquiry tracking) remain separate seeds.

## Content format

Engine now prefers:

- Definitional → Glossary  
- Checklist wording → Checklist expand when present  
- `vs` / versus → Comparison expand or Comparison format  
- Service catalogue questions → Service page update  

Insight is no longer the only path for comparison-shaped seeds.

## Internal coverage

Calibration index mirrors typical Smartlance patterns:

- Strong STR Insight density  
- Commercial Services/Solutions for redesign, migration, leads, slow site  
- Sparse performance editorial vs Slow Website Solution  

Live Content Balance on `/admin/ai-writer/discover` should be reviewed manually against Services / Solutions / Platforms / Industries. Do not auto-add CMS relationships from discovery suggestions.

## External signals (pilot posture)

| Provider | Pilot note |
| --- | --- |
| Tavily | Primary web research when configured |
| NewsAPI / GNews | Optional; keep only if unique useful signals beyond Tavily+RSS |
| RSS / Source Packs | Prefer pruning weak feeds over adding more |
| Trends | Deferred — no “surging searches” language without data |
| Search Console | Deferred until live query data exists |

Manual scans only. Track providers used, calls, AI runs, tokens, duration, signals, opportunities per run (monetary cost only if pricing config exists).

## Suggested pilot scans (5–8, manual)

1. Search & SEO  
2. Website Performance  
3. WordPress / Webflow  
4. E-commerce  
5. Local Search  
6. Hospitality (watch for STR duplicate pressure)  
7. Professional Services  
8. Broad internal content-gap seed  

Success criterion: “I would consider writing or updating these,” not “we fetched 200 headlines.”

## Source packs / watchlists

After pilot:

- Remove noisy / dead feeds  
- Merge overlapping watchlists  
- Prefer focused lists (Web Performance, WordPress, Shopify, Search & SEO) over “Technology”  

## Cost / operations

Use discovery limits in AI Writer settings. Do not refresh sources on every page load. Rejected opportunities suppress resurfacing via `mergeKey`.

## Security

- Enquiry/PII excluded from discovery context  
- SSRF-safe URL checks on source pack feeds  
- Untrusted source text sandboxed in prompts  
- Provider secrets remain env/Admin status only  

## QA (this calibration pass)

| Check | Result |
| --- | --- |
| Vitest | 132 passing |
| TypeScript | pass |
| Topic Intelligence lint paths | pass |
| Production build | pass |

## Prompt adjustments in this pass

- Commodity / listicle / year-bait IGNORE  
- Comparison format path  
- Service catalogue → UPDATE_SERVICE_PAGE  
- Noise filter extended (stocks)  
- Prompt versions: `topic-discovery:v1`, `opportunity-analysis:v1`, `signal-clustering:v1`  
- Preserve `aiOriginalRecommendation` + lightweight editorial feedback  

## Docs added/updated

- `TOPIC_INTELLIGENCE_EVALUATION.md`  
- `EDITORIAL_STRATEGY_CALIBRATION.md`  
- This report  
- Operations section extended for calibration workflow  

## Final verdicts

### Manual discovery

**READY WITH EDITORIAL CONDITIONS**

Conditions:

1. Editor reviews every opportunity before AI Project handoff  
2. Treat WRITE NEW false positives seriously; prefer UPDATE/EXPAND when overlap exists  
3. Keep approved backlog to ~10–20 items, not a large idea dump  
4. Prune Source Packs/Watchlists after the first 5–8 manual scans  
5. Do not invent trend % / search volume  

### Scheduled discovery

**KEEP MANUAL**

Revisit scheduling only after: low noise, stable provider cost, solid duplicate suppression, useful opportunity quality, and no recurring provider/security failures. If enabled later, design cadence from evidence (e.g. weekly platform/search packs; monthly evergreen strategy) — do not implement cron in this phase.

## Strongest approved opportunity themes (calibration shortlist)

1. Redesign vs rebuild  
2. Website migration without ranking loss  
3. Core Web Vitals for business owners  
4. Traffic / KPI vs enquiries framing  
5. Local SEO for service businesses  
6. Trust signals on service-business websites  
7. How to brief a web design agency  
8. Shopify vs BigCommerce (or Comparison refresh)  
9. What belongs in a website audit  
10. Enquiry tracking accuracy (distinct from “traffic doesn’t convert”)  
11. Selective distinct hospitality (e.g. direct-booking requirements checklist) — not PriceLabs/Airbnb duplicates  
12. Accessibility for business decision-makers (higher factual review)  

## Trends / Search Console

Recommend implementing Trends only if pilot shows a specific need current signals cannot meet. Search Console after the site is live with meaningful query data and a proven editorial workflow.
