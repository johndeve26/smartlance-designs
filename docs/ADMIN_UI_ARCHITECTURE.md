# Admin UI Architecture

## Shell

[`components/admin/AdminShell.tsx`](../components/admin/AdminShell.tsx)

- `AdminSidebar` — collapsible groups, localStorage preference
- `AdminTopbar` — breadcrumbs, env badge, View Site, user menu
- Mobile drawer for `< lg`

## Page patterns

[`components/admin/patterns/`](../components/admin/patterns/)

- `AdminListPage` — title, filters, table, pagination, empty state
- `AdminDetailHeader` — title, status badge, primary action, tabs
- `AdminSection` — labeled section without unnecessary card nesting
- `AdminAttentionList` / `AdminStatGrid` — dashboard widgets

## Dashboard

[`lib/admin/dashboard-home.ts`](../lib/admin/dashboard-home.ts) composes existing services:

1. Needs attention
2. At-a-glance stats (max 4–6)
3. Sales pipeline
4. Active delivery
5. Recent activity

## Nested layouts

- [`app/admin/crm/layout.tsx`](../app/admin/crm/layout.tsx) — CRM secondary tools
- [`app/admin/agency/layout.tsx`](../app/admin/agency/layout.tsx) — template links

Primary module navigation lives in the sidebar; per-page pill sub-navs are deprecated.

## Styling

Admin uses [`components/admin/admin.css`](../components/admin/admin.css) mapped to global tokens where possible.
