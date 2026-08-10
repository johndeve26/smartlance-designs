# Client Portal Home

## Purpose

`/portal` is the client command center. It answers: **“What needs my attention?”** and **“How are my projects going?”**

## Sections (visual hierarchy)

1. **Greeting** — time-aware salutation using contact display name
2. **Needs your attention** — actionable items only (`canAct === true`)
3. **Active projects** — up to 6 non-completed projects with progress and next action
4. **Recent activity** — latest 8 unified timeline events

## Data source

`getPortalHome(portalUserId)` in `lib/portal/home.ts` batches:

- Contact display name
- Attention items (parallel with project summaries)
- Timeline
- Active project summaries with progress from client-visible tasks or milestone completion

## Empty states

When no actionable attention items:

> You're all caught up.

Recent activity still displays below.

## Performance

Home limits: 15 attention items, 6 projects, 8 timeline events. Database reads are parallelized — not serial per module.

## Links

- “View all” on attention → `/portal/approvals`
- “View all projects” → `/portal/projects`
