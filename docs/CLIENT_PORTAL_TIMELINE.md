# Client Portal Unified Timeline

## Purpose

Single chronological feed of client-safe events across modules.

Function: `getPortalTimeline()` in `lib/portal/timeline.ts`.

## Sources

| Adapter | Source model |
|---------|--------------|
| Project activity | `AgencyProjectActivity` where `clientVisible` |
| Project updates | `AgencyProjectUpdate` where `clientVisible` |
| Proposals | Proposal activity / acceptance |
| Contracts | Contract signatures |
| Billing | Invoice issued / payment received |
| Onboarding | Onboarding activity |
| Change requests | Change request activity |

## DTO

```typescript
{
  id, type, title, description?,
  projectId?, projectName?,
  occurredAt, iconType, href?
}
```

## Privacy invariant

Never expose:

- Internal notes (`clientVisible: false`)
- AuditLog, CRM activity
- Admin security events
- Internal assessment comments

## Pagination

- Home: 5–10 events
- Project timeline: up to 20 per request, cursor support via `cursor` param

## Ordering

Merged and sorted by `occurredAt` descending.
