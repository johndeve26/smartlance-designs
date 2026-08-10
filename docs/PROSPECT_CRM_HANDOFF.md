# Prospect CRM Handoff

## Account signup

- Upserts `CrmContact` (source `PROSPECT_WORKSPACE`)
- Does **not** create Lead or Subscriber

## Request submit

- Upserts Contact (dedupe by `emailNormalized`)
- Upserts active Lead via `upsertLeadFromEnquiry`
- Records `FORM_SUBMISSION` activity with request metadata

## Source detail

`FREE_WEBSITE_REVIEW`, `WEBSITE_BRIEF`, or `PROSPECT_WORKSPACE`

## Idempotency

Unique `submissionIdempotencyKey` prevents duplicate requests/leads on double-click.
