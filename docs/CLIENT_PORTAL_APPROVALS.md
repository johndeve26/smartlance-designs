# Client Portal Approvals

## Route

`/portal/approvals` — unified approval center.

## Data source

`getPortalApprovals(portalUserId)` in `lib/portal/approvals.ts`.

## Approval types

| Kind | Authority |
|------|-----------|
| Deliverable | Any project member with access |
| Proposal | `DECISION_MAKER` role only |
| Contract | `CLIENT_SIGNATORY` only |
| Change request | Explicit approver access |

## Sections

1. **Needs your review** — `canAct === true`
2. **Awaiting others** — visible but not actionable for this user
3. **Previously approved** — deliverable approvals, proposal acceptances, contract signatures

## CTAs

Point to existing detail routes:

- Deliverables → project workspace
- Proposals → `/portal/proposals/[id]`
- Contracts → `/portal/contracts/[id]`
- Changes → change detail page

## History

Factual outcomes with dates — no internal workflow states exposed.

## No duplication

All mutations use existing domain actions (proposal accept, contract sign, deliverable review, change approve).
