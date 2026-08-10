# Contract ↔ Proposal Linkage

## Source types

- **PROPOSAL_ACCEPTANCE** — created from accepted proposal + immutable acceptance
- **MANUAL** — NDA, maintenance, long-term clients without proposal

## Creation requirements

Normal proposal-derived contracts require:

- `AgencyProposal.status = ACCEPTED`
- Valid `AgencyProposalAcceptance`

Unaccepted proposals are rejected.

## Prefill from acceptance

Create Contract prefills:

- Company, primary contact, proposal, acceptance
- Accepted total, currency, scope, deliverables, selected optional items
- Proposal owner

## Multiple contracts per acceptance

Allowed (e.g. service agreement + NDA). No global unique constraint on `proposalAcceptanceId`.

## Project linkage

If project exists from accepted proposal conversion, contract links via `projectId`. Signing does **not** create another project.

## UI integration

- Accepted proposal detail: linked contracts + **Create Contract**
- Project detail: contract status and links
- Contract detail: source proposal and project links

## Future billing boundary

V2.2 may add invoices/deposits. Contracts do not trigger billing in V2.1.
