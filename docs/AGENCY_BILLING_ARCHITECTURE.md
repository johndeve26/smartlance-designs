# Agency Billing Architecture (V2.2)

Operational billing layer for Smartlance Agency Operations. This is **not** an accounting system — no general ledger, tax engine, or bookkeeping replacement.

## Boundaries

| Concept | Role |
|---------|------|
| **Proposal** | Commercial offer |
| **Acceptance** | Authoritative accepted scope and amount |
| **Contract** | Signed legal/document record |
| **Project** | Delivery |
| **Invoice** | Request for payment |
| **Payment** | Money received / transaction evidence |
| **Retainer** | Recurring billing arrangement |

Payment does **not** automatically start projects, qualify leads, or mark contracts signed.

## Money

All authoritative amounts stored as **integer minor units** per currency exponent (`lib/money/`). Server calculates totals; browser never supplies authoritative totals.

## Core models

- `AgencyBillingProfile`, `AgencyBillingSettings`
- `AgencyInvoice`, `AgencyInvoiceLineItem`, `AgencyInvoiceCounter`
- `AgencyBillingSchedule`, `AgencyBillingInstallment`
- `AgencyPayment`, `AgencyPaymentAllocation`, `AgencyPaymentWebhookEvent`
- `AgencyRetainer`, `AgencyRetainerBillingPeriod`
- `AgencyInvoiceClientAccess`, `AgencyClientBillingAccess`
- `AgencyBillingActivity`

## Admin routes

- `/admin/agency/billing` — dashboard
- `/admin/agency/invoices` — list / detail / create
- `/admin/agency/payments` — payment list
- `/admin/agency/retainers` — retainer management

## Portal routes

- `/portal/billing` — billing home
- `/portal/invoices/[id]` — invoice detail + pay
- `/portal/billing/return` — post-checkout verification (redirect alone ≠ paid)

## RBAC

- `view_billing`, `manage_billing`, `record_payments`, `manage_retainers`

## Scheduler

`POST /api/internal/agency-billing-scheduler` with `AGENCY_BILLING_SCHEDULER_SECRET` bearer token.

## Payment provider

Paystack adapter when `PAYSTACK_SECRET_KEY` is set; otherwise manual payments only. Webhook: `/api/webhooks/payments/paystack`.

## Retention

Issued invoices and confirmed payments are business records — not erased when CRM contacts are archived.

## Payment confirmation email (V2.2.1)

After authoritative `confirmPaymentSuccess`, a factual receipt email is sent via `sendPaymentConfirmationEmail`.
Idempotency uses `confirmationEmailSentAt` / `confirmationEmailClaimedAt` on `AgencyPayment`.
Email failure does not roll back payment. Partial vs paid wording differs.
