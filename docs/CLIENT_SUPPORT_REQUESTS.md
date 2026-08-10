# Client Support Requests

## Model

`AgencySupportRequest` with human-readable `supportNumber` (`SUP-YYYY-####`) via atomic PostgreSQL counter.

## Categories

WEBSITE_CHANGE, CONTENT_UPDATE, TECHNICAL_ISSUE, QUESTION, ACCESS_HELP, NEW_FEATURE, OTHER.

## Priority

NORMAL, IMPORTANT, URGENT — urgent does not guarantee SLA unless configured.

## Status lifecycle

```
OPEN → IN_PROGRESS → WAITING_ON_CLIENT → IN_PROGRESS → RESOLVED → CLOSED
RESOLVED → OPEN (still need help)
```

Clients cannot set internal status via payload.

## Waiting on

`SMARTLANCE` · `CLIENT` · `NONE` — surfaced clearly in portal.

## Attachments

Private files via `AgencySupportRequestFile` → `AgencyProjectFile`. Portal auth + website/support authorization on every fetch.

## Change request boundary

Support may link to existing V3.1 Change Request. Client sees "Scope review required" — no duplicate pricing logic.
