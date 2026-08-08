# Phase 5 Completion

Enquiry operations for Contact + Free Website Review — persistence-first, notification-second. Not a CRM.

## DATABASE

- Models: `Enquiry`, `EnquiryNote`
- Enums: `EnquiryType` (CONTACT | WEBSITE_REVIEW), `EnquiryStatus` (NEW | REVIEWING | REPLIED | QUALIFIED | CLOSED | SPAM), `NotificationStatus` (NOT_ATTEMPTED | SENT | FAILED)
- Migration: `prisma/migrations/20260807230000_phase5_enquiries`
- Indexes: type+status+submittedAt, email, notificationStatus, unique reference (`ENQ-YYYY-…` / `REV-YYYY-…`)

## PUBLIC CONTACT

**Fields collected:** name, email, company?, website?, service, projectDetails, budget?, timeline?, referralSource?, honeypot `_gotcha` (not stored)

**Flow:** Zod → honeypot fake-success → rate limit → `submitContactEnquiry()` → DB → notification attempt → public success if persisted

**UX:** Sending… / received / retry+fallback email; disabled form shows Site Settings contact fallback

## FREE WEBSITE REVIEW

**Fields:** name, email, website, mainConcern, honeypot

**URL safety:** http/https only; no server-side fetch of submitted URLs (SSRF avoided)

## ADMIN

- Routes: `/admin/enquiries`, `/contact`, `/reviews`, detail `[id]`
- Sidebar group **Enquiries** with NEW count badge
- Lists: filters, search, pagination, status/delivery badges
- Detail: submission / status / delivery / notes / activity
- Actions: status, notes, mailto reply, open website (noopener), spam restore, retry notification, anonymize, delete, CSV export
- Dashboard: new contact/review counts, delivery failures, recent enquiries

## DELIVERY

- Provider: existing Resend + webhook (`lib/forms.ts`)
- Reply-To = visitor email; From remains authorized sender
- Subjects include safe reference (no raw visitor header injection)
- Retry audited + rate-limited
- System status: form enabled, persistence healthy, notification configured (≠ delivery guarantee), failures 24h

## PRIVACY

- RBAC: Super Admin + Editor view/manage; export/destructive Super Admin only; Content Manager / Reviewer no PII
- No public API/repo exposure of enquiries
- `/admin` skips public analytics scripts; forms use `data-clarity-mask`
- Audit metadata: id/type/action/status — not message bodies
- Anonymize clears PII + notes; permanent delete Super Admin only
- CSV formula escaping; notes excluded from default export
- Privacy Statement updated for Contact + Free Review; **legacy legal sections flagged for human legal review**

## EXPORT

- Super Admin CSV of current filter / type
- Streamed authenticated download; audited without CSV contents

## SECURITY

- Validation, XSS-safe Admin text, header escaping, URL scheme checks, IDOR via authz, CSRF on Admin mutations, hashed IP for rate limit only

## QA

Run:

```bash
npx prisma migrate deploy
npm test
npm run lint
npx tsc --noEmit
npm run build
```

Phase 5 Vitest coverage: validation, honeypot parse, XSS-as-text, URL schemes, CSV formula escape, RBAC, IP hash.

## Intentionally NOT built

CRM, pipelines, lead scoring, email composer/mailbox, newsletters, booking, attachments, website crawl/screenshots, HubSpot/Sheets sync, assignment workload tools, automated retention job, marketing consent.

## Go-live

1. `npx prisma migrate deploy`
2. Confirm Site Settings form toggles + email env
3. One controlled Contact test → DB + Admin + notification
4. One controlled Review test
5. Verify unauthorized roles cannot open enquiries
6. Verify analytics events contain no field PII
