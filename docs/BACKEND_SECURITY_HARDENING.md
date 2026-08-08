# Backend Security Hardening

What was actually tested during the backend audit, what was fixed, what is already strong, and what remains a manual or accepted risk.

This document does not claim the application is secure, unhackable, or certified. It records the specific checks that were performed and their outcomes.

---

## Threats reviewed

| Threat | Outcome |
|---|---|
| Authentication bypass | No path found. Every admin page and Server Action independently calls `requireAdminUser`; the proxy is not relied on for authorization. |
| Broken access control | No path found. 115 Server Actions all gate on a capability. |
| IDOR / BOLA | No path found. Admin capabilities are global rather than per-resource, so there is no cross-tenant model to violate. The AI proposal path resolves its entity from the stored row, not from client input. |
| Privilege escalation | No path found. `manage_users` is exclusive to `SUPER_ADMIN`; the role parser rejects unknown values. |
| CSRF | One gap found and fixed — see BE-04. |
| Session theft | Mitigated: `HttpOnly`, `Secure`, `SameSite=Lax`; tokens stored only as peppered hashes. |
| Session fixation | Not present. Login always mints a new token. |
| Brute force / credential stuffing | Partially mitigated; improved by BE-06. |
| User enumeration | Timing oracle found and fixed — see BE-06. |
| Password reset abuse | Not applicable — no self-service reset exists. |
| Mass assignment | No path found. No `update({ data: clientInput })` pattern anywhere. |
| SQL / raw SQL injection | Not possible. No unsafe raw APIs are used. |
| Stored XSS via CMS data | Markdown/URL sanitisation rejects `javascript:`, `data:`, protocol-relative. SVG upload blocked. |
| SSRF | Bypass found and fixed — see BE-01. |
| Open redirect | Redirect destinations validated by `isSafePublicUrl`. |
| Path traversal | Blocked in the local media route by two independent checks. |
| Unsafe file upload / MIME spoofing | Magic-byte sniffing with extension-to-content matching. One brand-confusion bug fixed — see BE-09. |
| Webhook spoofing | Not applicable — no inbound webhooks. |
| Secret leakage | None found. Provider keys encrypted at rest; only last-4 crosses to the client. All 19 `NEXT_PUBLIC_*` values are genuinely public. |
| Prompt injection crossing trust boundaries | Contained. Model output can only touch allowlisted fields; injected text cannot reach `status`, `verified`, or slugs. |
| PII leak | Enquiry data is permission-gated; anonymisation clears fields and deletes notes. |
| Unbounded request payload | Uploads capped; AI decisions capped; enquiry fields Zod-bounded. |
| Expensive AI endpoint abuse | No unauthenticated path to any paid provider call. |
| Rate-limit bypass | Possible via `X-Forwarded-For` spoofing — accepted, see below. |
| Cache poisoning | Draft content never enters the public cache; draft saves do not revalidate `/`. |
| Race conditions | One found and fixed — see BE-02. Revision numbering races fail closed. |
| Publish authorization bypass | Not present. No publish path accepts `edit_draft`. |

---

## Confirmed issues and fixes

Full write-ups with evidence are in [`BACKEND_AUDIT_REPORT.md`](./BACKEND_AUDIT_REPORT.md).

| ID | Severity | Issue | Status |
|---|---|---|---|
| BE-01 | HIGH | SSRF filter missed IPv4-mapped IPv6, reaching cloud metadata | Fixed + tested |
| BE-02 | HIGH | Last-Super-Admin guard raced, allowing total admin lockout | Fixed + tested |
| BE-03 | HIGH | Slug rename-back left a live page behind an infinite redirect | Fixed + tested |
| BE-04 | NORMAL | Four AI Server Actions skipped `assertSameOrigin()` | Fixed |
| BE-05 | NORMAL | Six outbound calls had no timeout | Fixed + tested |
| BE-06 | NORMAL | Login timing revealed account existence; email-only throttling | Fixed + tested |
| BE-07 | NORMAL | AI proposal decisions were unvalidated client JSON | Fixed |
| BE-08 | NORMAL | Media list endpoint accepted unvalidated enums | Fixed |
| BE-09 | NORMAL | Unpatched `image-size` HEIF advisory was reachable | Mitigated |

---

## Controls already strong

These were examined and required no change.

