# CRM Inbound Operations

## Configure

Admin → Settings → **Inbound mailbox (IMAP)**

1. Enter IMAP host, port, username, password
2. Test connection
3. Enable inbound sync (sets `syncEnabledAt` — no historical import before this)
4. Set CRM reply-to if different from username

## Cron

```bash
curl -X POST https://your-site/api/internal/crm-inbound-email-sync \
  -H "Authorization: Bearer $CRM_INBOUND_SYNC_SECRET"
```

Every 5–15 minutes recommended.

## Manual sync

Admin → CRM → Inbox → **Sync now** (requires `manage_crm`)

## Review workflow

1. Check Inbox → Needs review / Unmatched
2. Open message — plain text default; sanitized HTML optional
3. Link to Contact, Create Contact, Ignore, or Mark reviewed
4. Complete review task on Contact
5. Manually update Lead status if appropriate

## Safety

- Read-only mailbox access
- Password encrypted at rest
- Remote images blocked in HTML view
- Attachments: metadata only (no download)
