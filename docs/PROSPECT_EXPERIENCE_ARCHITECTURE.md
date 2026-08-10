# Prospect Experience Architecture

Smartlance Prospect Experience V1 connects anonymous value (Website Review, Brief Builder) to authenticated workspace, CRM handoff, and existing Proposal / Client Portal systems.

## Lifecycle

```
Anonymous visitor → Review / Brief → Save (account) → Workspace
  → Submit Request → CRM Contact/Lead → Admin review
  → Proposal (existing V2) → Accept → Client Portal (same login)
```

## Identity

- Reuses `ClientPortalUser` + `ClientPortalSession` + magic links
- `AgencyProspectProfile` stores minimal prospect metadata (1:1 with portal user)
- Prospect ≠ Client: client access requires explicit resource grants
- Stage labels are UX-only; authorization is grant-based

## Domain modules

| Module | Path |
|--------|------|
| Reviews | `lib/prospect/reviews/` |
| Briefs | `lib/prospect/briefs/` |
| Requests | `lib/prospect/requests/` |
| AI | `lib/prospect/ai/` |
| Workspace | `lib/prospect/workspace/` |

## Data models

See migration `20260813100000_prospect_experience_v1`.

## Security

- SSRF-safe crawl via `lib/ai/ssrf.ts`
- Claim tokens hashed, single-use
- Cross-prospect isolation enforced server-side
- Workspace routes: `noindex`, private cache

## CRM

- Account signup upserts Contact (no Lead)
- Request submit upserts Contact + Lead + activity
- Contact ≠ Subscriber (no marketing opt-in)

## Proposals

- Admin creates proposal with `sourceProspectRequestId`
- Existing `grantProposalAccess` + portal proposal routes

See also: `FREE_WEBSITE_REVIEW.md`, `WEBSITE_BRIEF_BUILDER.md`, `PROSPECT_WORKSPACE.md`, `PROSPECT_REQUESTS.md`, `PROSPECT_TO_CLIENT.md`, `PROSPECT_EXPERIENCE_SECURITY.md`.
