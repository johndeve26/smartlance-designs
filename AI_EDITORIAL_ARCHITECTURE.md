# AI Editorial Architecture

Smartlance **AI Editorial Studio** (`/admin/ai-writer`) is an Admin-only editorial workflow that helps research, plan, write, and prepare Insight drafts. It does **not** replace `/admin/insights` or auto-publish.

## Stack

- Next.js Admin routes + server actions
- PostgreSQL / Prisma models (`AIEditorialProject`, `AIEditorialRun`, `AIResearchSource`, `AIClaim`, `AIBrandVoice`, `AIWriterSettings`)
- `AIProvider` abstraction (`lib/ai/providers`) — initial: OpenAI-compatible Chat Completions
- `ResearchProvider` abstraction (`lib/ai/research`) — optional Tavily; manual URLs always work
- `EditorialKnowledgeService` — DB retrieval of published Services, Solutions, Platforms, Industries, Work, Insights, Resources, verified Testimonials, Site Settings
- Prompt versions in `lib/ai/prompts.ts` (e.g. `content-brief:v1`, `article-draft:v1`)
- Zod validation for structured model output with bounded repair

Jobs: durable run rows in DB; concurrency limits; timeout-aware fetch; **stale RUNNING recovery**; duplicate fingerprint protection; optional analysis cache.

Claim Ledger: support classification + per-source evidence strength (DIRECT/PARTIAL/CONTEXTUAL/INSUFFICIENT).

Evaluation: golden fixtures + `/admin/ai-writer/evaluations` (mock). See `AI_WRITER_EVALUATION.md`.

## Knowledge retrieval

Starts with PostgreSQL metadata/full-text style filtering (titles, summaries, relationships). Embeddings / pgvector are **optional** and not required for v1.

## CMS integration

`APPROVED_FOR_CMS` → `createInsightDraftFromProject` → existing Insight **DRAFT** via `saveInsightDraft`. Publishing remains `/admin/insights` RBAC. Conflict protection compares `insightSnapshotAt` to Insight `updatedAt`.

## Security boundaries

- API keys: Admin-encrypted in DB (`AIProviderAccount`) with env fallbacks; encryption master key env-only (`AI_SECRETS_ENCRYPTION_KEY` / `ADMIN_SESSION_SECRET`). Also `TAVILY_API_KEY` for research.
- Never send Enquiries / EnquiryNotes / password hashes / private testimonial notes
- Untrusted web text wrapped in `sandboxUntrustedText`
- Unsafe URLs rejected (`javascript:`, non-http(s))
- No public `/ai-writer` route
