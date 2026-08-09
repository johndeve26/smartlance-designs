# Client Portal

## Authentication

Separate from admin auth:

- `ClientPortalUser` — one per CRM contact (`contactId` unique)
- Magic-link invites via `ClientPortalInvite` (hashed token, expiry, one-time/bounded use)
- Sessions via `ClientPortalSession` + `smartlance_portal_session` cookie

No social OAuth in V1.

## Explicit project access

`AgencyProjectClientAccess` grants per-project, per-contact access. **No domain-wide auto-access.**

Same-company contacts without explicit access are denied.

## Portal routes

- `/portal` — home (accessible projects, needs attention)
- `/portal/login` — request magic link
- `/portal/auth/[token]` — accept invite, set session
- `/portal/projects/[id]` — project view
- `/portal/logout`

All routes: `noindex`, private cache headers.

## Client-visible data

Portal shows only `clientVisible = true` items:

- Milestones, tasks (if flagged), requirements, deliverables, updates, activity

Never exposed: internal notes, private task details, CRM history, health commentary, audit log.

## Client actions

- Mark requirements received / provide acknowledgement
- Approve deliverables
- Request changes (with comment)

Clients cannot edit internal project tasks.

## Access revocation

Admin revokes via `AgencyProjectClientAccess.revokedAt`. Active sessions should fail authorization on next request.

## Invitation flow

1. Admin invites contact from project detail
2. Secure token emailed (hashed at rest)
3. Client clicks link → session created → project access confirmed

Invite statuses: `PENDING`, `ACCEPTED`, `REVOKED`, `EXPIRED`.
