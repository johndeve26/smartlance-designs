# AI Writer Cost Controls

## Visibility

- Per project: run count, input/output tokens (`getProjectCostSummary`)
- Dashboard: runs/tokens today and this month (DB-derived — not public analytics)
- Approx **USD cost only if** `AIWriterSettings.modelPricingJson` is explicitly configured

Example pricing JSON (Admin/server — no secrets):

```json
[
  { "model": "gpt-4o", "inputPer1MUsd": 2.5, "outputPer1MUsd": 10 },
  { "model": "gpt-4o-mini", "inputPer1MUsd": 0.15, "outputPer1MUsd": 0.6 }
]
```

Do not hardcode provider prices that go stale.

## Guardrails

- `maxConcurrentJobs` — blocks duplicate expensive parallel jobs
- Input fingerprint — blocks identical in-flight double-clicks
- Result cache (optional) — reuses recent identical analysis fingerprints
- `dailyTokenWarningThreshold` — warning, not hard kill of legitimate work
- `maxResearchQueries` / `maxSources` / `maxDraftRegens`

## Reduce cost

Prefer FAST_MODEL for classification; WRITING_MODEL for drafts. Avoid re-running unchanged cannibalization/SEO. Deselect weak sources before drafting.
