# Agency Change Billing

## Separation from original schedule

Approved change billing is **separate** from proposal acceptance billing schedules. Original installments are never silently modified.

## Change invoice

- Source: `AgencyInvoiceSource.CHANGE_REQUEST`
- Unique `changeRequestId` on invoice (idempotent create)
- Amount from immutable `AgencyChangeRequestApproval.approvedPriceImpactMinor`
- Created as **DRAFT** — admin issues via existing billing workflow
- Zero-price approved changes: no invoice

## Commercial summary

`getProjectCommercialScopeSummary()` returns:
- `originalAcceptedValueMinor` (from acceptance, unchanged)
- `approvedChangesMinor`
- `currentApprovedValueMinor` (derived sum)
- `invoicedChangeValueMinor`, `paidChangeValueMinor`, `unbilledApprovedChangeMinor`

## No credits in V3.1

Negative price impacts and credit notes are deferred. Scope reductions may flag manual financial review.
