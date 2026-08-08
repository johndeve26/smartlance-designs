# AI Content Assistants — Audit

**Status:** AUDIT ONLY — no implementation.  
**Date:** 2026-08-08  
**Scope:** Extend AI beyond Insights into Services, Solutions, Platforms, Industries, Work, Testimonials, Resources (by subtype), and optionally Homepage.

---

## Executive Summary

Smartlance already has a strong **shared AI foundation** (providers, Brand Voice, research, knowledge retrieval, claim ledger, jobs/tokens, safety/SSRF, Topic Intelligence). CMS content is **DB-backed via Prisma** with typed `data/` seeds and uneven Admin editors.

**Do not build one generic “AI Page Writer.”** Build:

> **One shared AI foundation + multiple specialized Content Assistants**

Each assistant owns: purpose, fields, prompts, research/claim policy, actions, validation, and review UX.

**Highest-value earliest assistants:** Service AI → Solution AI → Platform AI.  
**Strictest safety:** Case Study AI, Testimonial Assistant, Industry AI (verified experience).  
**Most technical ID risk:** Checklist / Template / Tool assistants.

Topic Intelligence already emits `UPDATE_SERVICE_PAGE` / `UPDATE_PLATFORM_PAGE` (and enum for Solution), but handoff still creates **Insight** AI projects. Future handoff must route to the matching CMS assistant.

---

## Existing AI Architecture (reusable)

| Layer | Location | Reuse? |
| --- | --- | --- |
| Provider abstraction + routing roles (WRITING/RESEARCH/EDITOR/FAST) | `lib/ai/providers/` | Yes |
| Secrets / Admin accounts | `lib/ai/secrets.ts`, `AIProviderAccount` | Yes |
| Brand Voice | `AIBrandVoice`, `brandVoiceBlock()` | Yes (+ type modifiers) |
| Site knowledge | `lib/ai/knowledge.ts` (already multi-entity) | Yes |
| Web research + SSRF | `lib/ai/research/`, `lib/ai/ssrf.ts` | Yes |
| Safety / PII families | `lib/ai/safety.ts` | Yes |
| Claim ledger | `AIClaim`, fact-check ops | Yes (type-specific claim kinds) |
| SEO / AI Search review schemas | `lib/ai/types.ts` | Pattern yes; prompts type-specific |
| Runs / tokens / fingerprints | `AIEditorialRun`, `lib/ai/jobs.ts`, `lib/ai/cost.ts` | Extend carefully |
| Topic Intelligence | `lib/ai/topic-intelligence/` | Yes; extend handoffs |
| Zod structured output + repair | providers `generateStructured` | Yes |
| RBAC | `use_ai_writer`, `manage_ai_settings`, `approve_ai_cms` | Reuse + gate by CMS edit rights |

### Insight-bound (do not overload blindly)

- `AIEditorialProject.linkedInsightId` only
- Pipeline: brief → outline → markdown draft → Insight CMS handoff
- Topic Intelligence `convertOpportunityToProject` always creates Insight-oriented projects
- `SYSTEM_GUARD` / prompts oriented to editorial articles
- `sourcePolicyNotes` stored but **not injected into prompts**

Insights AI Writer (`/admin/ai-writer`) must remain intact.

---

## Shared Infrastructure vs Type-Specific Logic

### Shared

- AI providers, model routing hierarchy, Brand Voice base
- Knowledge retrieval, research providers, Source Packs (where relevant)
- Usage/runs/jobs, prompt versioning map, Zod validation, SSRF/PII, audit logs
- Proposal/diff shell UI, accept/reject controls
- Topic Intelligence opportunity discovery

### Content-type-specific

- Writing purpose and page intent
- Field allowlists and generation sequence
- Context builders (what verified data is loaded)
- Prompt namespaces and operations
- Research policy / claim policy
- Allowed vs forbidden actions
- Relationship suggestion rules
- Review check categories
- Tone modifiers on Brand Voice

**Recommended balance:** A thin `AIContentTypeRegistry` for wiring + **explicit TypeScript modules per assistant** (not a giant opaque JSON framework).

---

## Existing CMS Architecture

| Type | Store | Admin | Editor maturity | Draft/Publish |
| --- | --- | --- | --- | --- |
| Service | Prisma `Service` | `/admin/services` | Strong (`ServiceFormFields`) | Yes + revisions |
| Solution | Prisma `Solution` | `/admin/solutions` | Inline form | Yes + revisions |
| Platform | Prisma `Platform` | `/admin/platforms` | Inline form | Yes + revisions; `lastReviewedAt` |
| Industry | Prisma `Industry` | `/admin/industries` | Thin form (SEO not in form) | Yes; verified Work gates |
| Work | Prisma `WorkProject` | `/admin/work` | Thin form (many DB fields unused) | Yes; image publish gate |
| Testimonial | Prisma `Testimonial` | `/admin/testimonials` | Inline | Verify → Publish |
| Resources | Prisma `CmsResource` + `payload` | `/admin/resources/[type]` | Payload JSON-heavy | Yes |
| Homepage | Prisma `HomepageContent` singleton | `/admin/homepage` | Inline | **Live save** (no draft status) |
| Insights | Prisma `Insight` | `/admin/insights` + AI Writer | Mature | Yes |

