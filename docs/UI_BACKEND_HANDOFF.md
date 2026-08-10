# UI ↔ Backend Handoff (verification pass)

Backend-only changes that affect frontend behavior or copy. No navigation/layout changes were made in this pass.

## Portal attention & approvals

- **VIEWER** roles on proposals and contracts now **appear** in attention/approvals lists when they have explicit document access, with **`canAct: false`** and view-oriented CTAs.
- **DECISION_MAKER** / **CLIENT_SIGNATORY** retain **`canAct: true`** for actionable items.
- Project-scoped deliverables/requirements still use `portalProjectRoleCanAct()` — VIEWER sees items but cannot approve.

## Contract signing

- Repeat sign requests for the same signer/version return **idempotent success** (no error when contract already signed).
- New contract versions only re-notify signers attached to **that version** (prevents duplicate signer rows affecting signing state).

## Payments

- Amount/currency mismatch from provider confirmation sets payment to **`NEEDS_REVIEW`** persistently (UI should surface review state, not treat as success).

## CRM property forms

- Bare numeric strings are **rejected** for DATE fields (e.g. `50000` is not accepted as a date).

## No breaking route changes

Stable client destinations remain:

- `/portal/proposals/[id]`
- `/portal/contracts/[id]`
- `/portal/invoices/[id]`
- `/portal/projects/[id]/onboarding`
- `/portal/projects/[id]/changes/[changeId]`
- `/workspace/*` prospect routes

## Provider verification pass (2026-08-10)

- **`lib/env.ts`:** Production validation now rejects malformed `NEXT_PUBLIC_SITE_URL` values that embed `DATABASE_URL` or `postgresql://` (prevents `.env` line-break mistakes leaking into client bundles). No UI change.
- **`scripts/run-provider-staging-verification.ts`:** Operator harness for S3/SMTP/Paystack/scheduler checks — not imported by app runtime.
- **SEO unit test only:** `tests/seo/industry-routes.test.ts` mocks DB vs catalog sitemap paths — no sitemap behavior change.

