# CRM Email Engagement Tracking (V3.2)

## Signal hierarchy

| Signal | Meaning | Trust level |
|--------|---------|-------------|
| **Sent** | Provider accepted per delivery state | Factual |
| **Open detected** | Tracking pixel was requested | Approximate |
| **Click detected** | Tracking redirect was requested | Stronger, may be scanner |
| **Verified reply** | Inbound mailbox matched thread | Factual reply |
| **Human CRM decision** | Admin updates Lead/Deal | Business meaning |

## Mechanics

- **Click tracking (default ON):** HTML links rewritten to `/t/c/{token}`; plain-text URLs unchanged.
- **Open detection (default OFF):** Single 1×1 pixel at `/t/o/{token}` appended to HTML.
- **Tokens:** Cryptographically random; only SHA-256 hash stored (keyed pepper).
- **Unsubscribe:** `/outreach/unsubscribe` links are never wrapped.

## Per-email snapshot

Each outbound `CrmEmail` stores `openTrackingEnabled` and `clickTrackingEnabled` at send time.

## Settings

Admin → CRM → Outreach → Email engagement tracking

Independent toggles for opens and clicks.

See also: `CRM_EMAIL_TRACKING_PRIVACY.md`, `CRM_OUTREACH_ANALYTICS.md`
