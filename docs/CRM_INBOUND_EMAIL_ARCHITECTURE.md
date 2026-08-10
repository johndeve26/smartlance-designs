# CRM Inbound Email Architecture

V3 adds **real inbound mailbox sync** via IMAP (read-only).

## Flow

```
Outbound CRM email (Message-ID stored)
        ↓
Recipient replies to configured mailbox
        ↓
Cron → POST /api/internal/crm-inbound-email-sync
        ↓
IMAP fetch (UID-based cursor)
        ↓
Parse + match thread (In-Reply-To / References)
        ↓
CrmEmail direction=INBOUND, origin=INBOUND_SYNC
        ↓
EMAIL_RECEIVED activity
        ↓
Stop/pause sequences + review task
        ↓
Human updates Lead/Deal state manually
```

## Separation

| Layer | Purpose |
|-------|---------|
| SMTP (EmailSettings) | Outbound only |
| IMAP (InboundEmailSettings) | Inbound sync only |

## Thread matching priority

1. In-Reply-To → outbound `internetMessageId`
2. References → known outbound IDs
3. Contact email (no false thread attachment)
4. Unmatched → Inbox review queue

## Policy

- Verified thread reply → **STOP** all active sales sequences (`REPLY_RECEIVED`)
- Automated response → **PAUSE** (`AUTOMATED_REPLY`) + review
- Reply does **NOT** change Lead status or temperature

See also: `CRM_INBOUND_OPERATIONS.md`, `CRM_EMAIL_THREADING.md`, `CRM_REPLY_POLICY.md`, `CRM_EMAIL_ENGAGEMENT_TRACKING.md`
