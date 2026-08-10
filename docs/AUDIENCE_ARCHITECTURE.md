# Audience architecture

Smartlance Audience stores **voluntary subscribers** who explicitly opt in to
occasional website, SEO and conversion updates.

This is **not** a campaign/bulk mail system. It is the foundation for future
newsletter functionality.

## Data model

- **Subscriber** — one row per normalized email (`emailNormalized` unique)
- **SubscriberEvent** — consent/source lifecycle events (optional history)

### Statuses

| Status | Meaning |
|--------|---------|
| PENDING | Awaiting double opt-in confirmation |
| ACTIVE | Confirmed subscriber |
| UNSUBSCRIBED | Opted out; retained for suppression |
| BOUNCED / COMPLAINED | Reserved for future provider integration |

### Sources

`FOOTER`, `INSIGHT`, `RESOURCE`, `GUIDE`, `CHECKLIST`, `TEMPLATE`, `CONTACT`,
`WEBSITE_REVIEW`, `PROJECT_PLANNER`, `OTHER`

`primarySource` and `primarySourceUrl` capture first acquisition. Subsequent
interactions append `SubscriberEvent` rows without overwriting primary source.

## Public flow

```
Subscribe form/API
  → validate + honeypot + rate limit
  → subscribeToAudience()
  → PENDING (default) or ACTIVE if confirmation disabled
  → confirmation email via sendTransactionalEmail()
  → /subscribe/confirm?token=...
  → ACTIVE
```

Unsubscribe: `/unsubscribe?token=...` → `UNSUBSCRIBED`

## Explicit consent

- Dedicated subscribe forms record consent via submission + disclosure text
- Contact / Website Review require **unchecked optional checkbox**
- Enquiries never auto-create subscribers

## Admin

**Admin → Audience** (`view_audience`, `manage_audience`, `export_audience`)

## Settings

`SiteSettings.audienceEnabled` — hide public forms when false  
`SiteSettings.audienceRequireConfirmation` — double opt-in toggle (default ON)

## Email

Uses shared `sendTransactionalEmail()` from `lib/email/` (Admin SMTP / Resend).

## Security

- Confirmation/unsubscribe tokens: random, stored as SHA-256 hashes only
- No public subscriber listing
- Generic API responses (no email enumeration)

See also:

- [Subscriber operations](./SUBSCRIBER_OPERATIONS.md)
- [Privacy and consent](./SUBSCRIBER_PRIVACY_AND_CONSENT.md)
