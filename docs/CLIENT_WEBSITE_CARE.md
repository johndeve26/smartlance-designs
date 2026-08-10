# Client Website Care

## Care status

`NOT_ENROLLED` · `ACTIVE` · `PAUSED` · `ENDED` — commercial service state only.

## Care events

`AgencyWebsiteCareEvent` records factual work:

- Types: MAINTENANCE, UPDATE, BACKUP, SECURITY, etc.
- Status: SCHEDULED, IN_PROGRESS, COMPLETED, etc.
- `clientSummary` — client-visible
- `internalNotes` — never serialized to portal

Clients view history; only trusted admin/domain actions create events.

## Display rules

- **Next maintenance**: only when explicitly scheduled
- **Last maintenance**: from completed care events or `lastMaintenanceAt`
- **Backup/SSL/uptime**: never implied without authoritative source data

## No SLA claims

Do not display response times or uptime guarantees unless contractually configured.
