# Subscriber operations

## Migration

**File:** `prisma/migrations/20260809190000_audience_subscribers/migration.sql`

Additive schema: `Subscriber`, `SubscriberEvent`, enums, `SiteSettings` audience flags.

**Deploy:**

1. Backup database
2. Deploy application
3. `npm run db:migrate`

## Server entry point

```ts
subscribeToAudience({ name, email, source, sourceUrl, consentText? })
```

Location: `lib/audience/service.ts`

Public API: `POST /api/subscribe`

## Double opt-in (default ON)

1. Visitor submits → `PENDING`
2. Confirmation email with link
3. `/subscribe/confirm?token=...` validates hash + expiry (24h)
4. `ACTIVE`, tokens cleared

If confirmation email fails: subscriber stays `PENDING`.

## Unsubscribe

- Link in confirmation/welcome emails uses hashed unsubscribe token
- `/unsubscribe?token=...`
- Record kept as `UNSUBSCRIBED` for suppression

## Re-subscription

Previously unsubscribed visitors may subscribe again explicitly. Tokens rotate;
old links stop working.

## Admin actions

| Action | Capability |
|--------|------------|
| View list/detail | `view_audience` |
| Manual unsubscribe | `manage_audience` |
| CSV export | `export_audience` (Super Admin) |

Audit: `subscriber_manual_unsubscribe`, `subscriber_export`

## Rate limits

- IP bucket + normalized email bucket on public subscribe
- Export: 3 per 15 minutes per Admin user

## Manual verification

1. Subscribe from Insight → `PENDING` in Admin
2. Confirm email → `ACTIVE`
3. Footer signup with different email → source `FOOTER`
4. Contact without checkbox → no subscriber
5. Contact with checkbox → subscriber flow
6. Unsubscribe link → `UNSUBSCRIBED`
7. CSV export (Super Admin)
