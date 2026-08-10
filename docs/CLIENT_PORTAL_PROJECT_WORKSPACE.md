# Client Portal Project Workspace

## Route

`/portal/projects/[id]` — tabbed workspace via `?tab=overview|timeline|files|changes`.

## Data source

`getPortalProjectWorkspace(portalUserId, projectId)` in `lib/portal/project-workspace.ts`.

## Header

- Project name, service label, status, current stage
- Progress bar (client-visible tasks or milestone %)
- Target completion date
- Smartlance contact (project owner)

## Overview tab

1. Needs your attention (project-scoped)
2. Project stages (milestone timeline)
3. What we need from you (requirements)
4. Awaiting your approval (deliverables with review actions)
5. Latest update (most recent client-visible update)
6. Quick actions: onboarding, changes, files, billing

## Timeline tab

Project-scoped `getPortalTimeline()` — paginated client-safe events.

## Files tab

Project-filtered `getPortalFiles()`.

## Changes tab

Summary of change requests with link to `/portal/projects/[id]/changes`.

## Excluded

- Internal notes, health, budget
- Non–client-visible tasks
- CRM / audit data

## Mutations

Deliverable approve/request-changes reuse existing portal actions. Change requests use existing V3.1 flows.
