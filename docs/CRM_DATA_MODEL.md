# CRM Data Model

## Enums

### Contact
- `CrmContactLifecycleStage`: PROSPECT, LEAD, OPPORTUNITY, CLIENT, PAST_CLIENT, OTHER
- `CrmContactSource`: MANUAL, CONTACT_FORM, WEBSITE_REVIEW, PROJECT_PLANNER, REFERRAL, …
- `CrmContactEmailStatus`: SENDABLE, DO_NOT_EMAIL, UNSUBSCRIBED, BOUNCED, COMPLAINED, INVALID, SUPPRESSED

### Lead
- `CrmLeadStatus`: NEW, ATTEMPTING, CONNECTED, QUALIFIED, UNQUALIFIED, BAD_TIMING, CLOSED
- `CrmLeadTemperature`: COLD, WARM, HOT (human-editable, not AI score)
- `CrmLeadDisqualificationReason`: NO_BUDGET, NOT_A_FIT, …

### Deal
- `CrmDealStage`: NEW_OPPORTUNITY → DISCOVERY → QUALIFIED → PROPOSAL → NEGOTIATION → WON / LOST
- `CrmDealLostReason`: PRICE, NO_RESPONSE, COMPETITOR, …

### Task
- `CrmTaskStatus`: OPEN, COMPLETED, CANCELLED
- `CrmTaskPriority`: LOW, NORMAL, HIGH

## Models

- `CrmCompany` — organization; optional domain from website
- `CrmContact` — person; unique `emailNormalized` when email present
- `CrmLead` — sales lead linked to contact
- `CrmDeal` — pipeline opportunity
- `CrmActivity` — timeline events
- `CrmTask` — follow-up actions
- `CrmEmail` — outbound email bodies (manual send)
- `CrmEmailTemplate` — reusable templates

## Indexes

Key indexes: `emailNormalized`, `contactId+occurredAt`, `status+dueAt`, deal `stage`, lead `status`/`temperature`.

## Migration

```bash
npx prisma migrate deploy
npx prisma generate
```

Backup database before applying in production.
