# Agency Change Assessments

## Separation

- **Request** (`requestDescription`, revisions) = what the client asked
- **Assessment** (`AgencyChangeRequestAssessment`) = Smartlance interpretation and commercial impact

## Versioning

- Assessments are versioned per change request (`versionNumber` unique per CR).
- Draft assessments editable while `UNDER_ASSESSMENT`.
- When sent for approval, `sentForApprovalAt` freezes that version.
- Further commercial changes create a new assessment version; superseded assessments cannot be approved.

## Fields

- `classification`, `scopeImpactSummary`, `clientScopeImpactSummary`
- `priceImpactMinor` (integer, ≥ 0), `currency`
- `timelineImpactDays`, `timelineImpactSummary`
- Optional `assessmentHash` for approval integrity

## Concurrency

`expectedUpdatedAt` optimistic guard on save/send prevents stale assessment publication.
