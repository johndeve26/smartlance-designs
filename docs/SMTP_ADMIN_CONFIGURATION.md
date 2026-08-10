# SMTP Admin configuration

Admin → Settings → **Email delivery (SMTP)**

Permission: `manage_settings` (Super Admin and Editor)

## Fields

| Field | Notes |
|-------|--------|
| Enable SMTP | Toggle; disabled config stays stored |
| Host | Hostname or IP — no `http://` URLs |
| Port | Integer 1–65535 (465, 587, 2525, 25 common) |
| Security | `AUTO`, `TLS`, `STARTTLS`, `NONE` |
| Username | Optional; admin-only |
| Password | Encrypted at rest; never returned to browser |
| From name / From email | Required when enabled |
| Reply-To | Optional default for non-enquiry mail |
| Notification recipients | Comma-separated validated list (max 10) |
| Test recipient | Optional override for test email |

## Password UX

- Saved password shows **Configured** (optionally last 4 chars)
- **New password** blank → keep existing secret
- **Remove SMTP password** checkbox → explicit clear (with save)

## Encryption

Passwords use AES-256-GCM via `lib/secrets/dedicated.ts`.

Requires a persistent key:

- `AI_SECRETS_ENCRYPTION_KEY` (preferred), or
- `APP_SECRETS_ENCRYPTION_KEY`

**Not** `ADMIN_SESSION_SECRET` — rotating session auth must not break SMTP credentials.

Database columns: `passwordCiphertext`, `passwordIv`, `passwordTag`, `passwordLast4`.

## Security modes

| Mode | Behavior |
|------|----------|
| AUTO | Port 465 → implicit TLS; otherwise STARTTLS |
| TLS | Implicit TLS (typical port 465) |
| STARTTLS | Upgrade on connect (typical port 587) |
| NONE | Plain SMTP (rare; no TLS bypass switch) |

TLS certificate verification remains **enabled**. There is no Admin option for
`rejectUnauthorized: false`.

## Test actions

1. **Save settings first**
2. **Test connection** — `transport.verify()` only; no message sent
3. **Send test email** — simple plain-text to Admin email or test recipient

Both actions:

- Require `manage_settings`
- Use same-origin protection
- Rate limited (5 per 15 minutes per Admin user)
- Write safe audit entries (no password in metadata)

Operational metadata: `lastTestedAt`, `lastTestSucceededAt`, `lastTestErrorSafe`.

## Configuration precedence

1. Valid **enabled Admin SMTP**
2. Environment SMTP (`SMTP_*` vars)
3. Resend (`RESEND_API_KEY`)
4. Webhooks only / unconfigured

## Environment fallback variables

| Variable | Purpose |
|----------|---------|
| `SMTP_HOST` | Server hostname |
| `SMTP_PORT` | Port |
| `SMTP_USER` | Username |
| `SMTP_PASSWORD` | Password (env-only, not Admin UI) |
| `SMTP_FROM_EMAIL` | Sender address |
| `SMTP_FROM_NAME` | Sender display name |
| `SMTP_REPLY_TO` | Default reply-to |
| `SMTP_SECURITY` | `AUTO` \| `TLS` \| `STARTTLS` \| `NONE` |
| `RESEND_API_KEY` | Resend fallback |
| `CONTACT_TO_EMAIL` / `FORM_TO_EMAIL` | Recipients when Admin list empty |

## Audit actions

- `smtp.enabled` / `smtp.disabled`
- `smtp.configuration_updated`
- `smtp.password_replaced` / `smtp.password_removed`
- `smtp.connection_tested`
- `smtp.test_email_sent`

Safe metadata only: host, port, security mode, from email, success/error codes.

## Database migration

Migration: `20260809180000_email_settings`

Additive `EmailSettings` singleton table (`id = 'site'`). No destructive changes.

**Deployment order:**

1. Backup database
2. Deploy application code
3. `npm run db:migrate`
4. Configure SMTP in Admin
5. Test connection and test email
6. Submit a Contact form enquiry and confirm notification + Reply-To

## Production DNS (manual)

Configure with your SMTP provider / DNS host:

- **SPF** — authorize sending IP/host
- **DKIM** — sign outbound mail
- **DMARC** — policy for From domain alignment

The application does not configure DNS records.

## Manual verification checklist

1. Admin → Settings → Email delivery
2. Enter host, port, security, credentials, from address
3. Save → reload → password shows **Configured** only
4. Test connection → success
5. Send test email → received
6. Submit Contact form → enquiry stored even if SMTP fails
7. Notification arrives with Reply-To = visitor email
8. Disable SMTP → documented env fallback applies
