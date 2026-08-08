# Backend Audit Report

**Scope:** security, database, auth, RBAC, API, Server Actions, AI, CMS, performance, reliability.
**Method:** source review of the actual implementation, empirical probes of security helpers, regression tests, full QA run.
**Verdict:** **BACKEND READY WITH MANUAL ACTIONS** — see [Manual production actions](#manual-production-actions).

No production data was read, mutated, or deleted. No migrations were created or applied. No secrets were rotated.

---

## Executive summary

The backend is in good structural shape. Authentication uses Argon2id with database-backed, hashed, server-expiring sessions; RBAC is enforced server-side in every Server Action; the AI proposal system has a genuinely strong field-allowlist architecture that keeps models away from publication status, verification flags, and proof data; public forms persist before they notify, so an email outage cannot lose an enquiry.

Four confirmed defects were found and fixed, plus five hardening gaps. The most serious were an SSRF filter bypass that reached cloud metadata endpoints, a race in the last-Super-Admin guard that could lock everyone out of the admin, and a redirect bug that could take a published page offline behind an infinite redirect.

The remaining risk is concentrated in two accepted architectural properties: publishing is not transactional, and rate limiting is per-instance in memory. Both are documented below with the conditions under which they matter.

| Severity | Count | Status |
|---|---|---|
| Critical | 0 | — |
| High | 3 | Fixed, regression-tested |
| Normal | 6 | 5 fixed, 1 documented |
| Low / Info | 7 | Documented |

---

## Architecture inventory

| Layer | Implementation |
|---|---|
| Runtime | Next.js App Router (Next 16 proxy), Node.js runtime, Vercel |
| Database | PostgreSQL |
| ORM | Prisma, singleton client via `lib/db.ts` |
| Auth | Custom email + password, Argon2id (`lib/admin/crypto.ts`) |
| Sessions | Database-backed `AdminSession`, SHA-256 peppered token hash, 14-day TTL |
| RBAC | 4 roles × 23 capabilities (`lib/admin/rbac.ts`) |
| API routes | 5 (`app/api/**`) plus `app/indexnow-key.txt/route.ts` |
| Server Actions | 11 `"use server"` modules, 115 exported actions |
| Repositories | `lib/repositories/**` — one per content family |
| Validation | Zod (`lib/validations.ts`, per-route schemas) |
| Email | Resend HTTP API and/or generic webhook |
| Media | Pluggable adapter: S3-compatible in production, filesystem in dev |
| AI providers | OpenAI-compatible, Anthropic; keys AES-256-GCM encrypted at rest |
| Research | Tavily (optional), GNews, NewsAPI, RSS |
| Webhooks (inbound) | **None** |
| Scheduled jobs / cron | **None** |
| Payments | **None** |
| Cache | Next `revalidatePath` / `revalidateTag` |
| Rate limiting | In-process sliding window (`lib/forms.ts`) |
| Audit logging | `AuditLog` via `lib/repositories/auditRepository.ts` |
| SEO server | canonical origin, sitemap, robots, structured data, IndexNow (opt-in, currently unwired) |

---

## Confirmed findings

### BE-01 · HIGH · SSRF filter bypass via IPv4-mapped IPv6 — **FIXED**

**Component:** `lib/ai/ssrf.ts`

**Current behavior (before fix):** `isPrivateOrReservedHostname` checked dotted-quad IPv4 and IPv6 prefixes `fc`/`fd`/`fe80`, but not IPv4-mapped IPv6. The WHATWG URL parser rewrites `::ffff:169.254.169.254` to `::ffff:a9fe:a9fe`, which matched none of the rules.

**Risk:** Server-side request forgery to loopback, RFC1918 ranges, and — most seriously — the AWS/GCP link-local metadata endpoint at `169.254.169.254`, which can return instance credentials. Reachable from admin-supplied research source URLs.

**Evidence:** Direct probe before the fix:

```
ALLOWED  http://[::ffff:127.0.0.1]/         hostname=[::ffff:7f00:1]
ALLOWED  http://[::ffff:10.0.0.1]/          hostname=[::ffff:a00:1]
ALLOWED  http://[::ffff:169.254.169.254]/   hostname=[::ffff:a9fe:a9fe]
ALLOWED  http://[::]/                       hostname=[::]
```

Note the same probe confirmed decimal/hex/short-form IPv4 (`http://2130706433/`, `http://127.1/`) were **already** blocked, because the URL parser normalises them to `127.0.0.1`. Those were not vulnerable.

**Fix:** Decode IPv4-mapped and IPv4-compatible IPv6 (both dotted and compressed-hextet forms) and run the decoded address through the IPv4 private-range rules; block the unspecified address `::`; widen the IPv6 prefix rule to `fc`/`fd`/`fe80`–`fe` site-local.

**Test added:** `tests/admin/backend-security-regressions.test.ts` — blocks all mapped forms, still blocks previously covered targets, and does not over-block public IPv6 (`2606:4700:4700::1111`), `172.32.0.0`, `192.169.0.0`, or `100.128.0.0`.

---

### BE-02 · HIGH · Last-Super-Admin guard is racy — **FIXED**

**Component:** `lib/repositories/adminUsersRepository.ts`

**Current behavior (before fix):** `updateAdminUser` counted active Super Admins with a standalone `prisma.adminUser.count()` and then issued the `update()` outside any transaction.

**Risk:** With exactly two active Super Admins, two concurrent demote/disable requests each observe a count of 2, both pass the guard, and both writes land — leaving **zero** active Super Admins. `manage_users` is exclusive to `SUPER_ADMIN`, so this is an unrecoverable administrative lockout requiring direct database access.

**Evidence:** The count at the old line 73 and the update at old line 88 had no isolation between them.

**Fix:** The count and the update now run inside `prisma.$transaction` with `Serializable` isolation, so Postgres aborts the losing transaction on the read-write conflict.

**Test added:** asserts the count is issued on the transaction client, that `isolationLevel` is `Serializable`, and that demote/disable are both refused when only one active Super Admin remains.

---

### BE-03 · HIGH · Slug rename-back takes a published page offline — **FIXED**

**Component:** `lib/repositories/redirectsRepository.ts` (`upsertSlugRedirect`), consumed by six content repositories.

**Current behavior (before fix):** `upsertSlugRedirect` wrote a redirect row with no self-redirect check and no awareness of existing rows. Manual redirects go through `detectRedirectLoop`; slug-change redirects did not.

**Risk:** Rename a published Service `a` → `b` (creates `/services/a → /services/b`), then rename back `b` → `a` (creates `/services/b → /services/a`). The entity now lives at `/services/a`, but the first redirect is still `ACTIVE`. `proxy.ts` applies DB redirects **before** the page renders, so `/services/a` bounces to `/services/b`, which bounces back — an infinite 301 loop that removes a live, indexed page from the site.

**Evidence:** `proxy.ts:200` calls `applyDbSlugRedirect` ahead of `NextResponse.next()`; `findActiveRedirect` matches on `sourcePath` with `status: "ACTIVE"` only.

**Fix:** `upsertSlugRedirect` now (a) returns without writing when source equals destination, (b) disables any `ACTIVE` redirect whose `sourcePath` equals the new destination, because that path is now live, and (c) repoints redirects that targeted the old path at the new destination, collapsing chains.

**Test added:** self-redirect is not written; the reclaimed live path is set to `DISABLED`; chains collapse onto the new destination.

---

### BE-04 · NORMAL · AI content-assistant actions skipped the same-origin check — **FIXED**

**Component:** `lib/admin/ai-content-assistant-actions.ts`

**Current behavior:** All ten other Server Action modules call `assertSameOrigin()` before mutating. This module's four actions — including `applyContentProposalAction` (writes CMS fields) and `generateContentProposalAction` (spends provider tokens) — called only `requireAdminUser`.

**Risk:** Defence-in-depth gap rather than a live hole, since Next.js applies its own Server Action origin check. If that check is ever misconfigured, a logged-in editor visiting a hostile page could be made to burn AI budget or apply a proposal.

**Fix:** Added `assertSameOrigin()` to all four actions. Coverage is now uniform across all 11 action modules.

---

### BE-05 · NORMAL · Six outbound calls had no timeout — **FIXED**

**Component:** `lib/forms.ts` (webhook, Resend), `lib/seo/indexnow.ts`, `lib/ai/research/index.ts` (Tavily), `lib/ai/topic-intelligence/providers/gnews.ts`, `.../newsapi.ts`

**Current behavior:** These `fetch` calls passed either no signal or only an optional caller signal that callers generally omitted. The LLM adapters and `safeFetchText` were already bounded (90s and 12s).

**Risk:** A hung upstream holds the serverless function open until the platform kills it. For the enquiry path this converts a slow email provider into a failed-looking submission; the record is already persisted by then, but the visitor sees an error.

**Fix:** Added `lib/ops/request-timeout.ts` with named budgets — notification 10s, indexing 8s, research 15s — and applied it to all six. `timeoutSignal` composes the caller's signal with the timeout so cancellation still works.

**Test added:** composed signal aborts on caller abort and on timeout expiry.

---

### BE-06 · NORMAL · Login leaked account existence through timing, and throttled by email only — **FIXED**

**Component:** `lib/admin/auth-actions.ts`, `lib/admin/session.ts`, `lib/admin/crypto.ts`

**Current behavior:** Unknown or disabled accounts returned before any Argon2 work, while valid accounts paid the full verification cost. The response text was already identical, but the latency difference was not. Rate limiting keyed on the submitted email only.

**Risk:** An unauthenticated attacker could enumerate valid admin emails by timing, and could attempt many passwords across many accounts without ever tripping a per-account limit.

**Fix:** `burnPasswordVerification` runs a real Argon2 verification against a throwaway hash on the rejection path. `isLoginAttemptBlocked` now applies a per-source-address limit (30 per 15 min) alongside the per-account limit (10 per 15 min).

**Caveat:** the proxy chain is not authenticated, so a spoofed `X-Forwarded-For` moves an attacker between IP buckets. The per-account limit still bounds each individual user, which is the control that matters for credential stuffing against a known email.

---

### BE-07 · NORMAL · AI proposal decisions were unvalidated client JSON — **FIXED**

**Component:** `lib/admin/ai-content-assistant-actions.ts`

**Current behavior:** `JSON.parse(decisionsJson) as FieldDecision[]` with no runtime validation. A non-array body threw a raw `TypeError` from the `for…of` in `applyProposalDecisions`.

**Risk:** Low — the downstream allowlist filter is the real protection and it held. But the unbounded array and unchecked shape violated the runtime-validation boundary the rest of the codebase maintains.

**Fix:** Zod envelope — array capped at 200 entries, `field` a 1–120 character string, `decision` restricted to the three literals. `editedValue` stays `unknown` by design, because an editor is allowed to hand-write any value for an allowlisted field.

---

### BE-08 · NORMAL · Media list endpoint accepted unvalidated enums and pagination — **FIXED**

**Component:** `app/api/admin/media/route.ts`

**Current behavior:** `status` was cast `as MediaAssetStatus` with no check, so `?status=BOGUS` reached Prisma and threw. Pagination relied entirely on downstream clamping.

**Fix:** Zod schema at the boundary, with enums derived from the generated Prisma enum objects so they cannot drift from the schema, and page/pageSize bounded explicitly. Invalid input now returns 400 instead of a 500.

---

### BE-09 · NORMAL · Unfixed `image-size` advisory was reachable via HEIF — **MITIGATED**

**Component:** `lib/media/validation.ts`, dependency `image-size`

**Current behavior:** `npm audit` reports one high-severity advisory in `image-size` with **no fix available**: infinite loops in the ICNS, JXL, and HEIF parsers (GHSA-w3rx-r6r6-pgpr, GHSA-5p2g-fcmc-qvqq).

**Reachability:** ICNS and JXL cannot reach the parser — magic-byte sniffing rejects them first. HEIF could: the sniffer treated the generic HEIF major brand `mif1` as AVIF, so a crafted `mif1` file passed validation and was handed to `imageSize()`. An infinite loop is not recoverable by the surrounding `try`/`catch`.

**Risk:** Denial of service on the upload path. Requires an authenticated admin with `manage_media`, so exposure is limited.

**Fix:** `mif1` removed from the accepted major brands. Only `avif` and `avis` — the actual AVIF major brands — are accepted, so HEIF no longer reaches the parser. This also corrects a MIME-labelling bug where HEIF files were stored as `image/avif`.

**Remaining action:** track `image-size` for a patched release. See the production checklist.

---

### BE-10 · INFO · Node 24 reinterprets `sslmode=require` as `verify-full` — **NO CHANGE**

**Component:** `DATABASE_URL` / `DIRECT_URL` connection strings

**Current behavior:** The production build emits, once per worker, `SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.` Both connection strings use `sslmode=require`, and the runtime is Node v24.

**Why it is benign here:** `verify-full` is the *stricter* interpretation — it additionally validates the certificate chain and hostname. The database is Neon, which presents certificates from a publicly trusted CA, so verification succeeds. Connections worked throughout the build and the full test run.

**Why it is worth recording:** this is a silent behavior change in the runtime, not in application code. If the database is ever moved to a host using self-signed or private-CA certificates, the same connection string that works today will start failing with a certificate error, and the cause will not be obvious. Making it explicit (`sslmode=verify-full`) would document the effective behavior and remove the warning.

**No change made:** the connection strings are environment configuration, not code, and the current behavior is correct and more secure than the literal setting requested.

---

## Controls verified as sound (no change made)

| Area | Evidence |
|---|---|
| Password hashing | Argon2id via the `argon2` native binding, library defaults (64 MiB, t=3, p=4). Plaintext never persisted, logged, or returned. |
| Session tokens | 32 random bytes, base64url; stored only as a SHA-256 hash peppered with `ADMIN_SESSION_SECRET`; expiry enforced server-side; `revokedAt` honoured; disabled users rejected at lookup. |
| Session cookies | `HttpOnly`, `Secure` in production, `SameSite=Lax`, `Path=/`, explicit expiry. |
| Session fixation | Login always mints a fresh token; no identifier is promoted. |
| Role changes | Role is re-read from the database on every request, so a downgrade takes effect immediately without session surgery. Super Admin demotion additionally revokes all sessions. |
| Privilege escalation | `manage_users` is exclusive to `SUPER_ADMIN`; the role parser rejects anything outside the four known values. |
| SQL injection | No `$queryRawUnsafe` / `$executeRawUnsafe` anywhere. The single raw query is a parameterless tagged-template `SELECT 1` health probe. |
| Mass assignment | No `prisma.*.update({ data: clientInput })` pattern. Admin actions read named `FormData` fields; the AI path is doubly allowlisted. |
| AI protected fields | `status`, `publishedAt`, `verified`, `originalQuote`, `approvedForAI`, `approvedProjectFacts`, `hasVerifiedProjectExperience`, `draftJson`, `noIndex`, `canonicalOverride`, slugs, and Checklist/Template/Tool stable IDs are all in protected sets. AI cannot publish. |
| Cross-type proposal attack | `applyProposalDecisions` derives entity type and ID from the stored proposal row; the client's `entityType`/`entityId` are used only for `revalidatePath`. |
| Stale proposals | Staleness re-checked twice — once on load, once immediately before the write — against `entityUpdatedAt`. |
| Provider secrets | AES-256-GCM at rest; only `apiKeyLast4` crosses to client components; connection tests return status only. |
| Enquiry durability | Validate → persist → audit → notify. Notification failure is recorded on the row and never rolls back the enquiry. |
| CSV export | Formula injection neutralised by prefixing `=`, `+`, `-`, `@` with a quote; export capped at 2000 rows; permission-gated and audited. |
| Upload safety | Magic-byte sniffing, extension-to-content match, SVG rejected, size capped, filename sanitised, storage key server-generated. |
| Local media route | Disabled in production; traversal blocked by both a `..` check and a root-prefix check; content types restricted to images. |
| Preview access | HMAC token bound to entity type **and** ID, 2-hour TTL, constant-time comparison, `robots: noindex`. |
| Homepage draft isolation | The public read path uses published columns only; `draftJson` is never read publicly, and saving a draft does not revalidate `/`. |
| Redirect destinations | `isSafePublicUrl` rejects `javascript:`, `data:`, and protocol-relative URLs. |
| Env validation | Production fails hard on a missing or short `ADMIN_SESSION_SECRET`, a localhost canonical origin, local media storage, or the draft-content flag. |
| `NEXT_PUBLIC_*` | All 19 are genuinely public — site URL, contact details, analytics IDs, address, one dev-only flag. No secret exposure. |
| Git hygiene | `.gitignore` covers `.env*`, `*.pem`, and local media storage. |

---

## Database

**Schema:** 1789 lines, 15 migrations, `prisma validate` passes. No drift detected between schema fields and migration SQL.

**Constraints:** slugs, `Redirect.sourcePath`, `AdminSession.tokenHash`, `Enquiry.reference`, and `AdminUser.email` are unique at the database level, so uniqueness does not depend on application checks.

**Pagination:** repository helpers clamp consistently — enquiries `min(pageSize, 100)`, media `min(pageSize, 100)`, redirects `min(limit, 200)`, proposals `take: 10`. `?pageSize=1000000` cannot produce an unbounded query.

**Transactions — accepted risk.** There is no `prisma.$transaction` in `lib/` other than the Super Admin guard added by this audit. Publish performs status promotion, then revision creation, then audit write, then revalidation as four sequential awaits. A failure after the first step leaves content published with no revision or no audit entry. This is a bookkeeping inconsistency, not a content-integrity one: the published state itself is a single row update and is always coherent. Wrapping eight repositories in transactions is a broader change than an audit should make unreviewed; it is recorded in `DATABASE_INTEGRITY_AND_PERFORMANCE_AUDIT.md` as the top recommendation.

**Revision numbering race:** `createContentRevision` reads `max(revision)` then inserts. Two simultaneous publishes of the same entity would collide on `@@unique([entityType, entityId, revision])` — the second throws rather than corrupting. Acceptable failure mode.

**Growth:** `AdminSession`, `AuditLog`, `AIContentRun`, `AIContentProposal`, and `Enquiry` grow monotonically. All common queries are indexed and paginated. Retention is documented in the database report.

---

## Performance

| Risk | Assessment |
|---|---|
| N+1 | `listPendingProposals` refreshes staleness in a loop, but is bounded to 10. No unbounded N+1 found on public pages. |
| Unbounded reads | `lib/ai/knowledge.ts` and `lib/ai/topic-intelligence/content-index.ts` load every published entity with no `take`. Prompt output is capped downstream, but the database read is not. Acceptable at current catalogue size; recorded as a scaling watch item. |
| Public page queries | Use explicit `select`/`include` scoped to what the template renders. |
| Admin lists | Paginated with hard caps. |
| Navigation | Cached by tag, not re-queried per request. |
| Connection management | Prisma singleton guards against hot-reload connection explosion. |

---

## Error handling and observability

Public API errors return fixed, safe messages with no stack traces, SQL, or provider detail. Admin actions throw `Error` with operator-facing text; Next.js masks server errors in production responses. Failures are `console.error`-logged with context.

There is no error-reporting platform (Sentry or equivalent). Failures are visible only in Vercel runtime logs, which means a rising provider failure rate will not page anyone. This is an operational gap, not a code defect — it is listed as a manual action.

Audit logging covers login, logout, user create/update, publish, archive, slug change, redirect mutation, settings changes, provider config, enquiry status/notes/export/anonymise/delete, and AI proposal create/apply/reject. `AuditLog` has no update or delete path anywhere in the codebase, so editors cannot tamper with it.

---

## Testing

| Command | Result |
|---|---|
| `npm test` (Vitest) | **311 passed / 311**, 28 files (+13 added by this audit) |
| `npx tsc --noEmit` | Clean |
| `npm run lint` | 4 errors, 2 warnings — all pre-existing React `set-state-in-effect` issues in admin client components, untouched by this audit |
| `npx next build` | Succeeds |
| `npx prisma validate` | Valid |
| `npm audit` | 1 high (`image-size`, no upstream fix) — reachability mitigated, see BE-09 |

---

## Manual production actions

These cannot be verified from the repository.

1. **Take a database backup and run a restore drill.** No backup was performed by this audit.
2. **Confirm `ADMIN_SESSION_SECRET` is set to ≥32 random characters in production.** If it is ever changed, every session is invalidated and every Admin-stored AI provider key becomes undecryptable — re-enter provider keys after any rotation.
3. **Set `AI_SECRETS_ENCRYPTION_KEY` explicitly** rather than relying on the `ADMIN_SESSION_SECRET` fallback, so session-secret rotation does not destroy provider credentials.
4. **Verify object storage bucket permissions** — uploads must not be publicly listable.
5. **Confirm `MEDIA_STORAGE_PROVIDER=s3`** in production; env validation blocks local storage, but confirm the S3 credentials actually work.
6. **Verify email sender domain (SPF/DKIM)** for the configured Resend from-address.
7. **Decide whether the in-memory rate limiter is sufficient.** On Vercel each instance has its own counters, so effective limits scale with instance count. If stricter guarantees are needed, put Cloudflare rate limiting in front of `/admin/login`, `/api/contact`, and `/api/website-review`.
8. **Add error alerting.** Without it, provider and publish failures are invisible until someone reads logs.
9. **Track `image-size` for a patched release** and upgrade when available.
10. **Review hosting execution limits** against long AI research runs.

---

## Accepted risks

| Risk | Rationale |
|---|---|
| Publishing is not transactional | Published state is a single row update and stays coherent; only revision/audit bookkeeping can be incomplete. Fixing it touches eight repositories and warrants its own reviewed change. |
| In-memory rate limiting is per-instance | Deliberate — avoids adding Redis. Effective limits loosen as instances scale out; front with Cloudflare if that matters. |
| DNS rebinding is not blocked | The SSRF guard validates hostnames and every redirect hop, but does not pin resolved IPs. Blocking rebinding requires resolve-then-connect plumbing that the `fetch` API does not expose. |
| `X-Forwarded-For` is trusted for rate-limit bucketing | Spoofing only moves an attacker between buckets; per-account limits remain effective. |
| Last-write-wins on concurrent edits | Existing product decision. AI proposals are separately protected by staleness checks. |
| Draft saves demote published content to `DRAFT` without revalidating the public path | Pre-existing CMS semantic. Recorded in the database report; changing it is a product decision, not a security fix. |
| `/api/internal/redirect-lookup` is gated by a header, not a secret | Returns only redirect destinations, which are already observable by following the redirect. |

---

## Files changed

| File | Change |
|---|---|
| `lib/ai/ssrf.ts` | BE-01 — IPv4-mapped IPv6 and `::` blocking |
| `lib/repositories/adminUsersRepository.ts` | BE-02 — serializable last-Super-Admin guard |
| `lib/repositories/redirectsRepository.ts` | BE-03 — self-redirect, live-path reclaim, chain collapse |
| `lib/admin/ai-content-assistant-actions.ts` | BE-04, BE-07 — same-origin checks, Zod decision envelope |
| `lib/ops/request-timeout.ts` | BE-05 — new shared timeout helper |
| `lib/forms.ts`, `lib/seo/indexnow.ts`, `lib/ai/research/index.ts`, `lib/ai/topic-intelligence/providers/{gnews,newsapi}.ts` | BE-05 — timeouts applied |
| `lib/admin/crypto.ts`, `lib/admin/session.ts`, `lib/admin/auth-actions.ts` | BE-06 — constant-work rejection, IP throttling |
| `app/api/admin/media/route.ts` | BE-08 — Zod query validation |
| `lib/media/validation.ts` | BE-09 — HEIF excluded from the AVIF brand check |
| `tests/admin/backend-security-regressions.test.ts` | 13 regression tests |
