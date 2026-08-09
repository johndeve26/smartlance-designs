# Agency Projects

## Model

`AgencyProject` links to CRM identity without duplicating it:

- `primaryContactId` → `CrmContact` (required)
- `clientCompanyId` → `CrmCompany` (optional)
- `sourceDealId` → `CrmDeal` (optional, unique — one project per deal in V1)
- `ownerId` → `AdminUser`

Service type is stored as `AgencyServiceType` enum snapshot (`cmsServiceSlug` optional reference). CMS service page edits do not retroactively change project scope.

## Deal conversion

From a **WON** deal:

1. Admin clicks **Convert to Project** or uses the create wizard with `?dealId=`
2. Prefills: name, company, contact, budget, currency, service inference, owner
3. Idempotent: duplicate conversion returns existing project (`sourceDealId` unique)

Non-won deals cannot be converted directly; use manual project creation instead.

## Manual creation

Authorized admins can create projects without a deal (existing clients, referrals, internal work).

## Team

`AgencyProjectMember` with roles `OWNER`, `MEMBER`, `VIEWER`. Project access is scoped — members do not gain CRM-wide permissions.

## Dashboard metrics

Aggregates in `lib/agency/dashboard.ts`:

- Active projects
- Overdue tasks
- Awaiting client (outstanding requirements)
- Awaiting approval (deliverables in `READY_FOR_REVIEW`)
- Blocked projects (health = `BLOCKED`)
- Recently completed

## List filters

Status, health, owner, service type, client company, due/overdue, search (project name, client, contact).
