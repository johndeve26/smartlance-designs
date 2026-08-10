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

## Starter templates

Seven editable starter templates are available via explicit **Install starter templates** action (requires `manage_project_templates`). They are identified by stable `systemKey` values and install idempotently — edited starters are never overwritten.

**Page loads do not mutate the database.** Visiting `/admin/agency/templates` is read-only from a persistence perspective.

## Project numbers

Format: `SL-YYYY-####` (minimum 4 digits; expands naturally beyond 9999).

Allocation uses PostgreSQL `INSERT … ON CONFLICT DO UPDATE` on `AgencyProjectCounter` for atomic yearly increments inside the project creation transaction. Bounded retry handles rare unique collisions on `projectNumber`.

## Private file storage

| Environment | Driver |
|-------------|--------|
| Development | `local` (filesystem under `storage/agency/private/`) |
| Production | `s3` required (`AGENCY_PRIVATE_STORAGE_DRIVER=s3`) |

Production startup validation fails if S3 is not configured. Downloads are authorized per-request; S3 objects use short-lived signed URLs (10 minutes). No public ACLs or permanent URLs.