**Validation:** No CMS Zod schemas; HTML `required` + action/repo publish gates.  
**Preview:** `/admin/preview/[entity]/[id]` for service, solution, platform, work, insight, resource, industry.  
**Tool scoring** remains file-based (`data/tools/website-platform-selector.ts`) — not Admin payload.

Approximate seed/typed counts: Services 16 · Solutions 9 · Platforms 11 · Industries 20 (5 proven / 15 supported) · Work 8 · Testimonials 7 · Guides 1 · Comparisons 1 · Checklists 1 · Glossary 12 · Templates 1 · Tools 1 · Homepage 1.

---

## Per-Type Summaries

### Service AI

**Purpose:** Explain what Smartlance does, for whom, problems addressed, process, outcomes, related capabilities — commercial but restrained; **not** Blog tone.

**Recommended actions:** Fill missing fields · Improve Service · Rewrite hero/positioning · Strengthen process · Generate FAQs · Suggest relationships · Generate SEO · Review page.

**Context:** Existing Service + related Solutions/Work/Resources/Platforms + Brand Voice. Never invent capabilities.

**Risks:** Generic SEO spam; duplicating Solutions; inventing deliverables Smartlance does not offer.

**Complexity:** Medium (well-formed fields).

---

### Solution AI

**Purpose:** PROBLEM → DIAGNOSIS → APPROACH → OUTCOME. Distinct from Service.

**Recommended actions:** Clarify problem/symptoms/causes · Improve diagnostic flow · Outcome-oriented copy · Connect Services · FAQs · SEO · Review path clarity.

**Must not:** Collapse into Service brochure copy.

**Complexity:** Medium–high (`pageContent` structured bodies).

---

### Platform AI

**Purpose:** Technology fit, strengths, trade-offs, Service links — factual and volatile.

**Research:** Strongly recommended / required for features, pricing, integrations, limitations. Prefer official sources. Use `lastReviewedAt`.

**Must not invent:** certifications, partner status, client-platform experience, prices, features.

**Complexity:** High (freshness + claims).

---

### Industry AI

**Purpose:** Apply Smartlance capabilities to a sector without fabricating experience.

**Proof boundary (authoritative):**

- `group`: `proven` | `supported`
- `hasVerifiedProjectExperience` requires related Work (≥1 published Work to publish when verified)

**With verified Work:** may reference only those Case Studies.  
**Without:** general expertise + Services/Solutions + public research — never “extensive industry experience.”

**Complexity:** Medium + strict claim rules.

---

### Case Study AI (Work)

**Principle:** AI may **help write** from verified notes; AI may **not invent** a Case Study.

**Strictest fields:** `resultSummary`, `results`, `measurableResults` — no invented %, traffic, rankings, revenue, ROI.

**Actions:** Turn project notes → draft · Improve challenge/solution · Summarize · SEO · Suggest Services · Review proof claims.

**Recommend:** structured verified intake (project facts / outcomes / approved quote) separate from public fields; explicit “approved for AI” before sending private notes to providers.

**Complexity:** High (proof + privacy).

---

### Testimonial Assistant (not “Writer”)

**Forbidden:** Generate quote / fabricate praise / invent client statement. **No “Generate Testimonial” button.**

**Allowed:** Format supplied quote · suggest shorter excerpt from verified quote · classify theme · suggest Work link · placement hints. Preserve meaning; never present rewritten text as verbatim client speech.

**Recommend:** keep `quote` as original; optional display excerpt field if needed later.

**Complexity:** Low surface, high policy risk.

---

### Resource assistants (separate)

| Subtype | Purpose | Special rules |
| --- | --- | --- |
| Guide AI | Deep education (closest to Insight) | Research as needed; Claim Ledger for facts |
| Comparison AI | Decision / trade-offs | Neutral; no fabricated winner |
| Checklist AI | Execution steps | **Never mutate stable item IDs** |
| Glossary AI | Definition clarity | Official research for technical terms |
| Template Assistant | Labels/help/instructions | **Never change field IDs / showWhen** |
| Tool Copy Assistant | Question/result copy | **Never change scoring IDs/weights** (file engine) |

---

### Homepage Copy Assistant (optional)

Useful for hero/CTA/section copy/SEO alternatives only. **Live save without draft status** makes this riskier — prefer proposals that require explicit save, or introduce draft boundary later.

**Recommendation:** Phase E / optional after commercial assistants. Not Blog generation.

---

## UI Recommendations

### Field-level

Add “Improve with AI” / “Write with AI” only on high-value prose fields (hero, summary, description, FAQs, SEO). Not on every input.

### Record-level panel

Type-named panel (e.g. **Service AI**) with type-specific actions. Shared shell; different action lists.

### Proposal / diff

