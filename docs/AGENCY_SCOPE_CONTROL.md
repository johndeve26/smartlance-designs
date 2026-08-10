# Agency Scope Control

## Original scope preservation

- `AgencyProposalAcceptance.acceptedTotal`, `scopeHash`, and linked version remain unchanged when change requests are approved.
- Manual projects without proposal acceptance use project summary / recorded scope as baseline.
- Admin assessment UI shows **accepted version snapshot**, not live proposal drafts.

## Current scope (conceptual)

```
Current agreed delivery scope =
  Original accepted scope
  + Approved & applied change requests
```

No single mutable “current scope blob” is rewritten.

## Classification (human only)

- **IN_SCOPE** — covered by existing agreement; price impact normally 0; admin may approve internally.
- **OUT_OF_SCOPE** — requires client approver decision before application; may have price and/or timeline impact (price ≥ 0 only in V3.1).

Scope reductions are recorded but do not generate negative invoices (manual financial review if needed).
