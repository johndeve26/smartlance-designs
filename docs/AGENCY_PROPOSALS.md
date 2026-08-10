# Agency Proposals (V2)

Deal → Proposal → Project boundary:

- **CRM Deal** — sales opportunity (`CrmDeal`)
- **Proposal** — commercial offer (`AgencyProposal` + immutable sent versions)
- **Agency Project** — delivery (`AgencyProject`, V1 frozen)

Routes:

| Area | Path |
|------|------|
| Admin list | `/admin/agency/proposals` |
| Admin create | `/admin/agency/proposals/new?dealId=` |
| Admin detail | `/admin/agency/proposals/[id]` |
| Portal list | `/portal/proposals` |
| Portal detail | `/portal/proposals/[id]` |

Nav: Agency → **Projects**, **Proposals**, **Project Templates**.

See also: `AGENCY_PROPOSAL_VERSIONING.md`, `AGENCY_PROPOSAL_PRICING.md`, `AGENCY_PROPOSAL_ACCEPTANCE.md`, `AGENCY_PROPOSAL_PORTAL_SECURITY.md`, `AGENCY_PROPOSAL_PROJECT_CONVERSION.md`.
