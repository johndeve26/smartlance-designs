# Smartlance Provider Acceptance Report

**Date:** 2026-08-10  
**Commit:** `6706ab0` (+ uncommitted verification pass)  
**Environment:** Local dev with `.env.local` staging credentials (names only below)  
**Harness:** `npx tsx scripts/run-provider-staging-verification.ts`  
**Artifact:** `docs/audit-artifacts/provider-staging-verification.json`

---

## Executive verdict

**SMARTLANCE LIVE POSTGRESQL VERIFIED — PROVIDER / STAGING VERIFICATION PENDING**

PostgreSQL integration (127/127) and unit suite (624/0 failed) remain green. Real provider boundaries partially verified on this machine:

| Provider | Status | Evidence |
|----------|--------|----------|
| PostgreSQL | **VERIFIED** | 127 integration tests; empty DB → 36 migrations |
| S3 / R2 (private agency storage) | **VERIFIED** | Live upload, head, download, signed URL fetch (200), delete on Cloudflare R2 |
| SMTP | **PENDING** | Admin `EmailSettings.enabled=false`; env SMTP unset |
| Paystack TEST | **PENDING** | `PAYSTACK_SECRET_KEY` unset locally |
| AI live | **PENDING** | No enabled Admin AI provider account |
| HTTP schedulers | **HTTP VERIFIED** / **CRON PENDING** | All 4 routes reject missing/wrong Bearer; accept correct Bearer |
| Backup / restore | **VERIFIED** | `pg_dump` → restore to `smartlance_restore_verify`; row counts + latest migration confirmed |
| Staging journeys | **PENDING** | Requires deployed staging + UI merge regression |
| Client secret scan | **P0 LOCAL CONFIG** | Malformed `NEXT_PUBLIC_SITE_URL` in `.env.local` leaked `DATABASE_URL` into client bundle — **manual fix required** |

---

## Unit QA

| Metric | Result |
|--------|--------|
| Command | `npx vitest run` |
| Passed | **624** |
| Skipped | **93** |
| Failed | **0** |

**Fix applied:** `tests/seo/industry-routes.test.ts` — split sitemap expectations into catalog vs DB paths with mocks (stale expectation, not sitemap regression).

---

## PostgreSQL baseline

| Check | Result |
|-------|--------|
| Integration | **127 passed, 0 skipped, 0 failed** |
| Migrations | **36** — dev Neon **up to date** (`prisma migrate status`) |
| Empty DB deploy | Verified in prior pass on `smartlance_test` |

---

## S3 / R2

**Driver:** `MEDIA_STORAGE_PROVIDER=s3` (Cloudflare R2 endpoint configured)

| Test | Result |
|------|--------|
| Config validation | PASS |
| Authorized upload | PASS — object created, byte size matches |
| Head / stat | PASS |
| Download | PASS — buffer matches |
| Signed URL generation | PASS — TTL **600s** (10 min) |
| Signed URL fetch | PASS — HTTP 200 |
| Signed URL expiry | PENDING — manual re-fetch after 10 min |
| Delete | PASS — object gone |
| IDOR / same-company / revocation | PASS via integration suites (`onboarding`, `client-success`, `portal`) |
| DTO privacy (`storageKey`, bucket) | PASS — not exposed in portal/prospect DTOs |
| MIME / content-disposition | PASS — existing restrictions unchanged (unit + integration) |
| Failure with bad config | PENDING — not run (would require isolated env) |

**Storage backup note:** DB restore does **not** restore R2 objects. R2 versioning/retention is operator-managed (document in runbook).

---

## SMTP

| Test | Result |
|------|--------|
| Admin EmailSettings | SKIP — `enabled=false` |
| Env SMTP (`SMTP_HOST`, etc.) | SKIP — unset |
| Resend fallback | SKIP — unset |
| Live delivery | PENDING |
| Transactional types (magic link, invoice, etc.) | PENDING |
| SPF / DKIM / DMARC | PENDING — manual DNS |

**Action:** Enable Admin SMTP on staging or set env SMTP; send controlled tests via `/admin/email`.

---

## Paystack TEST

| Test | Result |
|------|--------|
| Config | SKIP — `PAYSTACK_SECRET_KEY` unset |
| Portal checkout journey | PENDING |
| Webhook signature / replay / race | PENDING (integration suite covers logic when key present) |
| Amount authority | PASS in integration tests |

**Action:** Set `sk_test_*` on staging; register webhook to `/api/webhooks/payments/paystack`.

---

## AI

| Test | Result |
|------|--------|
| Admin provider account | SKIP — none enabled |
| Free website review live | PENDING |
| Brief AI assist | PENDING |
| Prompt injection / fallback | PENDING |

---

## Schedulers

| Route | Secret env | Auth (no/wrong/correct Bearer) |
|-------|------------|----------------------------------|
| `POST /api/internal/crm-sequence-scheduler` | `CRM_SCHEDULER_SECRET` | 403 / 403 / 200 |
| `POST /api/internal/crm-inbound-email-sync` | `CRM_INBOUND_SYNC_SECRET` | 403 / 403 / 200 |
| `POST /api/internal/agency-billing-scheduler` | `AGENCY_BILLING_SCHEDULER_SECRET` | 403 / 403 / 200 |
| `POST /api/internal/agency-onboarding-scheduler` | `AGENCY_ONBOARDING_SCHEDULER_SECRET` | 403 / 403 / 200 |

