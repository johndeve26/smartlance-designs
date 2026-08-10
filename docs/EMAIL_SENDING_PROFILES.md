# Email sending profiles

Smartlance V1 sending profiles extend the existing transactional email stack
without replacing it. When no profiles exist, behavior matches the legacy
system sender (`EmailSettings` → env SMTP → Resend).

## Concepts

| Term | Meaning |
|------|---------|
| **Sending profile** | Named From/Reply-To identity plus transport choice |
| **Route category** | Stable message type key (e.g. `INVOICE`, `CRM_MANUAL`) |
| **Routing rule** | Maps one category to one active profile |
| **Default profile** | Fallback when a category has no explicit route or its route target is inactive |
| **Legacy sender** | Pre-profile behavior from `resolveActiveEmailTransport()` |

## Transport types

- **`SYSTEM_SMTP`** — Reuses the global system connection (`EmailSettings` / env /
  Resend). Profile only overrides From/Reply-To headers.
- **`CUSTOM_SMTP`** — Dedicated SMTP host/port/credentials on the profile (Super
  Admin only). Encrypted with the same dedicated secrets key as Admin SMTP.

There is **no send-time transport fallback**. One resolved profile, one delivery
attempt. SMTP failure does not chain to another profile or silently switch to
Resend when Admin SMTP is enabled.

## Entry point

```ts
sendSmartlanceEmail({
  category: "INVOICE",
  to,
  subject,
  text,
  html?,
  replyTo?,           // optional override for threading
  sendingProfileId?,  // manual override (server-validated)
  snapshotTarget?: { crmEmailId },
})
```

Location: `lib/email/send-smartlance.ts`

`sendTransactionalEmail` remains as a thin wrapper with category
`GENERAL_SYSTEM` for backward compatibility.

## Resolution order

1. Explicit `sendingProfileId` (manual CRM/Inbox only) — must be active
2. `EmailRoutingRule[category]` when profile is active
3. Inactive/missing route → default active profile
4. No profiles in DB → legacy system sender

## Route categories

```
AUTH_MAGIC_LINK, PROSPECT_GENERAL, PROSPECT_REQUEST, PROSPECT_CLARIFICATION,
CRM_MANUAL, CRM_SEQUENCE, CRM_INBOUND_REPLY, PROPOSAL, CONTRACT, PROJECT,
ONBOARDING, CHANGE_REQUEST, INVOICE, PAYMENT_CONFIRMATION, SUPPORT, GENERAL_SYSTEM
```

Labels and suggested profile slugs: `lib/email/routing/categories.ts`.

## CRM snapshots

Outbound `CrmEmail` rows store sender snapshots at send time:

- `sendingProfileId`
- `fromNameSnapshot`, `fromEmailSnapshot`, `replyToSnapshot`
- `transportTypeSnapshot`

Snapshots are written before delivery and are not mutated after send. Editing a
profile affects future sends only.

## Admin UI

`/admin/email` tabs:

1. **Overview** — system SMTP status, default profile, route coverage
2. **System SMTP** — existing global SMTP settings
3. **Sending Profiles** — CRUD, test connection, send test email
4. **Routing** — category → profile assignments
5. **Inbound** — existing inbound mailbox panel

Bootstrap action: **Create default profile from current system sender** copies
identity from `EmailSettings` (not encrypted password).

## Manual sender selection

CRM contact compose and Sales Inbox reply include **From: [Sending Profile ▾]**
when the user has `choose_email_sender`. Default selection follows the routed
`CRM_MANUAL` / `CRM_INBOUND_REPLY` profile.

## RBAC

| Capability | Roles |
|------------|-------|
| `manage_email_profiles` | SUPER_ADMIN |
| `manage_email_routing` | SUPER_ADMIN |
| `choose_email_sender` | SUPER_ADMIN, EDITOR (with `send_crm_email`) |

Viewing `/admin/email` requires `manage_settings`. Custom SMTP credential
fields require `manage_email_profiles` / `settings_critical`.

## Testing profiles

- **Test connection** — CUSTOM SMTP only; verifies SMTP handshake
- **Send test email** — Delivers a plain test message using the resolved profile
- Status stored on profile: `UNTESTED` / `PASSED` / `FAILED` (not “verified sender”)

Live inbox delivery verification for staging profiles (General, Sales, Billing,
Support) is a separate acceptance step after feature completion.

## Security

- DTOs never expose ciphertext, IV, tag, or decrypted passwords
- Audit events for profile CRUD, default changes, routing edits, tests
- Logs include profile id, category, safe error code — never magic-link tokens

## Related docs

- [`EMAIL_ARCHITECTURE.md`](./EMAIL_ARCHITECTURE.md) — overall email flow
- [`SECURITY_ARCHITECTURE.md`](./SECURITY_ARCHITECTURE.md) — RBAC (if present)
