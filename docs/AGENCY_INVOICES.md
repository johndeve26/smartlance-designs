# Agency Invoices

## Lifecycle

1. **DRAFT** — editable line items, billing identity, dates
2. **Issue** — freezes snapshot, assigns number, grants portal access, sends notification
3. **ISSUED / PARTIALLY_PAID / PAID** — financial fields immutable
4. **VOID** — unpaid invoices only (`amountPaidMinor === 0`)
5. **OVERDUE** — derived: issued + past due date + balance > 0

## Numbering

`INV-YYYY-####` via atomic `AgencyInvoiceCounter` — no `SELECT MAX + 1`.

## Sources

Manual, proposal acceptance, billing schedule installment, contract, project, retainer.

## Correction policy

Void incorrect unpaid invoice → create replacement. No silent edits to issued financial history.

## Snapshots

On issue: `billingNameSnapshot`, `billingEmailSnapshot`, `billingAddressSnapshotJson`, line items, `snapshotHash`.

## Server totals

`subtotalMinor`, `discountMinor`, `taxMinor`, `totalMinor`, `amountPaidMinor`, `amountDueMinor` — all server-derived.

## Email

Transactional issue notification with portal link. Email failure does not revert issued status.
