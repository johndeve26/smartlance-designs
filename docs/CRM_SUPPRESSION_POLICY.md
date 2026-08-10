# CRM Suppression Policy

## Server-side block (always at send time)

Reload contact `emailStatus` before every sequence email. Block if:

`DO_NOT_EMAIL`, `UNSUBSCRIBED`, `BOUNCED`, `COMPLAINED`, `INVALID`, `SUPPRESSED`

No "send anyway" bypass in Admin.

## Stop on suppression

Active enrollments → `STOPPED` with reason `SUPPRESSED`.

## Outreach opt-out

- Route: `/outreach/unsubscribe?token=...`
- Sets `DO_NOT_EMAIL`, stops sequences
- Does **not** create Subscriber

## Marketing vs sales

Subscriber unsubscribe may sync to CRM via `syncSubscriberStatusToContact` for shared emails. Marketing consent remains distinct from one-to-one sales correspondence.

## Pause vs suppression

- **Pause outreach** — temporary; enrollments paused, contact flag set
- **Suppression** — stronger; blocks all automated email

## Audience separation

Cold CRM contacts are never auto-subscribed to Audience.