- NEW draft: Fill eligible empty fields → create DRAFT
- EXISTING: Fill missing **or** Propose rewrite — never silent overwrite
- Show CURRENT vs PROPOSED; Accept / Keep / Edit per field
- Lock/Keep flags during full-page proposals
- Persist only after human accept into draft/revision — never published directly
- Homepage: extra care (no draft status today)

### Naming

Service AI · Solution AI · Platform AI · Industry AI · Case Study AI · Guide AI · Comparison AI · Checklist AI · Glossary AI · Template Assistant · Tool Copy Assistant · **Testimonial Assistant** · Homepage Copy Assistant  
Umbrella: **AI Content Assistants**

---

## Database Recommendations

**Do not** create `AIService` / `AISolution` / … duplicate content tables.

**Minimal additions (future):**

1. Shared proposal store, e.g. `AIContentProposal` (entityType, entityId, action, status, payloadJson, runId, createdBy)
2. Either generalize runs beyond Insight projects (`AIContentRun`) **or** keep `AIEditorialRun` and add nullable polymorphic entity refs — prefer clear semantics over overloading Insight projects
3. Optional provenance flags: `aiAssisted`, last proposal/run id (internal only)
4. Case Study: optional verified notes / “approved for AI” boundary fields
5. Testimonials: optional `displayExcerpt` if excerpting is productized

Reuse `ContentRevision` for accepted changes; label revisions as AI-assisted in metadata where useful.

---

## Topic Intelligence Integration

Today:

- Recommendations include commercial page updates
- Handoff → Insight AI project only

Desired:

```
Topic Intelligence
  → content-type router
  → Service/Solution/Platform/Industry/Resource/Case Study assistant
  → proposal → human review → CMS draft/publish
```

Future opportunity handoffs (not implemented):

`CREATE_INSIGHT_PROJECT` · `UPDATE_INSIGHT` · `UPDATE_SERVICE` · `UPDATE_SOLUTION` · `UPDATE_PLATFORM` · `UPDATE_INDUSTRY` · `EXPAND_GUIDE` · `UPDATE_COMPARISON` · …

Also emit `UPDATE_SOLUTION_PAGE` from heuristics (enum exists; analyzer unused).

---

## Security & Privacy

- Assistants inherit CMS edit permissions (no AI without edit rights)
- Never send Enquiries, sessions, passwords
- Case Study private notes: only if explicitly approved for AI/public use
- Untrusted research remains sandboxed
- Provider payloads may include unpublished drafts — flag in UI; prefer redaction of internal verification notes
- AI never publishes; never changes status/publishedAt/IDs/verification flags

---

## Model Routing

Prefer shared roles (**WRITING / RESEARCH / EDITOR / FACT_REVIEW / FAST**) + type-specific prompts — not 12 separate model selectors.

Research-heavy: Platform, Comparison, technical Glossary, Industry research.  
Cheap: single-field rewrite, Testimonial formatting, SEO metadata.

---

## Testing Strategy (future)

| Assistant | Must prove |
| --- | --- |
| Service | No invented capabilities |
| Solution | Not Service brochure |
| Platform | Official research for volatile claims |
| Industry | No fake experience |
| Work | No fake metrics |
| Testimonial | No quote generation path |
| Comparison | No fabricated winner |
| Checklist/Template/Tool | IDs/scoring preserved |
| All | No silent overwrite; RBAC; draft boundary; PII excluded |

---

## Implementation Order (recommended)

Derived from value × risk × editor readiness:

1. **Phase A** — Shared proposal/diff infrastructure + **Service AI** + **Solution AI**
2. **Phase B** — **Platform AI** (+ research freshness) + **Industry AI** (proof gates)
3. **Phase C** — **Case Study AI** + **Testimonial Assistant**
4. **Phase D** — Resource subtype assistants (Glossary/Comparison → Guide → Checklist → Template/Tool copy)
5. **Phase E** — Homepage assistant (if draft boundary addressed) + Topic Intelligence handoff router

---

## Risks

1. Generic duplicated copy across Services/Industries/Platforms
2. Platform/Industry factual drift without research
3. Invented Work results or testimonials
4. Mutating checklist/template/tool IDs
5. Overloading Insight project tables until semantics break
6. Homepage live-overwrite without draft
7. Thin Admin forms missing many DB fields — AI must not invent UI for unpublished field surfaces without editor support

---

## Open Questions

1. Should commercial assistants live inside each CMS editor only, or also as a hub?
2. Generalize `AIEditorialProject` vs new `AIContentProposal` + light runs?
3. Introduce Homepage draft status before Homepage AI?
4. Structured Case Study intake fields vs freeform notes?
5. Persist original Testimonial quote + display excerpt?
6. Who may approve AI proposals vs publish (reuse `approve_ai_cms`)?
7. Should Platform AI block generation when research is stale (`lastReviewedAt` threshold)?

---

## Related Documents

- `docs/AI_CONTENT_FIELD_MATRIX.md`
- `docs/AI_CONTENT_POLICY_MATRIX.md`
- `docs/AI_CONTENT_ASSISTANTS_IMPLEMENTATION_PLAN.md`
