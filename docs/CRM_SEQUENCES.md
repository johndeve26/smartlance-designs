# CRM Sequences

## Step types

1. **EMAIL** — uses shared SMTP/Resend via `lib/email`
2. **WAIT** — delay only (min 60 minutes between non-wait steps)
3. **TASK** — creates real `CrmTask`; optional `WAIT_FOR_TASK_COMPLETION`

## Example flow

```
Day 0  → Email (initial outreach)
Wait 3 days
       → Task (review prospect)
Wait 2 days (after task if WAIT_FOR_TASK_COMPLETION)
       → Email (follow-up)
```

## Enrollment lifecycle

`ACTIVE` → `PAUSED` | `COMPLETED` | `STOPPED` | `FAILED`

Stop reasons: suppression, archive, deal won, lead disqualified, manual, opt-out, manual reply.

## Reliability semantics

- **Database-idempotent execution** — one claim at a time per execution row
- **Best-effort duplicate prevention** — not exactly-once SMTP delivery
- **Ambiguous sends** — if provider accepts but DB finalization fails, state becomes `AMBIGUOUS` / `SENT_UNCONFIRMED`; operator must review
- **No blind retry** after known provider acceptance

## Activation requirements

- Sequence in DRAFT with valid steps
- Actor has `send_crm_email`
- SMTP or Resend configured

## Bulk enrollment

- Max 100 contacts per batch
- Preview shows eligible / suppressed / no-email / already-enrolled
- Explicit confirmation required
