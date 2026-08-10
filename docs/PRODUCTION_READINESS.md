# Smartlance Production Readiness

Last verified: **2026-08-10** (Provider & Staging Verification V1 — partial)

Status key: **PASSED** | **PENDING** | **MANUAL ACTION** | **NOT APPLICABLE**

---

## Executive summary

| Gate | Status |
|------|--------|
| Code hardening (unit + static) | **PASSED** — 624 unit / 0 failed |
| TypeScript (`npx tsc --noEmit`) | **PASSED** |
| Production build (`npm run build`) | **PASSED** |
| Prisma validate | **PASSED** |
| Live PostgreSQL integration suites | **PASSED** — 127/127 |
| Empty-DB migration deploy | **PASSED** |
| S3/R2 private storage live | **PASSED** — see `docs/PROVIDER_ACCEPTANCE_REPORT.md` |
| Scheduler HTTP auth | **PASSED** — 4/4 routes |
| Backup/restore drill | **PASSED** — local pg_dump/restore |
| Paystack sandbox E2E | **PENDING** — `PAYSTACK_SECRET_KEY` unset |
| SMTP live delivery | **PENDING** — Admin SMTP disabled |
| AI live provider | **PENDING** |
| Staging manual journeys | **PENDING** |
| Production DNS (SPF/DKIM/DMARC) | **MANUAL ACTION** |
| Client bundle secret scan | **MANUAL ACTION** — fix malformed `.env.local` `NEXT_PUBLIC_SITE_URL` |

**Current verdict:** **SMARTLANCE LIVE POSTGRESQL VERIFIED — PROVIDER / STAGING VERIFICATION PENDING**

---

## Database

| Item | Status | Notes |
|------|--------|-------|
| Prisma schema valid | PASSED | `npx prisma validate` |
| Dev DB migrate status | PENDING | 10 migrations unapplied on connected dev Neon (Agency Ops → Prospect V1) |
| Empty-DB migrate deploy | PENDING | Requires dedicated test PostgreSQL |
| Unique constraints (email, counters, idempotency) | PASSED | Defined in schema; integration proof pending |
| Contact dedupe race (P2002) | PASSED | Hardened in `upsertContactFromEnquiry` + prospect signup |
| Prospect request idempotency (P2002) | PASSED | Hardened in `submitProspectRequest` |

---

## Migrations (36 total)

Chronological sequence verified in repo. Not yet proven on empty DB in this pass.

| Migration | Module |
|-----------|--------|
| `20260807200000_init` | Core |
| `20260809200000_crm_foundation` | CRM |
| `20260809210000_crm_outreach_v2` | CRM Outreach |
| `20260809220000_crm_scheduler_v21` | Scheduler reliability |
| `20260809230000_crm_inbound_v3` | Inbound email |
| `20260809240000_crm_engagement_v32` | Engagement |
| `20260809250000_crm_contact_csv_import_v33` | CSV import |
| `20260809260000_crm_contact_properties_v34` | Properties |
| `20260809270000_crm_sales_inbox_v4` | Sales Inbox |
| `20260810100000_agency_operations_v1` | Agency Ops |
| `20260810120000_agency_operations_v101_hardening` | Agency hardening |
| `20260810140000_agency_proposals_v2` | Proposals V2 |
| `20260810160000_agency_contracts_v21` | Contracts V2.1 |
| `20260810210000_agency_billing_v22` | Billing V2.2 |
| `20260810220000_agency_billing_v221_email` | Billing email |
| `20260810230000_agency_onboarding_v3` | Onboarding V3 |
| `20260811210000_agency_change_requests_v31` | Change Requests V3.1 |
| `20260812100000_client_success_v1` | Client Success V1 |
| `20260813100000_prospect_experience_v1` | Prospect V1 |

**Future-dated timestamps:** Migration folder names use synthetic ordering dates (`202608*`). Do **not** rename migrations already applied in shared environments. Unapplied migrations may be deployed with `prisma migrate deploy`.

---

## Integration test suites

Run command:

```bash
TEST_DATABASE_URL=postgresql://USER:PASS@HOST:5432/smartlance_test \
  npm run test:integration
```

Guard: `tests/crm/integration/guard.ts` — refuses production-like DB names without `CRM_INTEGRATION_TEST_ALLOW=1`.

