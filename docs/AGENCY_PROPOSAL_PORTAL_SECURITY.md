# Proposal Portal Security

- No public proposal URLs.
- Portal layout: `robots: noindex`.
- Access via explicit `AgencyProposalClientAccess` (not company-wide, not project access).
- Roles: `VIEWER`, `DECISION_MAKER` (only decision makers can accept/decline/request changes).
- Revoked access (`revokedAt`) denies immediately.
- Client DTO: `toClientProposalDto()` — no internal notes, admin IDs, or CRM data.
- Portal actions use `assertSameOrigin()` + `requirePortalUser()`.
- Admin actions use RBAC: `view_proposals`, `manage_proposals`, `send_proposals`.

Magic-link invite reuses `ClientPortalInvite` + portal session (V1 pattern).
