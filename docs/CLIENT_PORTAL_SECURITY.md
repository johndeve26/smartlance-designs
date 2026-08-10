# Client Portal Security

## Authentication

Reuse hardened Client Portal session (`ClientPortalSession` + HttpOnly cookie). No separate auth system.

All portal routes require authentication except `/portal/login` and `/portal/auth/[token]`.

## Authorization invariants

1. **Explicit access** — `AgencyProjectClientAccess`, proposal/contract/billing access tables
2. **Same company ≠ authorized** — contacts at the same company see nothing without grants
3. **Revocation is immediate** — `revokedAt` on access records; next request fails authorization
4. **Action authority** — CTAs only when user has commercial/signing/billing role

## Client-safe DTOs

Portal services strip:

- Internal notes, health, budget internals
- Storage keys, webhook payloads, provider secrets
- AuditLog, CRM data, admin activity
- Internal task details

## File privacy

Private storage architecture unchanged. Authorization checked on every download. No public URLs.

## Activity privacy

Timeline and attention exclude `clientVisible: false` records and all admin-only events.

## Access denied

Use safe not-found — do not reveal another client's resource exists.

## Cache

Portal responses: private / no-store where required. Never shared-cache client data.

## SEO

`noindex` on portal layout. Not in sitemap.

## Cross-client tests

Integration tests in `tests/portal/integration/unified-client-portal.test.ts` verify:

- Attention isolation
- Same-company denial
- Timeline privacy
- File isolation
- Revoked access

## Profile edits

Contact/company profile changes do not alter invoice snapshots, contract signer snapshots, or proposal acceptance records.

## Team (V2 scope)

Read-only “People with access” in account. Invitations deferred to V2.1.
