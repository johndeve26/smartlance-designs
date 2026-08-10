# Client Portal UI Architecture

## Shell

[`components/portal/PortalShell.tsx`](../components/portal/PortalShell.tsx)

- `PortalSidebar` — grouped nav with subtle "Ongoing" label
- `PortalMobileNav` — bottom tabs
- Token-based styling (no hardcoded brand hex)

## Home hierarchy

[`app/portal/page.tsx`](../app/portal/page.tsx)

1. Greeting
2. Needs your attention
3. Active projects
4. Your websites (conditional)
5. Recent updates

## Attention engine

[`lib/portal/attention.ts`](../lib/portal/attention.ts) — unified actionable items across deliverables, proposals, contracts, invoices, onboarding, changes, support.

Badge shown on Approvals nav only.

## Status language

Client-safe labels in [`lib/portal/status-labels.ts`](../lib/portal/status-labels.ts).

## Mobile

Primary actions remain near top. Bottom nav: Home · Projects · Files · Billing · More.
