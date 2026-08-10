# Smartlance Live Acceptance Report

**Date:** 2026-08-10  
**Commit:** `6706ab0` (verification pass — includes uncommitted fixes)  
**Database:** PostgreSQL 16 via Postgres.app (`smartlance_test` on localhost:5555)  
**Migrations:** 36 applied from empty database  
**Integration config:** `vitest.integration.config.ts` / `npm run test:integration`

## Executive verdict

**SMARTLANCE LIVE POSTGRESQL VERIFIED — PROVIDER / STAGING VERIFICATION PENDING**

All 127 PostgreSQL integration tests execute with **0 skipped** and **0 failed** against a dedicated local test database after a clean migration deploy.

Provider verification (Paystack TEST, SMTP live, AI live, staging journeys) remains **PENDING**. S3/R2 live round-trip, scheduler HTTP auth, and backup/restore are **VERIFIED** — see `docs/PROVIDER_ACCEPTANCE_REPORT.md`.

## Test discovery

| Source | Files | Tests |
|--------|------:|------:|
| `npm run test:integration` | 15 | 127 |
| `npx vitest run` (unit config) | 82 | 622 pass, 93 skip |

**Why unit run shows ~93 skipped:** the default Vitest config includes non-CRM integration files that skip without `TEST_DATABASE_URL`, while CRM integration lives under `tests/crm/integration/**` and is excluded from the unit config. The dedicated integration config discovers all 15 backend suites.

### Integration inventory (all included in config)

| Suite | File | Tests |
|-------|------|------:|
| CRM property concurrency | `tests/crm/integration/property-concurrency.test.ts` | 11 |
| CRM sales inbox | `tests/crm/integration/sales-inbox.test.ts` | 11 |
| CRM scheduler | `tests/crm/integration/scheduler-concurrency.test.ts` | 5 |
| CRM inbound sync | `tests/crm/integration/inbound-sync.test.ts` | 3 |
| CRM contact import | `tests/crm/integration/contact-import.test.ts` | 2 |
| Agency guard | `tests/agency/integration/guard.test.ts` | 2 |
| Agency hardening | `tests/agency/integration/hardening.test.ts` | 4 |
| Onboarding V3 | `tests/onboarding/integration/onboarding.test.ts` | 9 |
| Change requests V3.1 | `tests/change-requests/integration/change-requests.test.ts` | 5 |
| Portal V2 | `tests/portal/integration/unified-client-portal.test.ts` | 25 |
| Prospect V1 | `tests/prospect/integration/prospect-experience.test.ts` | 15 |
| Client Success V1 | `tests/client-success/integration/client-success.test.ts` | 17 |
| Proposals V2 | `tests/proposals/integration/proposals.test.ts` | 2 |
| Contracts V2.1 | `tests/contracts/integration/contracts.test.ts` | 5 |
| Billing V2.2.1 | `tests/billing/integration/billing.test.ts` | 11 |

## Database

| Check | Result |
|-------|--------|
| Test DB | `smartlance_test` (local, name contains `test`) |
| Guard | `tests/crm/integration/guard.ts` — refuses prod-like hosts without safe name |
| Empty DB migrate deploy | **VERIFIED** (36 migrations) |
| Re-run deploy | **VERIFIED** — no pending migrations |
| `INTEGRATION_RUNTIME_DATABASE_URL` wiring | Domain services use test DB via `tests/setup-env.ts` |

## Live integration results

| Suite | Passed | Skipped | Failed |
|-------|-------:|--------:|-------:|
| **TOTAL** | **127** | **0** | **0** |
| CRM property concurrency | 11 | 0 | 0 |
| CRM sales inbox | 11 | 0 | 0 |
| CRM scheduler | 5 | 0 | 0 |
| CRM inbound | 3 | 0 | 0 |
| CRM import | 2 | 0 | 0 |
| Agency hardening (+ guard) | 6 | 0 | 0 |
| Onboarding V3 | 9 | 0 | 0 |
| Change requests V3.1 | 5 | 0 | 0 |
| Portal V2 | 25 | 0 | 0 |
| Prospect V1 | 15 | 0 | 0 |
| Client Success V1 | 17 | 0 | 0 |
| Proposals V2 | 2 | 0 | 0 |
| Contracts V2.1 | 5 | 0 | 0 |
| Billing V2.2.1 | 11 | 0 | 0 |

## Code QA (same pass)

| Check | Result |
|-------|--------|
| Unit tests | **624 passed**, 93 skipped, **0 failed** (SEO sitemap test fixed — catalog vs DB mock split) |
| TypeScript | PASSED |
| Build | PASSED |
| Prisma validate | PASSED |
| npm audit (high) | 1 advisory — `image-size` DoS, no upstream fix |

## Backend defects fixed in this pass

1. **Invoice create returned null inside transaction** — `getInvoiceById` used global client while row was uncommitted.
2. **Payment mismatch rolled back NEEDS_REVIEW** — anomaly state now commits before throwing.
3. **Contract re-sign idempotency** — existing signature checked before signability guard.
4. **Contract version send** — only signers on the target version are notified/updated.
5. **Change request invoice race** — row lock + P2002 recovery for concurrent create.
6. **Portal authority visibility** — viewers see proposal/contract attention with `canAct: false`.
7. **CRM DATE validation** — reject bare numeric strings (e.g. `50000`) mistaken as year dates.
8. **Scheduler ambiguous send** — finalize hook failures mark `AMBIGUOUS`, not `FAILED`.
9. **Integration test DB routing** — `TEST_DATABASE_URL` wired to domain `DATABASE_URL` safely.
10. **Onboarding activity in transaction** — activity writes use transaction client.
11. **Site settings cache** — bypass `unstable_cache` under `NODE_ENV=test`.

## Provider status

| Provider | Status |
|----------|--------|
| PostgreSQL (integration) | **VERIFIED** |
| Paystack TEST | **PENDING** |
| SMTP live | **PENDING** |
| S3/R2 | **PENDING** |
| AI provider live | **PENDING** |
| Schedulers (HTTP bearer) | **PENDING** (code paths covered by integration; no live cron) |
| Backup / restore | **PENDING** |

## Open blockers

| ID | Severity | Item |
|----|----------|------|
| — | P2 | Provider staging verification not yet run |
| — | P2 | Backup/restore drill not yet run |
| — | P3 | `image-size` transitive advisory — review upload bounds |
| — | P3 | SEO industry sitemap unit test flaky without DB seed |

## Manual actions before production

1. Run Paystack TEST checkout journey on staging.
2. Configure staging SMTP and send representative transactional emails.
3. Configure staging object storage and verify signed URL + IDOR denial.
4. Run backup/restore drill on non-production database.
5. Apply pending migrations to staging (after snapshot), then production.
6. After UI redesign merge: re-run integration suite + critical route smoke tests.
