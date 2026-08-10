# Agency Change Project Application

## Explicit apply

`APPROVED` does **not** mutate the project. Admin must run **Apply to Project**.

## Application record

`AgencyChangeRequestApplication` (unique per CR) stores:
- `appliedById`, `appliedAt`
- `previousTargetDueDate`, `newTargetDueDate`
- `applicationSnapshotJson` (work items created)

## Work items

`AgencyChangeRequestWorkItem` defines tasks/deliverables/requirements to create on apply.

Created entities link via optional `changeRequestId` on:
- `AgencyProjectTask`
- `AgencyDeliverable`
- `AgencyClientRequirement`

## Timeline

Approved `timelineImpactDays` does not auto-update project dates. Apply step confirms target date shift (calendar days).

## Payment gate

If `requirePaymentBeforeImplementation` and price > 0, apply blocked until invoice `PAID` (confirmed billing facts only).

## Implemented

Separate admin action after delivery work completes. `APPLIED` ≠ `IMPLEMENTED`.

## Idempotency

Concurrent apply attempts create exactly one application and one set of linked work items.
