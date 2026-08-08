# AI Writer Production Runbook

## Configure

1. Open `/admin/ai-writer/settings` (requires `manage_ai_settings`).
2. For each vendor (OpenAI, Claude, Gemini, Grok, OpenRouter, Agent Router, Custom): enable, paste API key, optional base URL override → Save. Keys are AES-GCM encrypted; UI shows last 4 only.
3. Set **Default provider** and assign Writing / Research / Editor / Fast models (optional per-role provider overrides).
4. Set `AI_SECRETS_ENCRYPTION_KEY` in production (falls back to `ADMIN_SESSION_SECRET`). Rotating it requires re-entering provider keys.
5. Optional env fallbacks still work: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY`, `XAI_API_KEY`, `OPENROUTER_API_KEY`.
6. Optional: `TAVILY_API_KEY` for web research; manual URLs always work.
7. Check `/admin/system` — AI Provider / Research Provider (no secrets).
8. Approve Brand Voice at `/admin/ai-writer/brand-voice` before relying on custom voice.
9. Use **Test connection** on a provider card before the first production project.

## One test project

1. `/admin/ai-writer/new` → topic without requiring a keyword.
2. Run overlap check → research → review/deselect sources.
3. Brief → unique value → outline → draft.
4. Fact check (Claim Ledger) → SEO + AI Search → internal links → quality.
5. Clear blockers at top of project page.
6. Confirm human checklist → Approve for CMS → Create Insight **DRAFT**.
7. Edit/preview/publish only via existing Insights CMS.

## Failure runbook

| Symptom | Action |
| --- | --- |
| Provider down / NOT_CONFIGURED | CMS continues; add/fix key in AI Writer Settings (or env fallback); retry run |
| Tavily unavailable | Add manual primary URLs; proceed |
| Stuck RUNNING | Auto-recovered after `staleJobMinutes` (default 30) as TIMEOUT |
| Malformed JSON | Bounded repair; run FAILED; retry creates new run |
| CMS conflict | Linked Insight edited after snapshot — import/refresh explicitly |
| High token usage | Dashboard warning if threshold set; reduce research/drafts; change model |

## Never

- Auto-publish
- Override unsafe URL / malicious content / missing permission
- Trust citation without evidence strength DIRECT/PARTIAL/CONTEXTUAL
