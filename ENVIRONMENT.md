# Environment reference

Authoritative classification of Smartlance env vars. Secrets must never appear in `NEXT_PUBLIC_*`, client bundles, System Status values, logs, or API responses.

| Variable | Class | Notes |
| --- | --- | --- |
| `DATABASE_URL` | SECRET / REQUIRED (prod) | Pooled Postgres for runtime |
| `DIRECT_URL` | SECRET / OPTIONAL | Direct URL for `prisma migrate` |
| `ADMIN_SESSION_SECRET` | SECRET / REQUIRED (prod) | ≥32 random chars |
| `ADMIN_PREVIEW_SECRET` | SECRET / OPTIONAL | Preview HMAC; else session secret |
| `ADMIN_BOOTSTRAP_EMAIL` | SECRET / BOOTSTRAP | First Super Admin only |
| `ADMIN_BOOTSTRAP_PASSWORD` | SECRET / BOOTSTRAP | ≥12 chars; bootstrap only |
| `ADMIN_BOOTSTRAP_NAME` | OPTIONAL | Display name |
| `RESEND_API_KEY` | SECRET / RECOMMENDED | Notification email |
| `CONTACT_TO_EMAIL` / `FORM_TO_EMAIL` | OPTIONAL | Recipient |
| `CONTACT_FROM_EMAIL` | OPTIONAL | Verified From |
| `FORM_WEBHOOK_URL` / form-specific webhooks | SECRET / OPTIONAL | Alt notification |
| `ALLOW_FORM_LOG_FALLBACK` | DEVELOPMENT ONLY | Never in real production |
| `MEDIA_STORAGE_PROVIDER` | OPTIONAL | `local` (dev) or `s3` |
| `MEDIA_PUBLIC_BASE_URL` | OPTIONAL | Public CDN/base for objects |
| `MEDIA_S3_*` | SECRET | Bucket credentials |
| `MEDIA_ALLOW_LOCAL_IN_PRODUCTION` | DEVELOPMENT ONLY | Escape hatch only |
| `MEDIA_MAX_UPLOAD_MB` | OPTIONAL | Default 8, max 25 |
| `NEXT_PUBLIC_SITE_URL` | PUBLIC / REQUIRED (prod) | Canonical origin |
| `NEXT_PUBLIC_CONTACT_*` / address / analytics IDs | PUBLIC / OPTIONAL | Prefer Site Settings after Phase 4 |
| `NEXT_PUBLIC_SHOW_DRAFT_CONTENT` | DEVELOPMENT ONLY | Never production |
| `AI_SECRETS_ENCRYPTION_KEY` | SECRET / RECOMMENDED | AES key material for Admin-stored provider API keys (≥16 chars). Falls back to `ADMIN_SESSION_SECRET`. Rotating requires re-entering provider keys. |
| `OPENAI_API_KEY` / `AI_PROVIDER_API_KEY` | SECRET / OPTIONAL | Env fallback if Admin OpenAI/custom key not set |
| `ANTHROPIC_API_KEY` | SECRET / OPTIONAL | Env fallback for Claude |
| `GOOGLE_AI_API_KEY` | SECRET / OPTIONAL | Env fallback for Gemini |
| `XAI_API_KEY` | SECRET / OPTIONAL | Env fallback for Grok |
| `OPENROUTER_API_KEY` | SECRET / OPTIONAL | Env fallback for OpenRouter |
| `AGENT_ROUTER_TOKEN` / `AGENTROUTER_API_KEY` | SECRET / OPTIONAL | Env fallback for Agent Router (`https://agentrouter.org/v1`) |
| `OPENAI_BASE_URL` | OPTIONAL | Env fallback OpenAI-compatible gateway |
| `AI_WRITING_MODEL` / `AI_RESEARCH_MODEL` / `AI_EDITOR_MODEL` / `AI_FAST_MODEL` | OPTIONAL | Env fallback model role overrides |
| `TAVILY_API_KEY` / `AI_RESEARCH_API_KEY` | SECRET / OPTIONAL | Web research (manual URLs work without) |

Validation: `lib/env.ts` + `instrumentation.ts` (hard-fail when `VERCEL_ENV=production`).

See `.env.example` for placeholders.
