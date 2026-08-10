# Production Environment

Variable **names only**. Never commit values.

See also: `lib/env.ts` (`ENV_CATALOG`, `validateServerEnv`).

---

## Required in production

| Variable | Purpose |
|----------|-----------|
| `DATABASE_URL` | PostgreSQL (pooled) |
| `ADMIN_SESSION_SECRET` | Admin session signing (≥32 chars) |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin (real domain, not localhost) |
| `MEDIA_STORAGE_PROVIDER` | Must be `s3` (local blocked unless override flag) |
| `MEDIA_S3_*` | Public media bucket credentials |
| `AGENCY_PRIVATE_STORAGE_DRIVER` | Must be `s3` in production |
| `AGENCY_S3_*` | Private agency/client files bucket |
| `AI_SECRETS_ENCRYPTION_KEY` | Encrypt Admin SMTP/AI secrets (≥16 chars) |

---

## Required for specific features

| Variable | Feature |
|----------|---------|
| `PAYSTACK_SECRET_KEY` | Online invoice payment |
| `CRM_SCHEDULER_SECRET` | Outbound sequence cron |
| `CRM_INBOUND_SYNC_SECRET` | Inbound email sync cron |
| `AGENCY_BILLING_SCHEDULER_SECRET` | Retainer billing cron |
| `AGENCY_ONBOARDING_SCHEDULER_SECRET` | Onboarding reminders cron |
| `OPENAI_API_KEY` / Admin AI provider | AI Review, Brief assistant, AI Writer |
| `RESEND_API_KEY` or Admin SMTP | Transactional email (if not using Admin SMTP) |

---

## Optional

| Variable | Purpose |
|----------|---------|
| `DIRECT_URL` | Non-pooled URL for migrations |
| `SMTP_*` | Env fallback SMTP when Admin SMTP disabled |
| `CONTACT_TO_EMAIL` | Form notification recipient |
| `FORM_WEBHOOK_URL` | Alternate enquiry notification |
| `TAVILY_API_KEY` | Topic intelligence research |
| `ADMIN_PREVIEW_SECRET` | Draft preview tokens |

---

## Test only — never required in production

| Variable | Purpose |
|----------|---------|
| `TEST_DATABASE_URL` | Integration test PostgreSQL |
| `CRM_INTEGRATION_TEST_ALLOW=1` | Override guard for non-`*test*` DB names |
| `NODE_ENV=test` | Test runner |

**Guard:** `TEST_DATABASE_URL` must not equal `DATABASE_URL`.

---

## Development only — must not be set in production

| Variable | Risk |
|----------|------|
| `MEDIA_ALLOW_LOCAL_IN_PRODUCTION=1` | Local disk media in prod |
| `AGENCY_ALLOW_LOCAL_IN_PRODUCTION=1` | Local private files in prod |
| `ALLOW_FORM_LOG_FALLBACK=true` | Masks missing email config |
| `NEXT_PUBLIC_SHOW_DRAFT_CONTENT=true` | Exposes draft CMS content |

---

## Production validation

`validateServerEnv()` runs on production build/start paths. Hard-fails on:

- Missing/weak `ADMIN_SESSION_SECRET`
- Invalid `NEXT_PUBLIC_SITE_URL`
- Local media/agency storage without explicit override
- Draft content flag enabled

Warnings (non-fatal): missing email notification channel when only DB persistence exists.

---

## Integration test command

```bash
TEST_DATABASE_URL=postgresql://localhost:5432/smartlance_test \
  NODE_ENV=test \
  npm run db:migrate \
  npm run test:integration
```

Database name should contain `test`, `integration`, `ci`, or `local`.
