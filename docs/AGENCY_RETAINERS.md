# Agency Retainers

Recurring commercial billing — **not** a payment-provider subscription.

## Model

`AgencyRetainer`: company, amount, currency, interval (`MONTHLY`, `QUARTERLY`, `YEARLY`), `nextBillingDate`, `issueMode` (`CREATE_DRAFT` default, `AUTO_ISSUE` optional).

## Statuses

`DRAFT`, `ACTIVE`, `PAUSED`, `ENDED`, `CANCELLED`

## Generation

Internal scheduler (`/api/internal/agency-billing-scheduler`) when `nextBillingDate <= now` and status `ACTIVE`.

## Idempotency

`AgencyRetainerBillingPeriod` unique on `(retainerId, periodStart)` prevents duplicate invoices.

## Pause / resume

Paused retainers generate no invoices. Resume uses admin-set next billing date — no retroactive surprise periods.

## Amount changes

Affect future ungenerated periods only; issued invoices unchanged.

## Email

Auto-issued invoices trigger normal invoice notification; failure leaves invoice in place.
