# Security Architecture

Smartlance security boundaries for Admin, Prospect/Client Portal, and internal automation.

---

## Identity surfaces

| Surface | Mechanism | Session |
|---------|-----------|---------|
| Admin | Email + password (Argon2) | Hashed DB session cookie |
| Prospect Workspace | Magic link (hashed invite token) | Shared `ClientPortalUser` session |
| Client Portal | Magic link / invite | Same `ClientPortalUser` session |
| Internal schedulers | Bearer secret | Stateless |

**Critical rule:** Prospect stage is UX-only. Client access requires explicit grants (`AgencyProjectClientAccess`, `AgencyProposalClientAccess`, etc.). Same company ≠ authorization.

---

## Admin authentication

- Passwords hashed with **Argon2**
- Session tokens stored **hashed** in `AdminSession`
- Cookie: **HttpOnly**, **Secure** in production, **SameSite** policy
- Login rate limiting per email + IP
- Generic error messages (no user enumeration on login)
- `ADMIN_SESSION_SECRET` ≥ 32 chars required in production (`lib/env.ts`)

---

## Portal authentication

- Magic link tokens: random, **hashed at rest**, single-use, expiring
- `acceptProspectMagicLink` rejects replay/expired/revoked
- Session cookie shared between `/workspace` and `/portal`
- Logout invalidates server session where implemented

---

## Authorization model

### Resource grants (explicit)

- Projects: `AgencyProjectClientAccess`
- Proposals: `AgencyProposalClientAccess`
- Contracts: `AgencyContractClientAccess`
- Invoices/Billing: `AgencyInvoiceClientAccess` / billing access tables
- Change Requests: `AgencyChangeRequestClientAccess` + role (viewer vs approver)
- Files: project-scoped storage keys + access check before signed URL

### Prospect ownership

- Reviews/Briefs/Requests: owned by `portalUserId` or unclaimed claim token
- Claim tokens: one-time, hashed, cleared after use
- API `GET /api/prospect/reviews/[id]`: requires portal user **or** matching claim cookie

### Admin RBAC

Capabilities in `lib/admin/rbac.ts`. Roles: `SUPER_ADMIN`, `EDITOR`, `CONTENT_MANAGER`, `REVIEWER`.

Admin mutations use `requireAdminUser(capability)` + `assertSameOrigin()` where applicable.

---

## CSRF / same-origin

Server actions and admin mutations call `assertSameOrigin()` to block cross-site POSTs.

---

## SSRF (Website Review crawler)

- Hostname blocklist: private IPs, metadata hosts, localhost (`lib/ai/ssrf.ts`)
- Max **5 pages**, same-origin, size/timeout limits
- Redirect destinations revalidated (unit tests cover hostname blocks)
- DNS rebinding: document as residual risk; no unsafe custom networking

---

## AI safety

- Structured output validation with evidence ID cross-check
- Invalid evidence IDs dropped/rejected
- AI failure → deterministic fallback observations (Review)
- No raw model output rendered without validation
- Provider keys server-only; never in client bundle or DTOs
- Test override (`createAIProviderForTestOverride`) isolated to test paths

---

## Private files

- Production requires S3-compatible storage (`AGENCY_PRIVATE_STORAGE_DRIVER=s3`)
- Authorization before presigned URL generation
- Storage keys never in client DTOs
- Content-Disposition for dangerous MIME types

---

## Payments (Paystack)

- Server-derived invoice amounts (client tamper rejected)
- Webhook HMAC verification
- Idempotent Payment + Allocation on replay
- Return URL is **not** payment proof
- `SUCCEEDED` status monotonic

---

## Webhooks & schedulers

| Route | Secret env var |
|-------|----------------|
| `/api/internal/crm-sequence-scheduler` | `CRM_SCHEDULER_SECRET` |
| `/api/internal/crm-inbound-email-sync` | `CRM_INBOUND_SYNC_SECRET` |
| `/api/internal/agency-billing-scheduler` | `AGENCY_BILLING_SCHEDULER_SECRET` |
| `/api/internal/agency-onboarding-scheduler` | `AGENCY_ONBOARDING_SCHEDULER_SECRET` |
| `/api/webhooks/payments/paystack` | Paystack signature |

Unauthenticated requests must fail. Constant-time secret comparison where implemented.

---

## Logging

Do not log: passwords, session tokens, magic-link tokens, SMTP passwords, AI keys, full webhook payloads with secrets.

---

## XSS / rendering

- Review findings, brief answers, messages: React text rendering or sanitized markdown
- CRM email bodies: sanitized display policy
- Reject `javascript:` / `data:` in user-supplied URLs where validated

---

## Error handling

Public/Portal users see generic errors + optional digest ID. No Prisma stacks or env values in responses.
