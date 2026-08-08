# Production deployment

Canonical deploy path for Smartlance Designs Admin Manager (Phases 1–5 complete).

## Principles

- **Never** use `prisma migrate reset`, drop database, or full reseed as normal deploy steps.
- Canonical migration: `npx prisma migrate deploy` (or `npm run db:migrate`).
- Do **not** auto-run Phase 3/4 content imports on every deploy — they are **one-time** (marker-gated) and `--force` is exceptional.
- Do not claim zero-downtime unless the host + DB strategy guarantees it.

## Pre-deploy

1. Verify Postgres backups / PITR are enabled on the Neon (or host) plan — check the provider console; do not assume.
2. Verify object-storage backups/versioning separately (DB backup does **not** protect media binaries).
3. Confirm production env (see `ENVIRONMENT.md` + `.env.example`).
4. Confirm `MEDIA_STORAGE_PROVIDER=s3` (or compatible) — local storage is blocked in production.
5. Confirm `ADMIN_SESSION_SECRET` (≥32 chars) and `NEXT_PUBLIC_SITE_URL` = real production origin.
6. Take/verify a backup before major schema migrations.

## Deploy sequence

1. Deploy code that is compatible with the **current** schema (or plan expand-then-contract).
2. Run: `npx prisma migrate deploy`
3. If migration fails halfway: **stop**, inspect `_prisma_migrations`, do not force blindly — see `DISASTER_RECOVERY.md`.
4. One-time only (if markers missing):
   - `npm run admin:bootstrap` (no-ops if admins exist)
   - `npm run db:seed` / `content:import:phase3` / `content:import:phase4` **only when initializing**
5. Verify Admin login + System status.
6. Verify Site Settings (contact, canonical host, form toggles).
7. Run SEO + Link Health in Admin.
8. Spot-check redirects, media upload, one Contact + one Review test.
9. `BASE_URL=https://<prod> npm run smoke:public` (read-only).

## Rollback

- Code rollback after an additive Prisma migration is usually safe if new columns are optional/defaulted.
- If a migration is not backward-compatible, **do not** roll code back onto the new schema without a documented repair — treat as DR.
- Phase 5 enquiry migration is additive (`Enquiry`, `EnquiryNote`, enums).

## Post-deploy smoke (manual mutations)

Do **not** automate mutation tests against production. Manually:

- [ ] Publish a harmless draft → confirm public update
- [ ] Upload one media asset
- [ ] One Contact submission → Admin + notification
- [ ] One Website Review → Admin + notification

## Scheduled maintenance

- `npm run admin:prune-sessions` (daily/weekly) — expired session cleanup
