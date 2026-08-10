# Prospect Workspace UI Architecture

## Shell

[`components/prospect/ProspectShell.tsx`](../components/prospect/ProspectShell.tsx)

- Isolated from public marketing chrome
- Desktop: compact sidebar with main nav + footer (Account, Sign out)
- Mobile: bottom nav (Home · Reviews · Briefs · Requests · More)

## Home hierarchy

[`app/workspace/page.tsx`](../app/workspace/page.tsx)

1. Proposal ready (if applicable)
2. Continue where you left off
3. Saved website reviews
4. Website briefs
5. Active request

## Navigation config

[`lib/prospect/navigation.ts`](../lib/prospect/navigation.ts)

## Bridge experiences

Public entry points that feed the workspace:

- `/free-website-review` — review entry (redesigned V1.1: form-first, goal cards)
- `/free-website-review/[id]` — review result (`ReviewResultView`)
- `/website-brief` — brief entry (`WebsiteBriefBuilder` + section sidebar)

List pages (`/workspace/reviews`, `/workspace/briefs`, `/workspace/requests`) use shared EmptyState, PageHeader-style titles, and design-system cards.

These use public chrome; authenticated work happens in `/workspace`.

## Copy tone

Guided and continuation-focused: "Continue your brief", "Your proposal is ready", etc.
