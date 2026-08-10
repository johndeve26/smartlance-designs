# Security Header Review — Deferred Findings

Generated: 2026-08-10  
Context: Lighthouse best-practices audit during **Frontend Performance V1.1**

These items were **intentionally not implemented** in the performance pass. Each requires compatibility review with Next.js, R2 media, analytics, Paystack, OAuth/admin flows, and inline framework scripts.

## Findings (deferred)

| Item | Lighthouse signal | Risk if applied blindly | Recommended phase |
|------|-------------------|-------------------------|-------------------|
| Content-Security-Policy | No enforcing CSP | Breaks Next.js hydration scripts, analytics, payment flows | Dedicated security hardening |
| HSTS preload / includeSubDomains | Partial HSTS | Subdomain HTTP breakage if any asset still HTTP | Verify all subdomains first |
| Cross-Origin-Opener-Policy | Missing COOP | May break OAuth/payment popups | Test auth + Paystack flows |
| Trusted Types CSP | Not enforced | Requires broad DOM audit | Separate compatibility project |

## Current headers (from `next.config.ts`)

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: SAMEORIGIN`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

Private routes: `Cache-Control: no-store`, `X-Robots-Tag: noindex`.

## Next steps

1. Inventory all third-party script origins (GA/GTM/Clarity, Paystack, R2 CDN)
2. Draft CSP in report-only mode on staging
3. Validate admin, portal, workspace, and checkout flows
4. Only then promote enforcing CSP / COOP / Trusted Types

**Priority:** P2/P3 — do not block frontend performance or CMS work.