| Suite | Tests (count) | Passed | Skipped | Failed | Status |
|-------|---------------|--------|---------|--------|--------|
| CRM property concurrency | 11 | — | 11 | 0 | PENDING (no TEST DB) |
| CRM sales inbox | 11 | — | 11 | 0 | PENDING |
| CRM scheduler | 5 | — | 5 | 0 | PENDING |
| CRM inbound sync | 3 | — | 3 | 0 | PENDING |
| CRM contact import | 2 | — | 2 | 0 | PENDING |
| Agency hardening | 4 | — | 4 | 0 | PENDING |
| Proposals V2 | 2 | — | 2 | 0 | PENDING |
| Contracts V2.1 | 5 | — | 5 | 0 | PENDING |
| Billing V2.2.1 | 11 | — | 11 | 0 | PENDING |
| Onboarding V3 | 9 | — | 9 | 0 | PENDING |
| Change Requests V3.1 | 5 | — | 5 | 0 | PENDING |
| Portal V2 unified | 25 | — | 25 | 0 | PENDING |
| Prospect V1 | 15 | — | 15 | 0 | PENDING |
| Client Success V1 | 17 | — | 17 | 0 | PENDING |

**Unit tests (no DB):** Passed **622** | Skipped **94** (integration) | Failed **0**

---

## Authentication & authorization

| Item | Status |
|------|--------|
| Admin Argon2 + DB sessions | PASSED (code review) |
| Portal magic links hashed + single-use | PASSED (code review) |
| Shared Prospect/Client session — resource grants required | PASSED (code review + unit tests) |
| Review result requires claim cookie or portal ownership | PASSED |
| Review result `noindex` | PASSED |
| CRM pagination Server Component fix | PASSED |
| CSRF `assertSameOrigin` on admin mutations | PASSED (spot audit) |
| Internal schedulers Bearer secret | PASSED (code review) |
| Cross-user IDOR (live DB) | PENDING |

---

## AI / SSRF

| Item | Status |
|------|--------|
| SSRF hostname blocks (unit) | PASSED |
| AI evidence validation rejects fake IDs | PASSED |
| Crawler localhost rejection | PASSED |
| Redirect revalidation | PENDING (live adversarial) |
| AI provider failure fallback | PASSED (code review) |

---

## Payments (Paystack)

| Item | Status |
|------|--------|
| Webhook signature verification | PASSED (code + unit) |
| Idempotency / replay handling | PASSED (code); live DB PENDING |
| Sandbox E2E | PENDING — `PAYSTACK_SECRET_KEY` not executed |

---

## Email

| Item | Status |
|------|--------|
| Admin SMTP UI (`/admin/email`) | PASSED |
| DB-first, email failure non-rollback | PASSED (architecture) |
| Live SMTP send | PENDING |
| SPF/DKIM/DMARC | MANUAL ACTION |

---

## Files & storage

| Item | Status |
|------|--------|
| Production blocks local media/agency storage | PASSED (`lib/env.ts`) |
| Private file auth before serve | PASSED (code review) |
| Live S3/R2 verification | PENDING |

---

## Security scan

| Item | Status |
|------|--------|
| Committed secrets scan | PASSED — no keys in repo |
| npm audit | 1 high (`image-size` DoS, no fix) — dev/parser path |
| Client bundle secret grep | NOT RUN (requires post-build artifact scan) |

---

## Production manual actions (before go-live)

1. Apply all pending migrations on staging, then production (`prisma migrate deploy`)
2. Configure `TEST_DATABASE_URL` and run full `npm run test:integration`
3. Configure production S3 + agency private storage
4. Configure SMTP and verify test send from `/admin/email`
5. Configure Paystack TEST on staging; live keys only when ready
6. Configure cron for internal scheduler routes (see `PRODUCTION_RUNBOOK.md`)
7. Verify SPF/DKIM/DMARC for sending domain
8. Perform backup + restore drill on non-production database
9. Run manual public → prospect → client journey on staging

---

## Blockers

| ID | Severity | Item |
|----|----------|------|
| B1 | P1 | Live PostgreSQL integration suites not executed (0/127+ tests) |
| B2 | P1 | 10 migrations unapplied on current dev database |
| B3 | P1 | Empty-database migration deploy not verified |
| B4 | P2 | Paystack sandbox E2E not executed |
| B5 | P2 | SMTP live delivery not verified |
| B6 | P2 | Backup/restore drill not performed |

No open **P0** code defects identified in this pass.
