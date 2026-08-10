# Production Runbook

Operational procedures for Smartlance deployment.

---

## Pre-deploy checklist

1. Review `docs/PRODUCTION_READINESS.md` — all P1 blockers resolved
2. Backup production database (see Backup below)
3. Confirm migration plan reviewed
4. Confirm env vars in hosting provider match `docs/PRODUCTION_ENVIRONMENT.md`

---

## Deploy

1. Deploy application build (`npm run build` in CI)
2. Run migrations against target database:

```bash
DATABASE_URL="postgresql://..." npx prisma migrate deploy
npx prisma migrate status   # expect: no pending migrations
```

3. Restart application processes
4. Smoke test (below)

**Never** run `prisma migrate reset` against staging/production with real data.

---

## Smoke test (post-deploy)

| Check | URL / action |
|-------|----------------|
| Public home | `/` |
| Admin login | `/admin/login` |
| CRM contacts | `/admin/crm/contacts` |
| Email settings | `/admin/email` |
| Free review form | `/free-website-review` |
| Workspace login | `/workspace/login` |
| Portal login | `/portal` (redirects if unauthenticated) |
| System status | `/admin/system` |

---

## Schedulers (external cron required)

Invoke with `Authorization: Bearer $SECRET`:

| Job | Route | Suggested cadence |
|-----|-------|-------------------|
| CRM sequences | `POST /api/internal/crm-sequence-scheduler` | Every 5–15 min |
| Inbound email | `POST /api/internal/crm-inbound-email-sync` | Every 5–15 min |
| Retainer billing | `POST /api/internal/agency-billing-scheduler` | Daily |
| Onboarding reminders | `POST /api/internal/agency-onboarding-scheduler` | Daily |

If cron is not configured, document as **pending** — features degrade gracefully but do not run automatically.

---

## Paystack

- Webhook URL: `https://<domain>/api/webhooks/payments/paystack`
- Configure in Paystack dashboard (TEST keys on staging)
- Return URL: portal billing return route (see `app/portal/billing/return`)
- Verify: issue invoice → pay in TEST mode → webhook + allocation

---

## Email

1. Configure Admin SMTP at `/admin/email`
2. Run connection test + test send
3. Verify SPF, DKIM, DMARC on sending domain (DNS — manual)
4. Confirm magic links use `NEXT_PUBLIC_SITE_URL` (not localhost)

---

## Backup

### Database

Use provider-native backup (Neon snapshots, RDS, etc.) **plus** periodic logical export:

```bash
pg_dump "$DATABASE_URL" --format=custom --file=smartlance-backup-$(date +%Y%m%d).dump
```

### Restore drill (non-production only)

1. Create empty database
2. `pg_restore` or `psql` from dump
3. `npx prisma migrate status`
4. Spot-check: Contact, Project, Invoice, Payment, Prospect Request counts

### Object storage

Database backup **does not** include S3/R2 objects. Rely on bucket versioning/lifecycle policies.

---

## Rollback

For **additive** migrations:

1. Deploy previous application version
2. New columns/tables remain unused — generally safe
3. Do **not** drop schema without explicit downgrade plan

For **breaking** migrations: restore from backup; migration rollback is not automated.

---

## Incident first steps

1. Check `/admin/system` and hosting logs
2. Note error reference digest if user-reported
3. Verify `DATABASE_URL` connectivity
4. Verify scheduler secrets not rotated without cron update
5. Check Paystack webhook delivery logs if payment issues
6. Check SMTP test from `/admin/email` if email failures

---

## Admin bootstrap

Initial admin: `npm run admin:bootstrap` (one-time, secure password — never default in production).

---

## Session maintenance

Optional cron: `npm run admin:prune-sessions` for expired admin sessions.
