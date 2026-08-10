# Client Portal — Change Requests

## Access

Requires:
1. Authenticated `ClientPortalUser`
2. Active `AgencyProjectClientAccess` for the project
3. Change request belongs to that project

Commercial approval additionally requires `AgencyChangeRequestClientAccess` role **APPROVER**.

Project viewers without approver role see client-visible requests but cannot approve out-of-scope impact.

## Client actions

- Submit change request (title + description; no price/classification input)
- Respond to clarification (`NEEDS_CLARIFICATION`)
- Approve or decline when approver and status `AWAITING_CLIENT_APPROVAL`

## Visibility

- Client-safe assessment summaries only (`clientScopeImpactSummary`)
- Internal admin notes never exposed
- Commercial context shows original accepted value, approved changes total, and this change impact

## Attention

Portal home lists change requests awaiting the user's approval with price/timeline summary and deep link.

## Routes

- `/portal/projects/[id]/changes` — list + new request form
- `/portal/projects/[id]/changes/[changeId]` — detail, approval, clarification
