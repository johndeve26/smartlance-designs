# Media Sync Operations

Phase 5 adds **static media indexing** — reconciling known repository files into `MediaAsset` metadata rows.

This is separate from R2 migration (`npm run media:migrate:r2`).

## What sync does

1. Discover files under `public/images/**` and `public/og/**`
2. Normalize public paths (`/images/...`, `/og/...`)
3. Upsert `MediaAsset` rows with `sourceType = STATIC_EXISTING`
4. Fill missing safe metadata (byte size, dimensions, MIME) when verifiable
5. Report missing static sources, invalid content references, conflicts, and errors

## What sync does not do

- Delete `MediaAsset` rows or static files
- Rewrite content URLs in Work, Insights, Homepage, etc.
- Publish or unpublish content
- Upload/copy objects to R2
- Create Work/Insight/Testimonial records from discovered files

## Commands

```bash
# Preview changes (no DB writes)
npm run media:sync:static -- --dry-run

# Apply sync
npm run media:sync:static

# Apply sync and write inventory artifact
npm run media:sync:static -- --write-audit
```

Requires `DATABASE_URL`. Does **not** require R2 credentials.

## Dry run

Dry run reports counts for:

- files scanned
- rows that would be created / updated / left unchanged
- missing static sources (indexed row, file absent)
- invalid content references
- per-item errors

No audit log entry is written on dry run.

## Idempotency

Running sync twice must not create duplicate rows. Matching uses deterministic `storageKey`:

`static:/images/projects/example.webp`

## Admin action

**Admin → Media → Sync static media**

- Permission: `manage_media`
- Same-origin enforced on server action
- Dry run available in UI
- Last sync time from audit log action `media.sync_static`

Copy shown to admins:

> Indexes repository assets into MediaAsset rows. Reconciles metadata only — does not delete media or rewrite content URLs.

## Inventory artifact

`npm run media:sync:static -- --write-audit` writes:

`docs/audit-artifacts/media-reference-audit.json`

Contains aggregate inventory only — no secrets, signed URLs, or PII.

## Production precautions

- Take a DB backup before first production sync (standard CMS checklist).
- Review dry-run output before mutating production.
- Re-run sync after adding new static project assets.
- Broken content references are reported, not guessed or auto-repaired.

## Delete safety integration

`findMediaUsages()` scans published and draft references across:

- Work (including `caseStudyContent`, `draftJson`)
- Homepage (including draft)
- Insights, Testimonials, Services, Solutions, Platforms, Industries
- CMS Resources, Managed pages, Site settings, AssetReference

Permanent delete remains blocked while references exist.

## Manual verification checklist

1. `npm run media:sync:static -- --dry-run`
2. Inspect proposed row changes
3. `npm run media:sync:static`
4. Re-run sync — expect zero new creates
5. Verify Pàdéyá and Freelance OS case studies still render
6. Verify Homepage Work, Insights, Testimonials imagery
7. Review unresolved references in audit artifact if generated
