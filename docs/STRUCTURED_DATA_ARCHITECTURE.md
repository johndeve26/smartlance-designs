# Structured Data Architecture

Smartlance uses JSON-LD aligned with visible page content and Google-supported types only.

## Global (root layout)

| Type | Source | Verified fields |
|---|---|---|
| Organization + ProfessionalService | `organizationJsonLd()` | name, legalName, url, logo, description, email, phone, sameAs (published social links only) |
| WebSite | `websiteJsonLd()` | name, url, description, publisher |

Address is included **only** when `hasRealAddress()` — no fake offices.

Implementation: `lib/structured-data.ts`, rendered via `components/ui/structured-data.tsx` on non-admin routes.

## Page-family schema

| Page family | Schema | Source fields | Rich result expectation |
|---|---|---|---|
| Service | Service + WebPage + BreadcrumbList | title, summary, href | No guaranteed rich result |
| Solution | WebPage + BreadcrumbList + FAQPage (visible FAQs) | solution content | FAQ rich result eligibility varies — visible FAQs required |
| Platform | WebPage + BreadcrumbList + FAQPage | platform content | Same as FAQ policy |
| Work | WebPage + BreadcrumbList | case study fields | No Review/AggregateRating |
| Insight | BlogPosting + BreadcrumbList | title, dates, hero image, publisher | Article-like eligibility |
| Guide / Comparison / Checklist | Article or BlogPosting + BreadcrumbList | resource payload | Publisher = Organization when author unverified |
| Glossary | DefinedTerm + BreadcrumbList | term, definition | Definition support, not a ranking guarantee |
| Contact | BreadcrumbList + FAQPage | visible FAQs | FAQ policy applies |

## Deliberately excluded

- Fake Review / AggregateRating on testimonials
- LocalBusiness without verified address
- FAQPage on every page regardless of visible Q&A
- Custom “AI SEO”, “GEO”, or “LLM” schema types
- `llms.txt` as a pseudo-schema requirement

## Security

- CMS strings serialized through React JSON-LD component — no raw unsanitized injection
- No fabricated authors, awards, employee counts, or prices in schema

## Tests

`tests/seo/technical-seo.test.ts` validates representative JSON-LD helpers (Organization, Article, Breadcrumb, FAQ).

## Entity consistency

- Organization name matches Site Settings / `siteConfig`
- Canonical URLs use production origin from Site Settings
- Article author falls back to Organization publisher when author is not verified
