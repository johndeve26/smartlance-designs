# Content Guide — Smartlance Designs

How to update the website without changing architecture.

## Company details

Edit `lib/site.ts` and/or environment variables in `.env.local`.

| Field | Where |
| --- | --- |
| Brand name, tagline, description | `lib/site.ts` → `siteConfig` |
| Site URL | `NEXT_PUBLIC_SITE_URL` |
| Email / phone / WhatsApp | `NEXT_PUBLIC_CONTACT_*` |
| Location / service areas / hours | `NEXT_PUBLIC_LOCATION_LABEL`, `NEXT_PUBLIC_SERVICE_AREAS`, `NEXT_PUBLIC_WORKING_HOURS` |
| Address (for schema only when complete) | `NEXT_PUBLIC_STREET_ADDRESS`, `CITY`, `REGION`, `POSTAL_CODE`, `COUNTRY` |
| Primary / secondary CTAs | `siteConfig.cta` (also exported via `data/navigation.ts`) |

Never invent missing details. Leave empty strings.

## Social links

Edit `data/navigation.ts` → `socialLinks`.

```ts
{
  label: "LinkedIn",
  href: "https://linkedin.com/company/your-page",
  icon: "linkedin",
  isPlaceholder: false, // must be false to render
}
```

## Services

1. Edit or add entries in `data/services.ts`
2. Create a thin page at `app/services/<slug>/page.tsx` using `ServicePageTemplate`
3. Add nav/footer links in `data/navigation.ts` if needed

SEO services: `data/seo.ts` + `app/seo/<slug>/page.tsx` with `SeoPageTemplate`.

## Portfolio projects

Edit `data/portfolio.ts`.

### Publish a project

1. Add screenshots under `public/images/projects/<slug>/`
2. Set fields (`image`, `heroImage`, `gallery`, copy, outcomes)
3. Set `published: true`
4. Set `featured: true` if it should appear on the homepage

### Unpublish

Set `published: false`. It disappears from `/work`, homepage, sitemap and static generation (unless `NEXT_PUBLIC_SHOW_DRAFT_CONTENT=true` for local QA).

### Recommended image paths

```text
public/images/projects/<slug>/
  cover.webp      # card 1600×1000
  hero.webp       # case study 1920×1200
  homepage.webp
  mobile.webp
  detail-01.webp
```

### Outcomes without fake metrics

Use factual delivery notes, for example:

- Full website redesigned
- Mobile experience improved
- Booking journey simplified
- SEO architecture implemented

Never invent percentages or traffic claims.

## Testimonials

Edit `data/testimonials.ts`.

```ts
{
  id: "client-1",
  name: "Jane Doe",
  company: "Acme Ltd",
  role: "Founder",
  quote: "…",
  service: "Website Redesign",
  source: "Email",
  sourceUrl: "",
  projectSlug: "optional-slug",
  published: true,
}
```

Only `published: true` with a non-empty quote/name renders.

## Statistics

Edit `data/home.ts` → `trustStats`.

```ts
{ id: "projects", value: "40+", label: "Projects Completed", isPlaceholder: false }
```

Only non-placeholder, non-empty values render.

## Blog articles

1. Add `content/blog/<slug>.md` with frontmatter
2. Optional hero: `public/images/blog/<slug>.webp` + `heroImage` in frontmatter
3. Link to services via relative markdown links

Author should be a real name or `Smartlance Designs`. Do not invent biographies.

## Forms / lead delivery

Configure server env (never `NEXT_PUBLIC_` for secrets):

- `RESEND_API_KEY` + `CONTACT_TO_EMAIL` + `CONTACT_FROM_EMAIL`
- and/or `FORM_WEBHOOK_URL` / `CONTACT_WEBHOOK_URL` / `WEBSITE_REVIEW_WEBHOOK_URL`

In production, submissions fail honestly if no delivery channel is configured.

Local/dev can log submissions unless you set production without fallback.

## Analytics

Set any of:

- `NEXT_PUBLIC_GTM_ID` (preferred — load GA4 inside GTM)
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` (only if GTM is empty)
- `NEXT_PUBLIC_CLARITY_ID`

Direct GA4 is skipped when GTM is present to avoid double counting.

## Brand assets

```text
public/images/brand/   logo, mark, favicons
public/images/og/      default.svg (replace with 1200×630 PNG when ready)
public/images/projects/
public/images/blog/
public/images/services/
public/images/team/
```

## Draft QA mode

```bash
NEXT_PUBLIC_SHOW_DRAFT_CONTENT=true
```

Shows unpublished projects for local review. Keep this off in production.
