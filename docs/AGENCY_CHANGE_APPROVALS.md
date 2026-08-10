# Agency Change Approvals

## Out-of-scope workflow

1. Admin saves assessment with commercial impact
2. Admin selects client **APPROVER** contacts (`AgencyChangeRequestClientAccess`)
3. Status → `AWAITING_CLIENT_APPROVAL`
4. Approver reviews exact scope/price/timeline in portal
5. Explicit consent → immutable `AgencyChangeRequestApproval`

## In-scope workflow

Admin approves internally after assessment — no commercial portal approval required.

## Approval snapshot

Stores: assessment id, price/timeline snapshots, consent text, client name/email snapshots, optional assessment hash.

**Never edited in place.** If terms change after approval, create a new change request.

## Decline

`AgencyChangeRequestDecision` records decline; request status `DECLINED`. No project application or invoice.

## Race safety

Row lock + unique approval/decision per change request; concurrent approve/decline yields one terminal outcome.

## Not contract signature

Change approval is operational/commercial consent — not electronic contract signature or proposal re-acceptance.
