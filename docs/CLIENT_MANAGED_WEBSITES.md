# Client Managed Websites

## Managed Website vs Project

A **Project** ends at delivery. A **Managed Website** continues as the client's ongoing asset.

Websites are created explicitly — completed projects are **not** auto-converted.

## Fields (client-safe subset)

- Identity: name, domain, production URL
- Management: status (`ACTIVE`, `MAINTENANCE`, `PAUSED`, `ARCHIVED`)
- Care: careStatus, carePlanName, next/last maintenance
- Observed availability: only when `statusSource` is `MANUAL` or `MONITORING_PROVIDER`

## Domain normalization

Stored as `example.com` (no scheme/path). Production URL validated HTTP/HTTPS only.

## Access

`AgencyManagedWebsiteClientAccess`:

| Role | View | Submit support | Respond |
|------|------|----------------|---------|
| VIEWER | ✓ | ✗ | ✗ |
| MEMBER | ✓ | ✓ | ✓ |
| WEBSITE_ADMIN | ✓ | ✓ | ✓ |

Revocation removes all website surfaces immediately.

## Never exposed to clients

Server IP, SSH, credentials, DNS tokens, internal notes, storage keys.
