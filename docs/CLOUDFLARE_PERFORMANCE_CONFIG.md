# Cloudflare Performance Configuration — Smartlance

> **Status:** Recommendations only. Cloudflare is **not** managed from this repository. Verify in dashboard after deploy.

## CURRENT (audit checklist)

Manual verification required in Cloudflare dashboard:

- [ ] Proxy status (orange cloud) for apex + www
- [ ] No **Cache Everything** rule on `/*` for HTML
- [ ] Browser Cache TTL not overriding origin incorrectly for HTML
- [ ] Polish / image optimization settings documented
- [ ] Brotli/gzip enabled
- [ ] WAF/bot rules allow verified search crawlers (see `docs/SEO_PRODUCTION_LAUNCH_CHECKLIST.md`)

## RECOMMENDED rules

### 1. Bypass cache — authenticated & sensitive routes

| Purpose | Match | Cache behavior |
|---------|-------|----------------|
| Admin | `URI Path starts with /admin` | Bypass |
| Client portal | `URI Path starts with /portal` | Bypass |
| Prospect workspace | `URI Path starts with /workspace` | Bypass |
| Auth API | `URI Path starts with /api/auth` | Bypass |
| Agency API | `URI Path starts with /api/agency` | Bypass |
| Prospect API | `URI Path starts with /api/prospect` | Bypass |
| Webhooks | `URI Path starts with /api/webhooks` | Bypass |
| Email tracking | `URI Path starts with /t/` | Bypass |

**Security warning:** A cache HIT on `/portal/*` or `/admin/*` would be a **P0 privacy defect**.

### 2. Aggressive cache — hashed static assets

| Purpose | Match | Cache behavior |
|---------|-------|----------------|
| Next static | `URI Path starts with /_next/static/` | Edge TTL: respect origin / long, Browser TTL: long |
| Public media CDN | R2/CDN hostname paths | Edge TTL: long for immutable assets |

Do **not** reduce Next.js immutable `/_next/static` lifetime without measurement.

### 3. Origin respect — public HTML

| Purpose | Match | Cache behavior |
|---------|-------|----------------|
| Public HTML | All other HTML | **Respect origin headers** (prefer Vercel/Next semantics) |

Do **not** add a second full-page HTML edge cache until Vercel measurements show benefit.

## VERIFIED (post-deploy commands)

```bash
# Public page — expect framework cache headers from Vercel origin
curl -sI https://YOUR-PREVIEW.vercel.app/ | rg -i 'cache-control|x-vercel-cache|age'

# Private route — must NOT be publicly cached
curl -sI https://YOUR-PREVIEW.vercel.app/portal | rg -i 'cache-control|cf-cache-status'

# Static asset — expect long cache
curl -sI https://YOUR-PREVIEW.vercel.app/_next/static/chunks/webpack.js | rg -i 'cache-control'
```

### 4. R2 public media — versioned brand & project assets (V1.1)

| Asset class | Example path | Recommended R2 `Cache-Control` | Status |
|-------------|--------------|--------------------------------|--------|
| Versioned brand logos | `/images/brand/smartlance-logo-v2.webp` | `public, max-age=31536000, immutable` | **RECOMMENDED** — apply in R2 bucket rule or object metadata after upload |
| Versioned mark | `/images/brand/smartlance-mark-v2.webp` | `public, max-age=31536000, immutable` | **RECOMMENDED** |
| Project screenshots | `/images/projects/*/hero.webp`, `hero-768.webp` | `public, max-age=2592000, stale-while-revalidate=86400` | **RECOMMENDED** |
| Legacy unversioned logo | `/images/brand/smartlance-logo.png` | `public, max-age=86400` only | **CURRENT** — do not mark immutable (same URL may be overwritten) |

**Manual upload required after V1.1 deploy:**

```bash
# Sync new versioned assets to R2 (when credentials configured)
npm run media:migrate:r2 -- --prefix images/brand/smartlance-logo-v2.webp
npm run media:migrate:r2 -- --prefix images/brand/smartlance-logo-dark-v2.webp
npm run media:migrate:r2 -- --prefix images/brand/smartlance-mark-v2.webp
npm run media:migrate:r2 -- --prefix images/projects/freelance-os/hero-768.webp
```

**Verify:**

```bash
curl -sI "https://YOUR-R2-HOST/images/brand/smartlance-logo-v2.webp" | rg -i 'cache-control|cf-cache-status|age'
# Request twice — second response should show Age > 0 when cached
```

## APPLIED

_None from this repo — document dashboard/R2 changes here when applied manually._

## Interaction with Vercel

```
Browser → Cloudflare → Vercel (Next.js 16)
                ↓
         Static assets: CF + Vercel both OK
         HTML: prefer Vercel framework cache first
         Private routes: bypass at CF + origin no-store
```

Avoid conflicting TTL between Cloudflare Page Rules and Vercel `Cache-Control`.

## Deferred

- Sitewide Cloudflare HTML caching — **deferred** until measured need
- Edge cache for `/sitemap.xml` — optional; app-level cache tag `sitemap` already added
