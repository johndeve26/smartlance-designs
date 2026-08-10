# Agency Payments

## Model

`AgencyPayment` records payment attempts and confirmations. `AgencyPaymentAllocation` links payments to invoices (supports partial and multiple payments).

## Statuses

`PENDING`, `SUCCEEDED`, `FAILED`, `CANCELLED`, `NEEDS_REVIEW` (amount/currency mismatch).

## Manual payments

Admin records bank transfer / cash via `record_payments` capability. Clearly labeled manual — not provider-verified.

## Online payments

1. Portal user initiates pay → pending payment + allocation created
2. Paystack checkout (amount from server `amountDueMinor`)
3. Webhook or return verification confirms via idempotent `confirmPaymentSuccess`

## Rules

- No over-allocation (rejected under row lock)
- Client cannot choose lower amount (default: full balance)
- Return URL alone does not mark paid
- Duplicate webhooks: one financial effect

## Reference

`PAY-YYYY-####` internal reference; provider reference stored separately.

## Deferred

Provider refund execution (schema allows future `refundedAmount`).
