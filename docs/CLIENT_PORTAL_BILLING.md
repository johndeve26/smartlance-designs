# Client Portal Billing

## Access model

Explicit authorization required — project/proposal/contract access does **not** automatically grant all company invoices.

1. **Per-invoice**: `AgencyInvoiceClientAccess` (roles: `BILLING_ADMIN`, `VIEWER`)
2. **Company-wide**: `AgencyClientBillingAccess` (optional)

`BILLING_ADMIN` can pay; `VIEWER` can only view.

Same-company contacts without billing access cannot see invoices unless explicitly granted.

## Routes

- `/portal/billing` — outstanding balance, due/overdue lists
- `/portal/invoices/[id]` — line items, payment history, pay button
- `/portal/billing/return` — verifies payment after checkout redirect

## DTO safety

Portal responses exclude: `internalNotes`, provider secrets, webhook payloads, audit logs.

## Pay flow

1. Authenticated portal user with billing permission
2. Server creates pending payment at authoritative amount
3. Redirect to Paystack (if configured)
4. Webhook or return verification confirms payment
5. Invoice balance updated idempotently

## View tracking

First/last viewed timestamps on explicit invoice access records.

## No public invoices

All billing routes require portal authentication. `robots: noindex`.
