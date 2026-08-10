# Agency Contracts (V2.1)

Contracts are the legal document presented for signature, separate from proposals and projects.

## Boundaries

| Layer | Purpose |
|-------|---------|
| **Proposal** | What Smartlance is offering |
| **Proposal Acceptance** | Immutable commercial scope the client accepted |
| **Contract** | Agreement presented for electronic signature |
| **Project** | What is being delivered |

Contract commercial values (total, scope, optional items) come from `AgencyProposalAcceptance`, never from live proposal edits.

## Workflow

```
Accepted Proposal → Create Contract → Select Template → Review → Send
→ Client signs / declines / requests correction → Fully signed snapshot
```

Signing does **not** auto-start projects, create invoices, or charge payments.

## Statuses

`DRAFT`, `READY_FOR_REVIEW`, `SENT`, `PARTIALLY_SIGNED`, `SIGNED`, `CORRECTION_REQUESTED`, `DECLINED`, `EXPIRED`, `VOIDED`, `ARCHIVED`

Transitions are centralized in `lib/contracts/status.ts`.

## Admin routes

- `/admin/agency/contracts` — list and metrics
- `/admin/agency/contracts/new` — manual contract
- `/admin/agency/contracts/[id]` — detail, edit, send, void
- `/admin/agency/contract-templates` — template library

## Portal routes

- `/portal/contracts` — accessible contracts only
- `/portal/contracts/[id]` — view, sign, decline, request correction

Portal uses explicit `AgencyContractClientAccess`. Proposal or project access alone is insufficient.

## Legal boundary

Smartlance provides software infrastructure only. Admins must supply and review contract language for their jurisdiction. The UI does not claim legally binding, qualified, or certified signature status.

## Retention

Signed contracts are business records. Do not auto-delete when CRM contacts are archived.

See also: `AGENCY_CONTRACT_PROPOSAL_LINKAGE.md`, `AGENCY_ELECTRONIC_SIGNATURES.md`, `AGENCY_CONTRACT_SECURITY.md`.
