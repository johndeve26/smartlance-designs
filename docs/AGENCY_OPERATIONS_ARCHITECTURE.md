# Agency Operations Architecture

Smartlance Agency Operations is the **client delivery layer** — separate from CRM.

## System boundary

| CRM | Agency Operations |
|-----|-------------------|
| Prospects, leads, deals | Projects, milestones, tasks |
| Sales pipeline | Delivery workflow |
| Outreach sequences | Client requirements & deliverables |
| Sales inbox | Client portal & approvals |

**A deal is not a project.** Conversion creates a linked `AgencyProject` with `sourceDealId`; the deal stays `WON` in CRM.

## Lifecycle

```
WON Deal → Convert → Project Setup → Onboarding → Milestones → Tasks
→ Deliverables → Client Review → Approved / Changes Requested → Completion → Handoff
```

## Project states

- **Status:** `PLANNING`, `ONBOARDING`, `IN_PROGRESS`, `CLIENT_REVIEW`, `ON_HOLD`, `COMPLETED`, `CANCELLED`
- **Health:** human-controlled `ON_TRACK`, `AT_RISK`, `BLOCKED`

Status transitions go through `lib/agency/status.ts` — not raw Prisma writes.

## Project number

Human-readable `SL-YYYY-####` via `AgencyProjectCounter` (concurrency-safe upsert).

## Progress

Task completion percentage: `done tasks / total tasks × 100` (see `lib/agency/progress.ts`).

## Templates & snapshots

`AgencyProjectTemplate` defines milestones, tasks, and requirement placeholders. When applied to a project, content is **snapshotted** — later template edits do not mutate active projects.

## Activity vs audit

- **AgencyProjectActivity** — operational timeline (milestone completed, deliverable approved, etc.)
- **AuditLog** — security-sensitive admin mutations (project created, status changed, portal access granted)

## Future compatibility

Project model supports future: Proposals → Project, Invoices, Contracts, Change Requests — not implemented in V1.

## Admin navigation

**Agency** group: Projects (`/admin/agency`), Project Templates (`/admin/agency/templates`).

RBAC: `view_projects`, `manage_projects`, `manage_project_templates`.
