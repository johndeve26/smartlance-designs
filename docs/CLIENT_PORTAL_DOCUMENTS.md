# Client Portal Documents

## Route

`/portal/documents` — unified proposals and contracts.

List routes `/portal/proposals` and `/portal/contracts` redirect here. Detail routes unchanged for email CTAs.

## Data source

`getPortalDocuments(portalUserId)` in `lib/portal/documents.ts`.

## Sections

1. **Needs your decision** — proposals needing decision + contracts needing signature (top)
2. **Proposals** — all accessible proposals with status, amount, date
3. **Contracts** — all accessible contracts with status, signed date

## Client-safe fields

- Proposal/contract number, title, status label, amount, dates
- CTA: Review / View / Review & sign

## Excluded

- Internal proposal notes
- Contract template internals
- CRM correspondence

## Historical records

Accepted proposals and signed contracts remain viewable indefinitely.

## Authority

- Proposal “Review proposal” only for `DECISION_MAKER`
- Contract “Review & sign” only for `CLIENT_SIGNATORY`