**Password storage.** Argon2id at `m=65536, t=3, p=4` — verified by inspecting a generated hash, not by reading documentation. This exceeds the OWASP minimum. Plaintext is never persisted, logged, or returned; `listAdminUsers` selects explicit columns and never includes `passwordHash`.

**Session lifecycle.** Tokens are 32 random bytes stored only as `sha256(ADMIN_SESSION_SECRET + ":" + token)`. Expiry is enforced server-side on every lookup, alongside `revokedAt` and `user.status !== "ACTIVE"`. Because the role is re-read from the database on each request, a role downgrade takes effect on the next request with no session surgery required. Disabling a user or demoting a Super Admin additionally revokes all their sessions.

**AI field allowlists.** The strongest part of the backend. Each entity type has an explicit allowlist and an explicit protected set, and the protected sets correctly cover `status`, `publishedAt`, `verified`, `originalQuote`, `approvedForAI`, `approvedProjectFacts`, `hasVerifiedProjectExperience`, `draftJson`, `noIndex`, `canonicalOverride`, slugs, and the Checklist/Template/Tool stable identifiers that drive deterministic tooling. The filter is applied twice — once per decision and once over the assembled object — so a single missed branch does not open the gate. **AI cannot publish.**

**Cross-type proposal defence.** `applyProposalDecisions` loads the proposal and derives entity type and ID from that row. The client-supplied `entityType`/`entityId` are used only to pick a path to revalidate, so a Service proposal cannot be aimed at a Platform.

**Enquiry durability.** Validate, persist, audit, then notify. Notification outcome is recorded on the row; failure never rolls the enquiry back. This was specifically checked because it is the classic way to silently lose leads.

**CSV export safety.** Cells beginning `=`, `+`, `-`, or `@` are prefixed with a quote, so a spreadsheet will not execute an enquiry body as a formula. Exports are capped at 2000 rows, require `export_enquiries` (Super Admin only), and write an audit entry.

**Audit log integrity.** There is no update or delete path for `AuditLog` anywhere in the codebase, so an editor cannot rewrite history.

**Environment validation.** Production fails hard — not warns — on a missing or short `ADMIN_SESSION_SECRET`, a localhost canonical origin, local media storage, or an enabled draft-content flag.

---

## Manual production checks

Code cannot verify these. See [`BACKEND_PRODUCTION_CHECKLIST.md`](./BACKEND_PRODUCTION_CHECKLIST.md).

1. Database backup exists and a restore has actually been performed.
2. `ADMIN_SESSION_SECRET` is ≥32 random characters in production.
3. `AI_SECRETS_ENCRYPTION_KEY` is set explicitly, not inherited from the session secret.
4. Object storage bucket is not publicly listable.
5. Email sender domain passes SPF/DKIM.
6. Cloudflare or equivalent rate limiting sits in front of login and the public forms, if per-instance limits are not acceptable.
7. Error alerting exists so provider and publish failures are noticed.

---

## Remaining accepted risks

**Publishing is not transactional.** Status promotion, revision creation, and the audit write are sequential. A mid-sequence failure leaves content published with incomplete bookkeeping. The published state itself is one row update and stays coherent, so this is a record-keeping risk rather than a content-integrity one. Fixing it spans eight repositories and deserves its own reviewed change.

**Rate limiting is per-instance and in memory.** Deliberate — Redis was not introduced for aesthetics. On a serverless host the effective limit is roughly `configured_limit × instance_count`. Adequate against casual abuse; put a CDN-level rule in front if stronger guarantees are needed.

**DNS rebinding is not blocked.** The SSRF guard validates the hostname of the initial URL and of every redirect hop, but does not pin the resolved IP for the connection. A hostname that resolves to a private address on the second lookup would pass. Closing this requires resolve-then-connect control that the `fetch` API does not expose.

**`X-Forwarded-For` is trusted for rate-limit bucketing.** The header is not authenticated, so spoofing moves an attacker between buckets. It cannot bypass the per-account login limit, which is the control that matters when a specific admin email is targeted.

**Draft saves demote published content without revalidating.** For most content families, saving a draft sets `status: "DRAFT"` — an immediate unpublish — but does not revalidate the public path, so the CDN may keep serving the old page. This is a pre-existing CMS semantic, not a security issue, and changing it is a product decision.

**Unbounded AI context reads.** `lib/ai/knowledge.ts` and `lib/ai/topic-intelligence/content-index.ts` load every published entity with no `take`. Prompt output is capped downstream. Fine at the current catalogue size; revisit if content volume grows substantially.
