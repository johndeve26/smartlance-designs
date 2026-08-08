# Commercial Journey

Date: 2026-08-07  
Site: Smartlance Designs  
Context: Intentional commercial architecture after Prompt 22 audit

No secrets. Credential names only.

---

## Journey principle

**HELP ME UNDERSTAND → HELP ME DECIDE → HELP ME PREPARE → LET ME CONTACT YOU**

Tools educate and clarify. Contact and Free Review convert. Micro-completions (planner, selector, template copy) are not leads.

---

## Readiness levels (internal — not public labels)

| Level | Intent | Typical destinations |
| --- | --- | --- |
| **L1 Exploring** | Orienting | Solutions · Resources · Work |
| **L2 Understanding** | Mapping options | Planner · Pricing · Services |
| **L3 Planning** | Defining the project | Brief · Selector · Pricing |
| **L4 Diagnosing** | Existing-site issues | Free Review · Audit (service) |
| **L5 Ready** | Willing to talk | Contact |

---

## Tool roles (one-liners)

| Tool | Answers |
| --- | --- |
| **PROJECT PLANNER** | What kind of project do I need? |
| **PROJECT BRIEF** | What are my requirements? |
| **PLATFORM SELECTOR** | Which technology should I consider? |
| **FREE WEBSITE REVIEW** | What may be wrong with my existing site? |
| **PRICING** | What affects scope/investment? |
| **CONTACT** | I am ready to talk. |

---

## Journey map

| Visitor state | Primary path |
| --- | --- |
| UNKNOWN NEED | → Planner |
| KNOWN PROBLEM | → Solution |
| KNOWN SERVICE | → Service |
| EXISTING SITE DIAGNOSIS | → Free Review |
| PROJECT DEFINED | → Brief / Pricing |
| READY | → Contact |
| PLATFORM UNCERTAIN | → Platform Selector |
| EDUCATION | → Resources |

---

## Global CTA architecture

| Role | Label | Destination |
| --- | --- | --- |
| Header / site primary (`siteConfig.cta.primary`) | Tell Us About Your Project | `/contact` |
| Header / site secondary (`siteConfig.cta.secondary`) | Get a Free Website Review | `/free-website-review` |

Footer company links include Project Planner, Contact, and Free Website Review.

**Not published:** Cost Calculator. No new routes from this audit.

---

## CTA destination matrix (major pages)

| Page | Primary | Secondary | Optional contextual |
| --- | --- | --- | --- |
| **Homepage** | Tell Us About Your Project → `/contact` | View Our Work → `/work` | Planner in problem section; Free Review mid-page teaser; final CTA uses global Contact + Free Review |
| **Services hub** | Contact (final) | Free Review (final) | Uncertainty → Planner then Pricing; Solutions softer text link |
| **Solutions hub** | Contact (final) | Free Review (final) | NotSure → Planner then Free Review |
| **Pricing** | Contact (hero) | Planner (hero) | Brief / Review mid-page; Brief final secondary |
| **Planner** | Plan My Project (start) | Contact (secondary) | Commercial handoff after results |
| **Project Brief** | Use Template | — | Planner optional intro; completion → Contact + Pricing link |
| **Platform Selector** | Start Selector | — | Optional Planner helper; Contact in final CTA |
| **Free Review** | Form submit | — | Audit distinction (service ≠ free review) |
| **Contact** | Form submit | — | Optional Planner / Pricing helpers |
| **Work** | Contact / Free Review (empty-state / filters context) | — | Case studies stay proof-first |
| **About** | Tell Us About Your Project | Get a Free Website Review | — |
| **Platforms hub** | Contextual service / contact paths | — | No fabricated partnership CTAs |
| **Resources** | Goal-led discovery | — | Restrained Planner / Selector / Free Review callouts |
| **404** | Tell Us About Your Project → `/contact` | Plan Your Project → `/project-planner` | Home / Work recovery links |

**Homepage hero rule:** max 2 CTAs (Contact + Work). Planner and Free Review stay out of the hero.

---

## Form conversion endpoints

| Form | Route | Endpoint |
| --- | --- | --- |
| Contact | `/contact` | `POST /api/contact` |
| Free Website Review | `/free-website-review` | `POST /api/website-review` |

Shared delivery: `lib/forms.ts`

| Channel | Env (names only) |
| --- | --- |
| Resend email | `RESEND_API_KEY` + `CONTACT_TO_EMAIL` (or `FORM_TO_EMAIL`) |
| Webhooks | `FORM_WEBHOOK_URL` / `CONTACT_WEBHOOK_URL` / `WEBSITE_REVIEW_WEBHOOK_URL` |

| Protection | Behavior |
| --- | --- |
| Honeypot | `_gotcha` (must be empty) |
| Rate limit | In-memory sliding window via `isFormRateLimited` — **8 / hour / IP / route** |
| Dev fallback | Log-only when no credentials and `NODE_ENV !== "production"`, or `ALLOW_FORM_LOG_FALLBACK=true` |

### LAUNCH BLOCKER

**Production requires Resend or a webhook.** UI success alone is not commercially ready. Without delivery credentials, submissions are not reliably received.

---

## Analytics privacy

- Anonymous events only
- `sanitizePayload` strips PII-like keys (email, phone, name, message, details, etc.)
- Planner / template / selector **answers never** appear in analytics payloads or URLs

| Type | Events (examples) | Count as leads? |
| --- | --- | --- |
| **Primary commercial conversions** | `contact_form_submitted`, `free_review_submitted` (+ related click/start events) | Yes |
| **Micro conversions** | Planner complete, selector complete, template copy | No |

---

## Deliberately NOT added

- Cost calculator (unpublished)
- Chatbot
- Calendly
- Newsletter signup
- Sticky contact bar
- WhatsApp (unless verified / configured)
- Popups / interruptive modals
- New routes, services, solutions, resources, or tools from this audit

---

## Related docs

- `LAUNCH_READINESS.md` — commercial conversion status + launch blockers
- `PROJECT_STRUCTURE.md` — routes, forms, pricing, planner architecture
- `lib/site.ts` — global CTA labels/hrefs
- `lib/forms.ts` — delivery, rate limit, honeypot handling
- `lib/analytics.ts` — event names + payload sanitization
