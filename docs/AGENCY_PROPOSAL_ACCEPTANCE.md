# Proposal Acceptance

`AgencyProposalAcceptance` records immutable facts:

- `acceptedVersionId`, `portalUserId`, `contactId`, `acceptedAt`
- `acceptedTotal`, `currency`
- `selectedOptionalItemIds` (JSON)
- optional `scopeHash` (SHA-256 of version + selections + total)

Acceptance runs in a DB transaction with conditional status update (`SENT`/`CHANGES_REQUESTED` → `ACCEPTED`). Duplicate accept returns existing acceptance (idempotent).

**Not** e-sign or contract — simple terms acknowledgment only.

Identity is always server-derived from portal session + `AgencyProposalClientAccess` role `DECISION_MAKER`.
