# AI Content Policy Matrix

**Status:** AUDIT ONLY  
**Principle:** Shared AI foundation; specialized assistants. Preserve page-type intent.

Base Brand Voice applies everywhere; each type adds modifiers (commercial restraint, neutral glossary, evidence-led case study, etc.).

---

## SERVICE

| Policy | Rule |
| --- | --- |
| Intent | Commercial capability — what Smartlance does |
| Research | Optional; internal DB required |
| Claims | No invented capabilities, deliverables, guarantees |
| Allowed | Fill missing · Improve · Hero · Process · FAQs · SEO · Relations · Review |
| Forbidden | Blog-style listicles · inventing services · auto-publish |
| Brand modifier | Commercial but restrained |

---

## SOLUTION

| Policy | Rule |
| --- | --- |
| Intent | Problem → diagnosis → approach → outcome |
| Research | Optional; internal DB required |
| Claims | No fake measurement outcomes |
| Allowed | Problem/symptoms/causes · Process · FAQs · Service links · SEO · Review |
| Forbidden | Collapsing into Service brochure · Blog article tone |
| Brand modifier | Diagnostic, outcome-oriented |

---

## PLATFORM

| Policy | Rule |
| --- | --- |
| Intent | Technology fit, strengths, trade-offs |
| Research | **Strongly recommended / required for volatile facts**; official sources preferred |
| Claims | No fake partner/cert/pricing/feature invention; `verifiedExperience` human-only |
| Allowed | Explain fit · Trade-offs · FAQs · Service links · SEO · Research then write · Review freshness |
| Forbidden | Invent certifications · guarantee rankings · stale feature claims without research |
| Brand modifier | Balanced, factual |
| Freshness | Respect / update `lastReviewedAt` |

---

## INDUSTRY

| Policy | Rule |
| --- | --- |
| Intent | Sector application of Smartlance capabilities |
| Research | Industry research recommended; internal proof constraints required |
| Claims | **Never** convert “we support” → “extensive project experience” without verified Work |
| Allowed | Problem framing · Journey · Relevant Services/Solutions · SEO · Review specificity |
| Forbidden | Fabricated portfolio · generic “for {industry}” append-only copy |
| Brand modifier | Business-contextual |
| Proof | `group` + `hasVerifiedProjectExperience` + IndustryWork gates remain authoritative |

---

## WORK / CASE STUDY

| Policy | Rule |
| --- | --- |
| Intent | Proof of delivered work |
| Research | External usually unnecessary |
| Claims | **Verified project notes required**; results never invented |
| Allowed | Polish notes → Challenge/Solution/Summary · SEO · Relations · Review proof |
| Forbidden | Invent Case Study · invent metrics/%/ROI · invent testimonials |
| Brand modifier | Evidence-led |
| Privacy | Private notes only with explicit approved-for-AI; never Enquiries |

---

## TESTIMONIAL

| Policy | Rule |
| --- | --- |
| Intent | Proof quote |
| Research | Unnecessary |
| Claims | Quote must be client-supplied |
| Allowed | Format · punctuation preserving meaning · excerpt suggestion · theme · Work link |
| Forbidden | **Any quote generation** · meaningful rewrite presented as verbatim · “Generate Testimonial” |
| Name | **Testimonial Assistant** (not Writer) |
| Privacy | `internal*` fields never public; default exclude from LLM |

---

## GUIDE

| Policy | Rule |
| --- | --- |
| Intent | Deep education |
| Research | Topic-dependent |
| Claims | Claim Ledger for factual assertions |
| Allowed | Research · outline · sections · FAQ · SEO · links · fact review |
| Forbidden | Commodity SEO spam · inventing Smartlance results |
| Brand modifier | Educational, practical |
| Note | Closest to Insight AI; still separate prompt namespace |

---

## COMPARISON

| Policy | Rule |
| --- | --- |
| Intent | Decision support |
| Research | Strongly recommended |
| Claims | Balanced; sources for factual option claims |
| Allowed | Criteria · matrix · trade-offs · who-suits · FAQ · SEO |
| Forbidden | Fabricated universal winner · star ratings as truth |
| Brand modifier | Neutral, decision-oriented |

---

## CHECKLIST

| Policy | Rule |
| --- | --- |
| Intent | Execution / verification |
| Research | Optional |
| Claims | Practical steps; no fake legal certainty |
| Allowed | Suggest sections/items wording · organize sequence · find missing steps |
| Forbidden | **Mutate stable item/section IDs** |
| Brand modifier | Clear, actionable |

---

## GLOSSARY

| Policy | Rule |
| --- | --- |
| Intent | Definition |
| Research | Required for technical/current definitions |
| Claims | Accurate definitions; no false technical claims |
| Allowed | Plain + technical explanation · examples · aliases · related · SEO |
| Forbidden | Invented standards · outdated definitions without research |
| Brand modifier | Neutral, explanatory |

---

## TEMPLATE

| Policy | Rule |
| --- | --- |
| Intent | Guided input |
| Research | Usually none |
| Claims | Instructional only |
| Allowed | Labels · help · section descriptions · option wording |
| Forbidden | Change field IDs · change `showWhenAny` / persistence contracts |
| Brand modifier | Instructional |

---

## TOOL

| Policy | Rule |
| --- | --- |
| Intent | Interactive decision support |
| Research | Usually none for copy |
| Claims | Result copy must match engine |
| Allowed | Intro/outro · question wording · helper · result explanation (copy layer) |
| Forbidden | Change scoring IDs/weights/signals/conditionals without separate system change |
| Brand modifier | Clear guidance |

---

## HOMEPAGE

| Policy | Rule |
| --- | --- |
| Intent | Brand + conversion overview |
| Research | Usually none |
| Claims | No fake trust stats/metrics |
| Allowed | Hero alternatives · section summaries · CTA · SEO |
| Forbidden | Blog generation · inventing proof numbers · silent live overwrite without review |
| Brand modifier | Brand-forward, restrained |
| Draft | Today saves live — proposals must not auto-persist carelessly |

---

## Cross-cutting policies

| Topic | Rule |
| --- | --- |
| PII | No Enquiries, sessions, passwords |
| Publish | AI never sets status/publishedAt |
| Overwrite | Never silent; draft/proposal accept only |
| Relations | Suggest real DB entities only |
| Slug | Suggest only; published slug changes use redirect workflow |
| SEO | Run duplicate/canonical checks via existing SEO ops |
| Topic Intelligence | UPDATE_* routes to matching assistant, not Insight by default |
| Model routing | Shared WRITING/RESEARCH/EDITOR/FAST + type prompts |
| Prompt injection | Untrusted research sandboxed |
| Public disclosure | Per existing editorial policy; no per-field public AI badge required |
