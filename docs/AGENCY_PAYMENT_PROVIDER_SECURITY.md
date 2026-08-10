# Agency Payment Provider Security

## PCI boundary

- No raw card PAN/CVV storage
- Checkout hosted by Paystack when configured
- Provider secrets server-only (`PAYSTACK_SECRET_KEY`)

## Webhook security

- Route: `/api/webhooks/payments/paystack`
- HMAC-SHA512 signature verification (`x-paystack-signature`)
- Raw body used for signature — parsed after verification
- `AgencyPaymentWebhookEvent` unique on `(provider, providerEventId)`

## Idempotency

- Duplicate events: acknowledged, no duplicate allocation
- Webhook + return verification race: single `confirmPaymentSuccess` path with row locks
- Monotonic payment status — success not downgraded by delayed pending events

## Amount authority

Payment session amount from server invoice `amountDueMinor`. Mismatched provider amount → `NEEDS_REVIEW`, not silent paid.

## Environment

Use Paystack test keys in development. Never expose secret key to browser or portal DTOs.

## Open redirect

Callback URLs server-controlled from `NEXT_PUBLIC_SITE_URL`.
