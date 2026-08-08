# Topic Intelligence Operations

## Daily use

1. Open **AI Writer → Topic Discovery** (`/admin/ai-writer/discover`)
2. Enter a seed (topic, question, platform, etc.)
3. Choose **Mixed discovery** (default) and market (Global English by default)
4. Click **Research opportunities**
5. Review opportunity cards (recommendation badges, why now, overlap)
6. Open an opportunity → **Approve**, **Monitor**, **Reject**, or **Create AI Project**

## How to review an opportunity

1. Read **Why now** / **Why Smartlance** — reject generic reasoning  
2. Check **existing content** overlap and format suggestion  
3. Trace evidence: opportunity → signal titles → source pack/provider notes  
4. Confirm CTA is provisional (Solution / Service / Planner / Review — not always Contact)  
5. Override recommendation if needed (AI original is preserved)  
6. Leave lightweight feedback (good / wrong format / duplicate missed / etc.)

## Reject / monitor

- **Reject** with reason — suppresses resurfacing via `mergeKey`  
- **Monitor** when early/weak evidence; later scans should merge, not duplicate  
- Rejection notes help future calibration  

## Evidence interpretation

- Official/primary sources should anchor factual clusters when present  
- Secondary sources explain impact/trade-offs — do not discard solely because an official source exists  
- Without Trends/Search Console: expect **Not available** / no “surging searches” claims  

## Convert / commercial handoffs

### Commercial page updates (preferred)

When recommendation is `UPDATE_SERVICE_PAGE` / `UPDATE_SOLUTION_PAGE` / `UPDATE_PLATFORM_PAGE` / `UPDATE_INDUSTRY_PAGE` / `UPDATE_WORK_PAGE` / `UPDATE_HOMEPAGE`:

1. Click **Update Service / Solution / Platform / Industry / Case Study / Homepage**
2. Opens the matching CMS editor + AI assistant with opportunity context
3. Does **not** create an Insight AI project
4. Human explicitly starts proposal generation

`UPDATE_WORK_PAGE` requires an existing Work record — never invent a Case Study from news.  
`UPDATE_HOMEPAGE` is for clear positioning/architecture issues only — not keyword stuffing.

Wrong targetEntityType vs recommendation is rejected server-side.

### Insight projects

- **Create Insight Project** remains for WRITE_NEW / UPDATE_EXISTING / etc.
- Force override required for MONITOR / IGNORE / commercial-page / Work / Homepage / **EXPAND_EXISTING_RESOURCE** recommendations if you still want an Insight project  
- Does **not** generate or publish Insights automatically  

### Resource expand handoffs (Phase D)

When recommendation is `EXPAND_EXISTING_RESOURCE` and an existing CmsResource is resolved from overlap + `suggestedFormat`:

1. Click **Update Resource** / Expand Guide / Update Comparison / etc.
2. Opens `/admin/resources/[type]/[id]` with the matching assistant (Guide AI, Comparison AI, …)
3. Does **not** create an Insight project
4. Human starts generation; Checklist suggestions do not auto-insert items

TEMPLATE/TOOL handoffs only when an existing resource hit is present (not routine TI product edits).

Homepage AI is not wired.

## Strategy settings

Update priority / lower-priority themes, markets, and paused topics on the discovery dashboard (Topic strategy). Strategy may raise priority but must not justify low-value content.

## Calibration & evaluations

1. `/admin/ai-writer/evaluations` → Topic Intelligence calibration  
2. Review confusion buckets and mismatches  
3. Save snapshot after prompt/model changes  
4. Run holdout only after tuning  
5. See `docs/TOPIC_INTELLIGENCE_EVALUATION.md`  

Human labels do **not** auto-retrain the engine.

## Create AI Project handoff

- Populates topic, audience, market, goal, intent, angle, service/solution
- Imports safe discovery URLs into project research sources
- Enters the existing Editorial Studio workflow
- Does **not** generate or publish Insights automatically

## Watchlists

1. `/admin/ai-writer/watchlists`
2. Create/edit themes + keywords + optional Source Pack
3. **Scan now** runs discovery for that watchlist
4. Scheduled scans remain disabled until durable cron is configured
5. Prefer focused themes (Web Performance, WordPress, Search & SEO) over broad “Technology”

## Source Packs

1. `/admin/ai-writer/source-packs`
2. Enable packs, add official domains / RSS / keywords
3. **Test feed** validates RSS safely (SSRF-safe; no private hosts)
4. Prune weak/dead/noisy feeds rather than continuously adding more
5. Health is qualitative: Healthy / Some feeds failing / No recent entries / Misconfigured — no fake score

## Bulk seeds

Import one suggestion per line. Creates **seeds only**, not drafts. Do not auto-publish calibration seeds.

## Rejection

Rejected opportunities are retained to suppress repeated bad suggestions.

## Cost notes

Discovery may call web/news/RSS providers and use AI Writer limits:

- `maxDiscoveryQueries`
- `maxDiscoveryResultsPerSource`
- `maxDiscoveryProviderCalls`

Per manual scan, note providers used, calls, AI runs, tokens, duration, signals, opportunities.

Do not refresh sources on every page load. Use **Refresh sources** deliberately.

## Scheduling

**Keep manual** until pilot evidence supports low noise, stable cost, and useful opportunity quality. Do not enable cron from this document alone.

## Related docs

- `TOPIC_INTELLIGENCE_ARCHITECTURE.md`
- `TOPIC_INTELLIGENCE_EVALUATION.md`
- `TOPIC_INTELLIGENCE_PILOT_REPORT.md`
- `EDITORIAL_STRATEGY_CALIBRATION.md`
- `TOPIC_SIGNAL_PROVIDERS.md`
- `EDITORIAL_SOURCE_PACKS.md`
