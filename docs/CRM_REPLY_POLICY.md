# CRM Reply Policy

## What a verified reply means

The mailbox received a message that **header-matches** a prior outbound CRM email.

It does **not** mean:

- The Contact is interested
- Lead should become CONNECTED
- Temperature should increase
- A Deal should be created

## Automation response

| Event | Sequence behavior | CRM state |
|-------|-------------------|-----------|
| Verified human reply (exact thread) | STOP all active sequences | Unchanged |
| Automated (OOO/auto-submitted) | PAUSE for review | Unchanged |
| Known Contact, no thread | Review task only | Unchanged |
| Unmatched sender | Inbox queue | No Contact created |

## Manual reply

`MANUAL_REPLY_RECORDED` remains for replies outside synced mailbox. Does not create fake INBOUND CrmEmail.

## Analytics

- **Verified replies** — inbound EXACT_THREAD, not automated
- **Manual replies recorded** — separate metric
