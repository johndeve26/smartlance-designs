# Client Portal Attention Engine

## Purpose

Derived, non-persisted aggregation of everything the **current portal user** can act on.

Functions: `getPortalAttentionItems()`, `getPortalAttentionCount()` in `lib/portal/attention.ts`.

## Item types

| Type | Source |
|------|--------|
| `DELIVERABLE_APPROVAL` | Deliverables in `READY_FOR_REVIEW` / `CHANGES_REQUESTED` |
| `CLIENT_REQUIREMENT` | Requirements in `REQUESTED` / `REJECTED` |
| `ONBOARDING` | Incomplete onboarding with client actions |
| `CLARIFICATION` | Onboarding / requirement clarifications |
| `CONTRACT_SIGNATURE` | Contracts awaiting client signatory |
| `PROPOSAL_DECISION` | Proposals awaiting decision maker |
| `INVOICE_DUE` / `INVOICE_OVERDUE` | Payable invoices (billing admin) |
| `CHANGE_REQUEST_APPROVAL` | Change requests awaiting approver |
| `CHANGE_REQUEST_CLARIFICATION` | Change requests needing client input |
| `MILESTONE_REVIEW` | Milestones in `CLIENT_REVIEW` |

## DTO

```typescript
{
  id, type, title, description,
  projectId?, projectName?,
  dueAt?, urgency, // NORMAL | IMPORTANT | OVERDUE
  ctaLabel, ctaHref, canAct, createdAt, sortPriority
}
```

## Priority ordering

Deterministic — no AI ranking:

1. Overdue payment
2. Signature / approval due
3. Clarification
4. Onboarding
5. Upcoming payment
6. Other

## Authority

- `canAct: true` only when this user has authority (signer, decision maker, billing admin, approver)
- Viewers see “View” not “Approve” / “Sign” / “Pay”
- Filter **before** aggregation — never aggregate then hide in UI

## Isolation

Attention is scoped to projects/invoices/documents the user can access. Cross-client items never appear.
