# Proposal Pricing

- Money stored as `Decimal(12,2)` + single proposal `currency`.
- Line items: `AgencyProposalLineItem` with types `SERVICE`, `ADD_ON`, `DISCOUNT`, `OTHER`.
- Optional add-ons: `isOptional`, default selection via `isSelectedByDefault`.
- **Server authority**: `calculateVersionPricing()` in `lib/proposals/pricing.ts`.
- Client acceptance recalculates total from stored line items + selected optional IDs.
- Browser totals are preview only; tampered totals/IDs are rejected.

Accepted total stored on `AgencyProposalAcceptance.acceptedTotal` (immutable).
