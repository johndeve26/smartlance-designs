# CRM Outreach Operations

## Deployment

```bash
npx prisma migrate deploy
npx prisma generate
npm run build
```

Set `CRM_SCHEDULER_SECRET` in production and configure cron:

```bash
curl -X POST https://your-site/api/internal/crm-sequence-scheduler \
  -H "Authorization: Bearer $CRM_SCHEDULER_SECRET"
```

Recommended: every 5–15 minutes.

## Reliability runbook (V2.1)

### Stuck PROCESSING
Stale claims recover automatically after claim lease expires (~5 min). Check Outreach → Needs attention.

### Ambiguous send
Provider may have accepted the message. Do **not** auto-retry. Use "Mark as sent (no resend)" after verifying delivery, or follow up manually outside the sequence.

### SMTP auth failure
Scheduler aborts remaining email work in the current run. Fix SMTP config before next cron.

### Concurrent cron overlap
Safe — atomic claims prevent duplicate sends for the same execution.

### Integration tests
```bash
TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/smartlance_crm_test npm run test:crm:integration
```
Requires `NODE_ENV=test`. Refuses production-like database names unless `CRM_INTEGRATION_TEST_ALLOW=1`.

## Manual workflow

1. Create segment (filter + preview count)
2. Create sequence (draft steps)
3. Activate sequence (`send_crm_email` required)
4. Enroll contact(s) with eligibility review
5. Scheduler sends due steps
6. Monitor Admin → CRM → Outreach

## Daily limits (defaults)

- Max 50 sequence emails / day
- Min 24h between automated emails to same contact
- Min 60 minutes between steps
- Weekday send window 08:00–18:00 UTC

Adjust via `CrmOutreachSettings` record.

## Manual reply

Admin can mark "Reply recorded (manual)" — optionally stops sequence. Does not create fake inbound email records.

## Deferred

Inbound mailbox sync, open/click tracking, bounce webhooks, AI personalization.