**External cron:** PENDING MANUAL CONFIGURATION on hosting.

Comparison uses `timingSafeEqual` (constant-time).

---

## Backup / restore

| Step | Result |
|------|--------|
| Method | `pg_dump --no-owner --no-acl` from `smartlance_test` |
| Restore target | New DB `smartlance_restore_verify` |
| Dump size | ~759 KB |
| Sample counts | CrmContact 17, AgencyInvoice 13, AgencyProject 4 |
| Latest migration | `20260813100000_prospect_experience_v1` |
| Counter continuity post-restore | PENDING — not exercised on restore DB |

---

## Staging migrations

Dev Neon: **36 migrations, schema up to date** (prior “10 pending” report is stale).

---

## Security

### Production env hard-fail

`validateServerEnv` + `instrumentation.ts` hard-fail on Vercel production when:

- `MEDIA_STORAGE_PROVIDER=local` without override
- Agency private storage not S3
- Short/missing `ADMIN_SESSION_SECRET`
- Invalid `NEXT_PUBLIC_SITE_URL`

**New guard:** rejects `NEXT_PUBLIC_SITE_URL` containing `DATABASE_URL` or `postgresql://` (malformed `.env` line breaks).

### Client bundle secret scan

**Finding (P0 — local config):** `.env.local` has `NEXT_PUBLIC_SITE_URL` concatenated with `DATABASE_URL` on the same line (missing newline). Production build inlined the combined value into `.next/static` chunks.

**Required manual actions:**

1. Fix `.env.local` — one variable per line; `NEXT_PUBLIC_SITE_URL` must be origin only.
2. Rotate Neon DB credentials (exposure via local build artifact).
3. Re-run build + secret scan after fix.

### npm audit

| Severity | Count | Notes |
|----------|------:|-------|
| High | 1 | `image-size` ICNS DoS — no upstream fix |
| Residual risk | — | Mitigated: HEIF/`mif1` excluded; upload MIME/size bounds in `lib/media/validation.ts` |

---

## Environment inventory (names only)

### Required production

`DATABASE_URL`, `DIRECT_URL`, `ADMIN_SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL`, `MEDIA_STORAGE_PROVIDER=s3`, `MEDIA_S3_*` or `AGENCY_S3_*`, `AI_SECRETS_ENCRYPTION_KEY` (or fallback), scheduler secrets, `PAYSTACK_SECRET_KEY` (live only at go-live), email transport (Admin SMTP or Resend).

### Required staging

Same as production except Paystack **test** key and staging canonical host.

### Optional

`CRM_*`, `CONTACT_*`, `TAVILY_API_KEY`, env LLM fallbacks, `MEDIA_MAX_UPLOAD_MB`.

### Test only

`TEST_DATABASE_URL`, `INTEGRATION_RUNTIME_DATABASE_URL`, `NEXT_PUBLIC_SHOW_DRAFT_CONTENT`.

---

## Blocker classification

| ID | Severity | Item |
|----|----------|------|
| B-1 | **P0** | Malformed `NEXT_PUBLIC_SITE_URL` in local `.env.local` — rotate DB creds, fix file |
| B-2 | **P1** | SMTP not configured — transactional email blocked |
| B-3 | **P1** | Paystack TEST not configured for staging checkout |
| B-4 | **P1** | AI provider not enabled for live review path |
| B-5 | **P1** | Staging E2E journeys not executed |
| B-6 | **P2** | External scheduler cron not configured |
| B-7 | **P2** | SPF/DKIM/DMARC DNS pending |
| B-8 | **P3** | Signed URL expiry manual check; `image-size` advisory |

---

## Manual production go-live actions

1. Fix/validate all env vars (especially `NEXT_PUBLIC_SITE_URL` line integrity).
2. Production DB snapshot → `prisma migrate deploy`.
3. Production R2 bucket + credentials; confirm private ACL.
4. Production SMTP + DNS auth.
5. Paystack **live** keys + webhook registration (only when ready).
6. Scheduler cron with Bearer secrets on hosting.
7. HTTPS + canonical host smoke test.
8. Post-UI-merge: rerun 127 integration + unit + build + staging journeys.

---

## UI merge status

UX/UI Redesign V1.2 parallel branch — **not merged**. Post-merge regression required before final verdict.

**Backend changes this pass (document in `docs/UI_BACKEND_HANDOFF.md`):**

- SEO unit test mocks only (no runtime change).
- `lib/env.ts` — malformed `NEXT_PUBLIC_SITE_URL` guard.
- `scripts/run-provider-staging-verification.ts` — new harness.

---

## Final verdict

**SMARTLANCE LIVE POSTGRESQL VERIFIED — PROVIDER / STAGING VERIFICATION PENDING**

S3/R2 private storage, scheduler HTTP auth, and backup/restore are verified with real execution. SMTP, Paystack TEST, AI live, staging journeys, and production env hygiene remain open before **SMARTLANCE BACKEND PRODUCTION VERIFIED**.
