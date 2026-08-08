# Smartlance Content Improvement Plan

**Based on:** `site-content-audit:v1` baseline (2026-08-08)  
**Rule:** Audit first. Improve deliberately. No mass rewrite.

---

## Executive summary

The writing machinery is complete. Published commercial architecture (Services, Solutions, Platforms, Resources) is largely in place. The biggest gaps are:

1. Homepage SEO on the live record  
2. Platform factual review debt (`lastReviewedAt` empty everywhere)  
3. Thin Industry blurbs on proven verticals  
4. Zero Service→Solution relationship wiring  
5. Insight archive overweight toward vacation-rental near-duplicates  
6. Narrow public proof (STR / WordPress)

Solutions, Testimonials, Glossary, and most Work should **not** be rewritten for vanity.

---

## Strongest content (leave alone unless a specific finding appears)

- Solution narratives with full `pageContent`  
- Verified Testimonials  
- Glossary technical terms (CWV / LCP / INP / CLS / Canonical / Structured Data)  
- Stronger Case Studies with clear challenge/solution and qualitative outcomes  

---

## First improvement wave (28 targets)

Ordered for commercial impact. Open editor → choose assistant action → human review → draft → preview → publish.

| # | Priority | Page | Assistant / action |
| --- | --- | --- | --- |
| 1 | HIGH | Homepage | Homepage Copy Assistant → Generate SEO (then Review Homepage) |
| 2–5 | HIGH | WordPress, Shopify, WooCommerce, Webflow | Platform AI → Research & improve |
| 6–10 | HIGH | Short-Term Rentals, Hospitality, Cabin Rentals, Real Estate, Property Management | Industry AI → Improve (keep experience boundaries) |
| 11 | HIGH | Website Redesign Guide | Guide AI → Check freshness |
| 12 | HIGH | WordPress vs Webflow | Comparison AI → Check freshness / Research options |
| 13–20 | NORMAL | Website Design, Development, Redesign, Strategy, CRO, Performance, Audit, E-commerce | Service AI → relationships + CTA polish (not full rewrite) |
| 21–24 | NORMAL | Not Ranking, Slow Website, Outdated Website, Low Conversions | Solution AI → optional measurement points only |
| 25 | NORMAL | Zen Stays Rental | Case Study AI / link Testimonial if available |
| 26 | NORMAL | Website Platform Selector | Tool Copy Assistant (copy only — no scoring) |
| 27–28 | NORMAL | PriceLabs + Double-booking Insight reps | Human consolidation review (Insight studio) — **no auto-delete** |

Exact live list: `/admin/content-audit` and `docs/audit-artifacts/content-quality-audit-baseline.json`.

---

## Suggested pilot sequence (2 weeks)

### Week 1 — commercial core
1. Homepage SEO draft → preview → publish  
2. Platform research wave (4 priority platforms) — one platform per session  
3. Wire Service→Solution links on 8 commercial Services (can be manual; AI may suggest)  

### Week 2 — proof verticals + resources
4. Improve 5 proven Industry pages  
5. Freshness pass on Guide + Comparison  
6. Human consolidation shortlist for PriceLabs + calendar/double-booking Insights  

**Stop.** Re-run audit. Compare open findings — no vanity score chart.

---

## Pages needing research

All Platforms (11). Start with WordPress, Shopify, Webflow, WooCommerce.  
Guide + Comparison freshness thereafter.

Do **not** run hundreds of external searches in one audit job.

---

## Pages needing human proof

- No urgent unsupported metric blockers found on Work  
- Expand Work/Testimonials only when real projects exist  
- Zen Stays: consider linking a verified Testimonial if one exists  

---

## Pages needing no change

Representative: Website Not Generating Leads; Gemini / Katerina's Place / The Coast Work; all verified Testimonials; most Glossary terms.

---

## Out of scope for this pilot

- Mass rewrite of 55 VR Insights  
- Mass rewrite of 15 supported Industries  
- Changing Tool scoring  
- Generating Testimonials  
- Auto-publishing anything  

---

## Success criteria for pilot

- Homepage published SEO present  
- ≥4 Platforms with `lastReviewedAt` set after human-accepted research proposals  
- ≥5 Service→Solution relationship sets filled  
- ≥3 proven Industries deepened without inventing experience  
- Consolidation shortlist decided for one Insight cluster (even if redirects deferred)  
- Re-audit shows fewer HIGH findings — not a higher “score”
