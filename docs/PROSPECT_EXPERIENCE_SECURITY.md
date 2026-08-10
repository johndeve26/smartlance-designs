# Prospect Experience Security

## SSRF

All review fetches use `assertPublicHttpUrl` + per-redirect revalidation.

Blocked: localhost, private IPv4/v6, metadata hosts, non-HTTP protocols.

## Ownership

Reviews/briefs: `portalUserId` or unclaimed `claimTokenHash`.

Requests: authenticated `portalUserId` only.

## Claim tokens

SHA-256 hashed, single-use, cleared on claim.

## AI

- Server-side only
- Schema validation + evidence ID checks
- Sandboxed untrusted website text

## Rate limits

Review creation, AI brief actions, signup — `isFormRateLimited`.

## Privacy

Review results and workspace: noindex, no-store where appropriate.

Known gap: DNS rebinding (documented in `BACKEND_SECURITY_HARDENING.md`).
