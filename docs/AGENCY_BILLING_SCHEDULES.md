# Agency Billing Schedules

Deposit, milestone, and final payments from accepted proposal totals.

## Models

- `AgencyBillingSchedule` — linked to proposal acceptance, contract, or project
- `AgencyBillingInstallment` — sequence, label, type (`DEPOSIT`, `MILESTONE`, `FINAL`, `OTHER`), amount

## Validation

- Percentage schedules must sum to 100% (10000 basis points)
- Scheduled total must not exceed accepted proposal total
- Last installment absorbs rounding remainder (`splitByPercentages`)

## Workflow

Admin creates schedule → activates → creates invoice per installment manually. No auto-invoice on milestone status change in V2.2.

## Immutability

Once first invoice issued from schedule, prior installment amounts should not change casually.

## Example

50% deposit / 30% design approval / 20% launch on $10,000 → $5,000 / $3,000 / $2,000.
