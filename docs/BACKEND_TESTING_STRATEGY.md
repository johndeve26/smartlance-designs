# Backend Testing Strategy

How critical backend behavior is tested, what is deliberately not tested, and the canonical commands.

**Current state:** 311 tests across 28 files, all passing. Runner is Vitest in a Node environment.

---

## Canonical commands

| Purpose | Command |
|---|---|
| Unit + security regression tests | `npm test` |
| Single file | `npx vitest run tests/admin/backend-security-regressions.test.ts` |
| Watch mode | `npx vitest` |
| Typecheck | `npx tsc --noEmit` |
| Lint | `npm run lint` |
| Production build | `npm run build` |
| Schema validation | `npx prisma validate` |
| Dependency vulnerabilities | `npm audit` |

Run before any backend merge: `npm test && npx tsc --noEmit && npm run lint && npm run build`.

---

## Test database safety

There is **no integration test suite that connects to a database**, by design. Every test that touches a repository mocks `@/lib/db` with `vi.doMock`, so no test can reach `DATABASE_URL` — including a production one that happens to be in the developer's shell.

`tests/setup-env.ts` pins `NEXT_PUBLIC_SITE_URL` to the production canonical origin so that SEO and metadata assertions do not depend on a developer's local `.env.local`.

**If a real integration suite is added later,** it must gate on an explicit `TEST_DATABASE_URL` and refuse to run against `DATABASE_URL`. Do not relax the current mocking convention without that guard in place.

---

## The pyramid

### Unit — deterministic logic

Pure functions with no I/O. The largest and fastest layer.

| Area | Coverage |
|---|---|
| RBAC capability resolution | `tests/admin/rbac.test.ts` |
| Session token, preview token, cookie options | `tests/admin/crypto.test.ts` |
| SSRF host classification | `tests/admin/backend-security-regressions.test.ts` |
| URL safety, slug normalisation | `tests/admin/phase4-ops.test.ts` |
| Upload validation — magic bytes, extension match, size, SVG | `tests/admin/phase4-ops.test.ts` |
| CSV escaping | `tests/admin/phase5-enquiries.test.ts` |
| Env validation rules | `tests/admin/hardening.test.ts` |
| AI field allowlists and protected fields | `tests/ai/content-assistants-phase-*.test.ts` |
| Platform Selector scoring scenarios | preserved deterministic scenario tests |
| SEO metadata, sitemap, structured data | `tests/seo/**` |

### Integration — repository behavior with a mocked database

Verifies query shape, guard ordering, and side-effect sequencing without a live database.

| Area | Coverage |
|---|---|
| Last-Super-Admin guard, isolation level | `backend-security-regressions.test.ts` |
| Slug-change redirect behavior | `backend-security-regressions.test.ts` |
| Redirect loop detection | `phase4-ops.test.ts` |
| Draft vs publish separation | `draft-publish.test.ts` |
| Revalidation tags on publish | `publishing-tags.test.ts` |
| Enquiry lifecycle | `phase5-enquiries.test.ts` |

### Security regression — one test per confirmed audit finding

`tests/admin/backend-security-regressions.test.ts` exists so that each fixed vulnerability stays fixed. Every block names the concrete failure it locks out.

| Finding | Assertion |
|---|---|
| BE-01 SSRF | IPv4-mapped IPv6 loopback, RFC1918, and metadata addresses are blocked; `::` is blocked; previously covered targets still blocked; public IPv6 and non-private ranges are not over-blocked |
| BE-02 Super Admin lockout | Count runs on the transaction client at `Serializable`; demote and disable both refused when one Super Admin remains |
| BE-03 Redirect loop | Self-redirect not written; reclaimed live path set to `DISABLED`; chains collapse forward |
| BE-05 Timeouts | Composed signal aborts on caller abort and on timeout |
| BE-06 Login enumeration | Rejection path performs Argon2 work |

### End-to-end

None currently. No E2E framework is installed, and one was not introduced for this audit. The build plus route-level tests cover rendering; genuine browser E2E for login → draft → preview → publish would be a worthwhile future addition but is a separate decision.

---

## What is deliberately not tested

Honest gaps, so nobody assumes coverage that does not exist.

| Gap | Reason |
|---|---|
| Real database constraint enforcement | No test database is configured. Unique constraints are verified by schema review, not by an insert that fails. |
| Real HTTP CSRF behavior | `assertSameOrigin` is verified by source review. Testing it needs a request-level harness. |
| Actual concurrency for the Super Admin guard | The test asserts the isolation level and guard placement. Proving that Postgres aborts the losing transaction requires two real connections. |
| Live provider failure paths | Provider adapters are exercised through heuristic fallback rather than by simulating Tavily or OpenAI outages. |
| Media upload end to end | Validation is unit-tested; the storage adapter round trip is not. |
| Rate limiter under real load | Limiter logic is reviewed, not load-tested. Per-instance behavior is documented as an accepted risk. |

---

## Coverage philosophy

Coverage percentage is not a target. Priority order:

1. **Security boundaries** — authentication, authorization, SSRF, allowlists.
2. **Data integrity** — uniqueness, guards, redirect correctness.
3. **Business-critical mutations** — publish, slug change, enquiry persistence.
4. **Failure paths** — provider down, email down, invalid model output.

A test earns its place by describing a failure that would actually hurt. Tests that merely restate the implementation are not worth their maintenance cost.

---

## Adding a regression test for a new finding

1. Write the test first and watch it fail against the unfixed code. The audit did this for BE-01, where the pre-fix probe showed `[::ffff:169.254.169.254]` was allowed.
2. Fix the code.
3. Confirm the test passes and the full suite is still green.
4. Comment the test with the concrete failure it prevents, not with what the code does.
