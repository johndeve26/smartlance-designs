# Internal Link Audit

Generated: 2026-08-10

Contextual inbound only (registry + entity related fields + hub seeds).
Header / footer / sitemap are **not** counted.

## Summary

| Bucket | Count |
| --- | ---: |
| 0 contextual inbound | 1 |
| 1 contextual inbound | 37 |
| 2+ contextual inbound | 42 |
| Routes tracked | 80 |

## Zero contextual inbound

- `/` (home)

## Single contextual inbound

- `/about` ← `/`
- `/checklists/website-redesign-checklist` ← `/solutions/outdated-website`
- `/glossary/301-redirect` ← `/solutions/website-migration`
- `/glossary/canonical-url` ← `/solutions/website-migration`
- `/glossary/cls` ← `/solutions/slow-website`
- `/glossary/cms` ← `/solutions/new-business-website`
- `/glossary/conversion-rate` ← `/solutions/low-website-conversions`
- `/glossary/core-web-vitals` ← `/solutions/slow-website`
- `/glossary/cta` ← `/solutions/low-website-conversions`
- `/glossary/inp` ← `/solutions/slow-website`
- `/glossary/lcp` ← `/solutions/slow-website`
- `/glossary/seo` ← `/solutions/website-not-ranking`
- `/glossary/structured-data` ← `/solutions/website-migration`
- `/glossary/xml-sitemap` ← `/solutions/website-migration`
- `/platforms` ← `/`
- `/platforms/clixlo` ← `/platforms`
- `/platforms/framer` ← `/platforms`
- `/platforms/hubspot-cms` ← `/platforms`
- `/platforms/salesforce` ← `/platforms`
- `/platforms/squarespace` ← `/platforms`
- `/platforms/wix-studio` ← `/platforms`
- `/resources` ← `/`
- `/seo/on-page-seo` ← `/seo`
- `/services` ← `/`
- `/services/branding` ← `/services`
- `/solutions` ← `/`
- `/work` ← `/`
- `/work/banyan-vacations` ← `/work`
- `/work/freelance-os` ← `/work`
- `/work/gemini-corporate-relocations` ← `/work`
- `/work/kaerek-homes` ← `/work`
- `/work/katerinas-place` ← `/work`
- `/work/nashville-home-viewer` ← `/work`
- `/work/overlook-cabin-rentals` ← `/work`
- `/work/padeya` ← `/work`
- `/work/the-coast` ← `/work`
- `/work/zen-stays-rental` ← `/work`

## Notes

- Glossary terms are expected to have fewer homepage-level inbound links; educational reverse links from Guides/SEO matter more.
- Specialist platforms (Salesforce, Clixlo) intentionally stay lightly linked from Selector flows.
- This report is guidance for connection quality — not a minimum-link quota.

## Source

`scripts/audit-internal-links.ts` · `data/site-relationships.ts`
