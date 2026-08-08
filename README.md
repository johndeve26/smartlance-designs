# Smartlance Designs Website

Production-ready marketing website for **Smartlance Designs** — a digital agency focused on website design, development, redesign, SEO, e-commerce, conversion optimization and digital growth.

**Positioning:** Websites Built to Rank, Convert and Grow.

## Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS 4
- Zod (form validation)
- Markdown blog content (`content/blog`)

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | Run ESLint |

## Environment variables

See `.env.example` for the full list.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical production domain (no trailing slash) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Public contact email |
| `NEXT_PUBLIC_CONTACT_PHONE` | Optional phone |
| `NEXT_PUBLIC_WHATSAPP` | Optional WhatsApp number |
| `CONTACT_WEBHOOK_URL` | Webhook for contact form submissions |
| `WEBSITE_REVIEW_WEBHOOK_URL` | Webhook for free review submissions |
| `FORM_TO_EMAIL` | Destination email for form notifications |
| `RESEND_API_KEY` | Resend API key for email delivery |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 |
| `NEXT_PUBLIC_GTM_ID` | Google Tag Manager |
| `NEXT_PUBLIC_CLARITY_ID` | Microsoft Clarity |

Without webhook/email credentials, form submissions are accepted and logged server-side in development.

## Content editing

### Company details

- `lib/site.ts` — site URL, description, address placeholders
- `data/navigation.ts` — navigation, footer, CTAs, social links
- `data/home.ts` — homepage stats (placeholders), process, value props

### Services

Edit `data/services.ts` to add or update services, then create a thin page under `app/services/<slug>/page.tsx` using `ServicePageTemplate`.

### SEO services

Edit `data/seo.ts` and add pages under `app/seo/<slug>/page.tsx` using `SeoPageTemplate`.

### Portfolio

Edit `data/portfolio.ts`. Case studies auto-generate at `/work/[slug]`.

### Blog posts

Add Markdown files in `content/blog/`:

```md
---
title: "Your title"
description: "Meta description"
category: "SEO"
author: "Smartlance Designs"
publishedAt: "2026-04-01"
relatedServiceHrefs:
  - "/seo/technical-seo"
---

## Heading

Body content with [internal links](/services).
```

Supported categories: Website Design, Development, SEO, Local SEO, E-commerce, Conversion, Performance, Digital Marketing.

### Testimonials & stats

Update `data/testimonials.ts` and `data/home.ts`. Keep placeholders clearly marked until real data is approved. Never invent metrics or reviews.

## Analytics

`lib/analytics.ts` abstracts event tracking. Configure GA4 / GTM / Clarity via env vars. Events include:

- `get_quote_clicked`
- `free_review_clicked`
- `contact_form_started`
- `contact_form_submitted`
- `portfolio_viewed`
- `service_viewed`
- `blog_service_cta_clicked`
- `email_clicked`
- `phone_clicked`
- `whatsapp_clicked`

## Deployment

1. Set `NEXT_PUBLIC_SITE_URL` to the production domain.
2. Configure form delivery and analytics env vars.
3. Deploy to Vercel (or any Node host supporting Next.js):

```bash
npm run build
npm run start
```

4. Replace placeholders listed in `CONTENT_PLACEHOLDERS.md` before public launch.

## Documentation

- `PROJECT_STRUCTURE.md` — architecture overview
- `CONTENT_PLACEHOLDERS.md` — content still needed from the business
- `AGENTS.md` — Next.js version-specific agent guidance
