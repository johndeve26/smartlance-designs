# Production hardening report

Date: 2026-08-07  
Scope: Phases 1–5 Admin Manager — hardening + launch audit (no new feature set).

## Summary

The system is **READY WITH MANUAL ACTION** for production operation after the fixes in this pass, pending operator verification of backups, production env, email DNS, and **human legal review** of legacy legal copy.

Previous automated QA: 51 tests. This pass adds hardening tests (env/RBAC/URL safety).

---

## Findings

| Issue | Severity | Module | Fix | Test | Status |
| --- | --- | --- | --- | --- | --- |
| Missing `assertSameOrigin` on enquiry + Phase 4 server actions | HIGH | CSRF | Added to `enquiry-actions.ts`, `phase4-actions.ts` | Code review + suite | Fixed |
| Last Super Admin could be demoted/disabled | HIGH | Auth | Guard in `adminUsersRepository.updateAdminUser` | Manual + message | Fixed |
| No centralized production env validation | HIGH | Env | `lib/env.ts` + `instrumentation.ts` (hard-fail on `VERCEL_ENV=production`) | `hardening.test.ts` | Fixed |
| Blog list loaded full `bodyMarkdown` for all insights | HIGH | Perf | Omit body from list meta; count via `countPublishedInsights` | Code review | Fixed |
| Enquiry CSV export capped at 100 + N+1 fetches | HIGH | Enquiries | Dedicated export query, max 2000, no N+1 | Code review | Fixed |
| Markdown links allowed `javascript:` via Next `Link` | HIGH | XSS | Safe href/src checks in `BlogMarkdown` | `hardening.test.ts` | Fixed |
| Empty ADMIN_SESSION_SECRET accepted in prod | HIGH | Auth | Env validation requires ≥32 chars | Env layer | Fixed |
| No Admin route error boundary | MEDIUM | Admin UX | `app/admin/error.tsx`, `not-found.tsx` | Manual | Fixed |
| Expired sessions never pruned | MEDIUM | Auth | `npm run admin:prune-sessions` | Script | Fixed |
| Baseline security headers incomplete | MEDIUM | HTTP | `next.config.ts` headers (nosniff, referrer, frame, permissions; admin no-store) | Build | Fixed |
| No read-only smoke script | MEDIUM | Ops | `npm run smoke:public` | Script | Fixed |
| Concurrent edit conflict (updatedAt) | MEDIUM | CMS | Not implemented — last-write-wins risk documented | — | Open (manual care) |
| Neon backup / PITR | BLOCKER* | Ops | Must be verified in provider console | Operator | Manual |
| Production S3 media + secrets | BLOCKER* | Media | Env + System Status; local blocked | Operator | Manual |
| Email SPF/DKIM/DMARC | HIGH* | Delivery | Document only if verified — not claimed | Operator | Manual |
| Privacy/Terms legacy legal language | HIGH* | Legal | Flag preserved — **HUMAN REVIEW REQUIRED** | — | Open |
| Full CSP (script-src) | LOW | HTTP | Deferred — avoid conflicting with analytics without measured policy | — | Deferred |
| Pre-existing lint unused `_typedList` | LOW | Lint | Unrelated; deferred | — | Known |

\*Operator / infrastructure / legal — not code defects.

---

## Source of truth (runtime)

| Family | Authoritative after init |
| --- | --- |
| Homepage, Services, Solutions, Platforms | PostgreSQL |
| Industries, Work, Testimonials, Insights, Resources | PostgreSQL (typed/markdown fallback only when DB empty / no URL) |
| Media, Navigation, Settings, Redirects | PostgreSQL |
| Enquiries | PostgreSQL only (no public fallback) |

Fallbacks must not override non-empty DB families (empty-list probe pattern).

---

## What was intentionally not built

CRM, email client, CSP redesign, automatic retention jobs inventing legal durations, zero-downtime claims, production mutation automation.

---

## Automated QA (this pass)

Run: `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`.

---

## Launch item status

| Item | Status |
| --- | --- |
| Auth / RBAC / sessions / CSRF (code) | READY |
| Enquiry persistence + Admin | READY |
| Media production storage configured | READY WITH MANUAL ACTION |
| DB backups + restore test | READY WITH MANUAL ACTION |
| Canonical host / WWW / HTTPS at edge | READY WITH MANUAL ACTION |
| Email notification + DNS auth | READY WITH MANUAL ACTION |
| SEO/link health operator pass | READY WITH MANUAL ACTION |
| Human legal review (Privacy/Terms legacy) | BLOCKED (process — not technical) |
| Concurrent-edit locking | READY WITH MANUAL ACTION (careful edits) |
