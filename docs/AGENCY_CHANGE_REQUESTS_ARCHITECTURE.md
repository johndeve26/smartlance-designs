# Agency Change Requests — Architecture (V3.1)

## Principle

**Original accepted proposal scope is history.** Change requests are separate facts layered on top:

```
Original Accepted Scope (AgencyProposalAcceptance — immutable)
  + Approved Change Request #1
  + Approved Change Request #2
  = Current approved project value (derived, never written back)
```

Signed contracts are not amended automatically. When material obligations change, the UI may show: *Contract amendment may be required.*

## Boundaries

| Entity | Role |
|--------|------|
| `AgencyProposalAcceptance` | What the client originally accepted |
| `AgencyContract` | What was signed (unchanged by CR workflow) |
| `AgencyChangeRequest` | Requested deviation from current agreed work |
| `AgencyChangeRequestAssessment` | Smartlance human impact interpretation |
| `AgencyChangeRequestApproval` | Immutable client commercial consent snapshot |
| `AgencyInvoice` (`CHANGE_REQUEST` source) | Optional billing for approved paid changes |
| `AgencyChangeRequestApplication` | Explicit project mutation record |

## Status vs classification

- **Status** lifecycle: `DRAFT` → `SUBMITTED` → assessment/clarification → `AWAITING_CLIENT_APPROVAL` → `APPROVED` / `DECLINED` → `APPLIED` → `IMPLEMENTED`
- **Classification** (separate): `UNASSESSED`, `IN_SCOPE`, `OUT_OF_SCOPE`

## Routes

**Admin:** `/admin/agency/change-requests`, `/admin/agency/change-requests/[id]`, project panel

**Portal:** `/portal/projects/[id]/changes`, `/portal/projects/[id]/changes/[changeId]`

## Domain layer

Central functions in `lib/change-requests/change-requests.ts` — no scattered status writes.

## Security

- RBAC: `view_change_requests`, `manage_change_requests`
- Portal: project access + explicit `AgencyChangeRequestClientAccess` (`VIEWER` / `APPROVER`)
- Same-company without project access: denied
- Session-derived approver identity; browser cannot set price/timeline

## Related docs

- [Scope control](./AGENCY_SCOPE_CONTROL.md)
- [Assessments](./AGENCY_CHANGE_ASSESSMENTS.md)
- [Approvals](./AGENCY_CHANGE_APPROVALS.md)
- [Project application](./AGENCY_CHANGE_PROJECT_APPLICATION.md)
- [Billing](./AGENCY_CHANGE_BILLING.md)
- [Client portal](./CLIENT_PORTAL_CHANGE_REQUESTS.md)
