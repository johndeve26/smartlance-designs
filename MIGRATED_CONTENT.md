# Migrated Content

Tracking document for the WordPress → Next.js content migration.

**Source site:** https://www.smartlancedesigns.com/  
**Migration date:** 2026-08-07  
**Old WordPress site:** keep live until DNS cutover, redirects and remaining blog migration are complete.

---

## Company details migrated

| Field | Value | Notes |
| --- | --- | --- |
| Email | `Contact@smartlancedesigns.com` | From live site (Cloudflare-decoded) |
| Phone | `+2348075582466` | From live site |
| Instagram | https://www.instagram.com/smartlance_designs/ | Published |
| Facebook | — | **Not published** — live site links both `facebook.com/smartlance_designs` and `www.facebook.com/smartlancedesigns` |
| Experience claim | Over 5 years / `5+ Years Experience` | From existing company copy |
| Primary CTA | Free Website Review | New site conversion model |
| Secondary CTA | Get a Quote | Retains commercial path |

Centralized in `lib/site.ts` + `data/navigation.ts`.

---

## Portfolio projects migrated

All eight projects: `published: true`, local cover/hero images, case-study copy adapted from live pages.

| Project | Slug | Featured | Image | Testimonial |
| --- | --- | --- | --- | --- |
| Gemini Corporate Relocations | `gemini-corporate-relocations` | Yes | cover.webp | Anderson |
| Katerina's Place | `katerinas-place` | Yes | cover.webp | The Katerinas Place Team |
| The Coast | `the-coast` | Yes | cover.webp | Abdullah Khan |
| Banyan Vacations | `banyan-vacations` | Yes | cover.webp | Banyan Vacations |
| Overlook Cabin Rentals | `overlook-cabin-rentals` | Yes | cover.webp | The Overlook Cabin Rentals Team |
| Nashville Home Viewer | `nashville-home-viewer` | No | cover.webp | Nashville Home Viewer Team |
| Kaerek Homes | `kaerek-homes` | Yes | cover.webp | Kaerek Homes |
| Zen Stays Rental | `zen-stays-rental` | No | cover.webp | None on source page |

Draft placeholder projects (Northline, Harborview, etc.) were removed.

Additional gallery screenshots beyond featured covers were not present as discrete downloadable assets on most project templates — covers downloaded from WP featured media.

---

## Testimonials migrated

Seven published testimonials linked to projects (see table above).  
Zen Stays Rental had no customer review on the live project page.

---

## Legal pages migrated

| Old URL | New URL | Status |
| --- | --- | --- |
| `/legal/terms-and-condition/` | `/legal/terms-and-condition` | Migrated (URL kept) |
| `/legal/privacy-statement/` | `/legal/privacy-statement` | Migrated |
| `/legal/accessibility-statement/` | `/legal/accessibility-statement` | Migrated |

Source content from WP REST `legal` CPT → `content/legal/*.md`.

---

## Redirects created

See `proxy.ts` and `URL_MIGRATION_MAP.md`.

Includes main pages, all 8 projects, expertise, **5 platform pages**, industries/solutions, and legal aliases.

---

## Platform pages migrated

| Platform | Slug | Portfolio linked | Notes |
| --- | --- | --- | --- |
| WordPress | `/platforms/wordpress` | Yes — all 8 published projects verified WordPress | Strongest platform page |
| Shopify | `/platforms/shopify` | No verified projects | No Shopify Plus claims |
| BigCommerce | `/platforms/bigcommerce` | No verified projects | Practical commerce copy only |
| Salesforce | `/platforms/salesforce` | No verified projects | Website/CRM integration only — not enterprise consulting |
| Clixlo | `/platforms/clixlo` | No verified projects | Concise funnel/page support |

Data: `data/platforms.ts` · Template: `components/platforms/platform-page-template.tsx`

---

## Still on the old site / not migrated in this pass

- Attachment/media library URLs
- Live chat / newsletter tooling from WordPress
- Facebook (pending official URL confirmation)
- WhatsApp dedicated link (not verified as a public CTA on the live site)
- Final OG PNG asset
- Form delivery credentials / analytics IDs

---

## Blog posts

**Phase 4 complete:** 56 legacy Insights posts migrated to `/blog/[slug]` with 308 redirects from root `/{slug}`.

See `BLOG_MIGRATION_REPORT.md` and `URL_MIGRATION_MAP.md`.

Original Next.js articles retained:

- `/blog/what-makes-a-website-convert`
- `/blog/website-redesign-checklist`
- `/blog/technical-seo-foundations`
