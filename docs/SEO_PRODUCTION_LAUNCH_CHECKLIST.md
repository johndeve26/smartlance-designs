# SEO Production Launch Checklist

Manual steps after deployment — not completed by application code alone.

## Canonical host

- [ ] Confirm **Site Settings → canonical host** matches production domain (Super Admin)
- [ ] Verify `https://{host}` loads without redirect chains (www/non-www, http→https)

## Google Search Console

- [ ] Set `GOOGLE_SITE_VERIFICATION` in production env
- [ ] Verify domain property
- [ ] Submit `https://{host}/sitemap.xml`
- [ ] Monitor index coverage after deploy (no ranking claims from local tests)

## Bing Webmaster Tools

- [ ] Set `BING_SITE_VERIFICATION` in production env
- [ ] Verify site
- [ ] Submit sitemap

## Cloudflare / WAF

- [ ] Confirm **Googlebot**, **Bingbot**, and **OAI-SearchBot** can fetch public HTML without persistent 403/429/CAPTCHA
- [ ] Keep `/admin/` protected by auth — not only robots

## IndexNow (optional)

- [ ] Decide enabled/disabled for production
- [ ] If enabled: set `INDEXNOW_ENABLED=true` and `INDEXNOW_KEY`
- [ ] Verify `https://{host}/indexnow-key.txt` returns the key
- [ ] Confirm only publish events trigger submission — not draft saves

## Production crawl verification

Run after deploy:

```bash
SITE_URL=https://smartlancedesigns.com npx tsx scripts/run-seo-production-verification.ts
```

Review `docs/audit-artifacts/seo-production-verification.json`.

## Local baseline (pre/post deploy)

```bash
npx tsx scripts/run-seo-baseline-audit.ts
```

## What code now covers

- `/industries/[slug]` public detail routes
- CMS SEO metadata on Services, Platforms, Solutions, Work, Insights, Resources (all subtypes)
- Sitemap excludes noindex; includes published industries
- robots.txt: public crawl allowed; `/admin/` + `/api/` restricted; OAI-SearchBot policy documented

## What remains editorial (not this sprint)

- Industry copy specificity (Content Quality Audit → Industry AI)
- Vacation Rental Insights consolidation review
- Custom OG images for additional commercial pages
