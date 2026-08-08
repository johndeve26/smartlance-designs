# Admin Architecture

Smartlance Admin Manager (Phases 1–2) stores editable site content in **PostgreSQL** (Neon or any standard Postgres) and serves the public site through a portable repository layer.

## Dependency rule

```
Next.js (RSC / Server Actions) → repositories (`lib/repositories/`) → Prisma Client → PostgreSQL
```

- Do **not** call Prisma from React client components.
- Do **not** use Neon-specific APIs in application code (no `@neondatabase/serverless` in app paths). Connection is via `pg` + `@prisma/adapter-pg` and `DATABASE_URL`.
- Typed modules under `data/` for migrated families are **seed/reference only** after Phase 2.

## Stack

| Concern | Choice |
| --- | --- |
| ORM | Prisma 7 (`prisma/schema.prisma` + `prisma.config.ts`) |
| DB | PostgreSQL (`DATABASE_URL` pooled; optional `DIRECT_URL` for migrate) |
| Passwords | argon2id |
| Sessions | `AdminSession` rows + opaque HttpOnly cookie `smartlance_admin_session` |
| CSRF | Same-origin checks on mutating admin server actions |
| Preview | Session **or** short-lived HMAC cookie/token (`ADMIN_PREVIEW_SECRET`) |
| Revalidation | Targeted `revalidateTag(..., 'max')` + `revalidatePath` |

## Env vars

See `.env.example`: `DATABASE_URL`, `DIRECT_URL`, `ADMIN_SESSION_SECRET`, `ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_PASSWORD`, optional `ADMIN_PREVIEW_SECRET`.

## Entities (Phase 1–3)

**Auth / ops:** `AdminUser`, `AdminSession`, `AuditLog`, `ContentRevision`, `Redirect`, `SiteSettings`, `ContentImportMarker`, `AssetReference`, `ContentCuration`

**Phase 2 content:** `HomepageContent`, `Service`, `Solution`, `Platform`

**Phase 3 content:** `Topic`, `Industry` (+ `IndustryWork`), `WorkProject`, `Testimonial`, `Insight` (+ `InsightTopic`), `CmsResource` (+ `CmsResourceTopic`) for guide/comparison/checklist/glossary/template/tool

Insights are **not** duplicated as `CmsResource` rows — Resources hub adapts Insight records.

## AI Editorial Studio

Admin routes under `/admin/ai-writer` use `lib/ai/*` (providers, research, knowledge, editorial-service). Prisma models: `AIEditorialProject`, `AIEditorialRun`, `AIResearchSource`, `AIClaim`, `AIBrandVoice`, `AIWriterSettings`. See `AI_EDITORIAL_ARCHITECTURE.md`.

## AI Content Assistants (Phases A–E)

Specialized CMS assistants for **Service**, **Solution**, **Platform**, **Industry**, **Work (Case Study)**, **Testimonial**, **Resource subtypes** (Guide, Comparison, Checklist, Glossary, Template, Tool Copy), and **Homepage Copy**. Shared proposal/run models: `AIContentProposal`, `AIContentRun`. Modules under `lib/ai/content-assistants/`. Topic Intelligence commercial `UPDATE_*_PAGE`, `UPDATE_WORK_PAGE`, `UPDATE_HOMEPAGE`, and `EXPAND_EXISTING_RESOURCE` deep-link to matching editors (no Insight project by default). Homepage uses draftJson → preview → human publish. See `docs/AI_CONTENT_ASSISTANTS_FINAL_ARCHITECTURE.md` and `docs/HOMEPAGE_DRAFT_AND_AI.md`.

**Content Quality Audit:** `/admin/content-audit` — read-only published-content findings + improvement wave. See `docs/CONTENT_QUALITY_AUDIT_OPERATIONS.md`.

## Phase 4 operations entities

`MediaAsset`, `NavigationMenu` (+ optional `NavigationItem`), expanded `SiteSettings`, `ManagedPage`, `LinkHealthRun` / `LinkHealthIssue`, `Redirect.origin`

Admin modules: `/admin/media`, `/admin/navigation`, `/admin/redirects`, `/admin/settings`, `/admin/seo`, `/admin/link-health`, `/admin/system`

Public layout consumes `getPublicNavigation()` + `getPublicSettings()` with typed fallbacks until Phase 4 import.

See `MEDIA_ARCHITECTURE.md`, `SITE_SETTINGS.md`, `SEO_OPERATIONS.md`, `LINK_HEALTH.md`, `PHASE_4_COMPLETION.md`.

## Phase 5 enquiry operations

Models: `Enquiry`, `EnquiryNote` with enums `EnquiryType`, `EnquiryStatus`, `NotificationStatus`.

Public flow: validate → abuse checks → **persist** → attempt notification → record delivery status. Admin is the operational interface; email is a notification channel.

Service: `lib/enquiries/service.ts` (private). Admin routes under `/admin/enquiries`. Docs: `ENQUIRY_OPERATIONS.md`, `ENQUIRY_PRIVACY.md`, `PHASE_5_COMPLETION.md`.

## Production hardening

See `PRODUCTION_HARDENING_REPORT.md`, `PRODUCTION_DEPLOYMENT.md`, `DISASTER_RECOVERY.md`, `ENVIRONMENT.md`. Env validation: `lib/env.ts` / `instrumentation.ts`.

## Publishing flow

1. **Save Draft** → `status=DRAFT`, `ContentRevision`, audit  
2. **Preview** → `/admin/preview/{entity}/{id}` (noindex)  
3. **Publish** → `PUBLISHED` + `publishedAt`, revision, audit, revalidate tags/paths  
4. **Unpublish** → `ARCHIVED` (hidden from public + sitemap)  
5. **Slug change** (publish capability) → uniqueness check → `Redirect` 301 → revalidate old + new

Cache tag examples: `homepage`, `service:{slug}`, `services-hub`, `solution:{slug}`, `platform:{slug}`, `sitemap`.

## Admin routes (only)

`/admin/login`, `/admin`, content family editors, `/admin/media`, `/admin/navigation`, `/admin/redirects`, `/admin/settings`, `/admin/seo`, `/admin/link-health`, `/admin/system`, `/admin/enquiries` (+ contact/reviews), `/admin/users`, `/admin/audit-log`, `/admin/preview/...`

## Public reads

| Surface | Source |
| --- | --- |
| `/`, homepage sections | `homepageRepository` |
| `/services`, `/services/[slug]` | `servicesRepository` |
| `/solutions`, `/solutions/[slug]` | `solutionsRepository` |
| `/platforms`, `/platforms/[slug]` | `platformsRepository` |
| Sitemap (those families) | published list helpers |

Middleware protects `/admin/*` (except login) and applies DB redirects for `/services|solutions|platforms/*` via `/api/internal/redirect-lookup`.

> Next.js 16 uses `proxy.ts` (not `middleware.ts`) for this request gate.

## Scripts

```bash
npx prisma migrate deploy   # or npm run db:migrate
npm run admin:bootstrap     # first SUPER_ADMIN from env
npm run db:seed             # import typed data
npm run build               # runs prisma generate then next build
```
