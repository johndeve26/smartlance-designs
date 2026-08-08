# Smartlance Content Audit Report

**Version:** `site-content-audit:v1`  
**Date:** 2026-08-08  
**Admin UI:** `/admin/content-audit`  
**Principle:** Identify what needs attention. Do not rewrite during audit.

---

## Executive coverage

| | |
| --- | --- |
| Pages reviewed | 148 published |
| Drafts | Excluded |
| Open findings | 162 (page + site) |
| Strong pages | 48 |
| Needs research | 13 |
| Proof review (primary verdict) | 0 |
| High priority pages | 12 |

---

## Strong content (protect from unnecessary rewrites)

### Families generally healthy
- **Solutions** — structured problem → review → approach narratives with `pageContent`; strong commercial intent
- **Testimonials** — verified, original quotes preserved, Work-linked
- **Glossary** — plain definitions; Core Web Vitals set uses INP (not obsolete FID-as-current)
- **Work** — qualitative outcomes present without forcing fake metrics; challenge/solution clarity generally adequate
- **Checklist / Template / Tool** — structurally present; scoring not audited as content

### Representative STRONG pages
- Solution: Website Not Generating Leads  
- Work: Gemini Corporate Relocations, Katerina's Place, The Coast  
- Testimonials: all seven verified published records  
- Glossary: SEO, CMS, CTA, LCP, INP, CLS, Core Web Vitals, Canonical URL, Structured Data  

**NO CHANGE RECOMMENDED** is a valid outcome for these.

---

## High-priority issues

| Page | Verdict | Why | Assistant |
| --- | --- | --- | --- |
| Homepage | NEEDS_IMPROVEMENT | Published SEO title/description missing | Homepage Copy Assistant → Generate SEO |
| WordPress / Shopify / Webflow / WooCommerce | NEEDS_RESEARCH | `lastReviewedAt` never set | Platform AI → Research & improve |
| Short-Term Rentals, Hospitality, Cabin Rentals, Real Estate, Property Management | NEEDS_IMPROVEMENT | Thin interchangeable blurbs + missing SEO | Industry AI |
| Website Redesign Guide | NEEDS_RESEARCH | Freshness review flagged | Guide AI → Check freshness |
| WordPress vs Webflow | NEEDS_RESEARCH | Freshness / source review flagged | Comparison AI |

---

## Research needed (later — not in this audit scan)

All **11 Platforms** lack recorded factual review. Prioritize:

1. WordPress  
2. Shopify  
3. Webflow  
4. WooCommerce  

Then Framer, HubSpot CMS, BigCommerce, Squarespace, Wix Studio, Salesforce, Clixlo.

Guide + Comparison also flagged for scheduled freshness (no automatic web research during audit).

---

## Proof review

- **No BLOCKER unsupported Work metrics** detected in published qualitative results  
- Testimonials: verification + original quote integrity look sound  
- Industry experience flags: supported industries correctly non-proven; proven industries have Work links  
- Site-level: public proof coverage is **narrow** (STR/hospitality/WordPress) — gap in coverage, not a claim that other services are false  

---

## Duplication / cannibalization

| Cluster | Approx size | Recommendation |
| --- | --- | --- |
| PriceLabs Insights | 10 | Consolidation review |
| Double-booking / calendar prevention | ~9 | Consolidation review |
| Direct-booking theme | ~20 | Keep strongest; defer low-value near-duplicates |
| Service website cluster | Design / Dev / Redesign / Strategy / UI-UX | Related, not duplicate — polish differentiation + Solution links |
| Industry blurbs | 20 | Pattern: short formulaic blurbs — improve priority pages only |

---

## SEO

| Issue | Scope |
| --- | --- |
| Homepage missing seoTitle/seoDescription (and meta fallbacks empty) | HIGH |
| All Industries missing SEO titles | Site pattern |
| Services largely have SEO titles | OK |
| Platforms have SEO fields | OK |
| Resources mostly have SEO | Minor gaps only |

No keyword-density scoring.

---

## Relationships / commercial authority

| Gap | Label |
| --- | --- |
| Services → Solutions | **NO MEANINGFUL SUPPORT** (0 relatedSolutionSlugs on all Services) |
| Industries → Solutions | **NO MEANINGFUL SUPPORT** |
| Solutions → Services | **WELL SUPPORTED** |
| Platforms → Services | **WELL SUPPORTED** |
| Work → Services / Industries | **MODERATELY SUPPORTED** |
| Insights → commercial Services | **LIMITED SUPPORT** (archive overweight VR) |

---

## Content balance

| Theme | Observation |
| --- | --- |
| Vacation rentals / direct booking | Dominates Insights (55/59) |
| Commercial website/SEO/CRO | Strong in Services/Solutions; thin in Insights |
| Platform decision support | One Comparison + Tool; Platforms need research |
| Glossary | Solid technical reference layer |

---

## CTA notes

- Solutions mostly use specific CTAs (Tell Us About Your Project / Free Website Review) — appropriate for existing-site problem pages  
- `new-business-website` correctly uses Tell Us About Your Project (not Free Website Review)  
- Most Services lack explicit `primaryCtaLabel` — NORMAL polish  

---

## Site-level findings (7)

1. Insight content imbalance (VR overweight)  
2. Service↔Solution relationships missing  
3. Industry SEO titles missing  
4. Platforms never factually reviewed  
5. Industry generic blurb pattern  
6. Narrow Work/proof vertical concentration  
7. PriceLabs Insight consolidation cluster  

---

## Final audit verdict

**READY FOR CONTENT IMPROVEMENT PILOT**

Calibration notes:
- Auditor returns many LIGHT_POLISH items (relationships/SEO) — intentional, not “rewrite everything”
- 48 STRONG pages — protect them  
- Do not begin mass Industry or Insight rewrites  

Next step: execute the first improvement wave deliberately via existing assistants. **Do not auto-apply.**
