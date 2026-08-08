# AI Content Assistants — Implementation Plan

**Status:** PLAN ONLY — do not implement in the audit task.  
**Depends on:** `AI_CONTENT_ASSISTANTS_AUDIT.md`, `AI_CONTENT_FIELD_MATRIX.md`, `AI_CONTENT_POLICY_MATRIX.md`

---

## Goal

Ship specialized CMS assistants on shared AI infrastructure without replacing Insight AI Writer or inventing a generic “write any page” tool.

---

## Architecture sketch

```
AIContentTypeRegistry (thin)
  entityType → assistant module

Assistant module (explicit code per type)
  allowedActions
  fieldAllowlist
  contextBuilder
  promptNamespace + operations
  researchPolicy / claimPolicy
  zod output schemas
  relationshipPolicy

Shared
  providers · brand voice · knowledge · research · ssrf/pii
  AIContentProposal (draft suggestions)
  run/token tracking
  proposal UI shell (diff accept/reject)
  CMS draft/revision/publish unchanged
```

**Avoid:** one mega-prompt; duplicate content tables; 20 model dropdowns; silent overwrite.

---

## Phase A — Foundation + Service + Solution

### A1. Shared proposal layer

- `AIContentProposal` (or equivalent): entityType, entityId, action, status (`PENDING|ACCEPTED|REJECTED|EXPIRED`), payloadJson, run metadata, createdBy
- Server allowlists per action
- Diff API: current vs proposed field map
- Persist accepted fields via existing repositories → draft/revision
- Never write `status` / `publishedAt` / verification flags / IDs

### A2. Prompt namespaces

- `service-writer:v1` ops: `full-page`, `hero`, `faq`, `seo`, `relations`, `review`
- `solution-writer:v1` ops: `problem-flow`, `full-page`, `faq`, `seo`, `relations`, `review`

### A3. UI

- Service editor: **Service AI** panel + selective field buttons
- Solution editor: **Solution AI** panel
- Proposal review: Accept / Keep / Edit per field

### A4. Tests

- No invented capabilities
- Solution ≠ Service copy
- Allowlist enforcement
- RBAC: must can edit entity
- No published overwrite

**Exit:** Editor can fill missing Service/Solution fields and accept proposals into draft.

---

## Phase B — Platform + Industry + TI handoffs

### B1. Platform AI — DONE

- Research-required path for volatile claims
- Official source preference + proposal claim metadata
- Update `lastReviewedAt` on accepted research-backed writes
- Forbidden: certs, partner status, invented features/prices

### B2. Industry AI — DONE

- Context builder loads `group`, verified flag, related Work only
- Prompt hard-rules for experience boundary
- SEO fields exposed in Industry Admin form

### B3. Topic Intelligence — DONE (commercial subset)

- Wire `UPDATE_SERVICE_PAGE` / `UPDATE_PLATFORM_PAGE` / `UPDATE_SOLUTION_PAGE` / `UPDATE_INDUSTRY_PAGE` to CMS assistants
- Heuristic emits `UPDATE_SOLUTION_PAGE` and `UPDATE_INDUSTRY_PAGE` where appropriate
- Insight project creation is opt-in override only for these recs

**Exit:** Platform/Industry proposals with research + proof gates; commercial TI handoff works.

---

## Phase C — Case Study + Testimonial — DONE

### C1. Case Study AI — DONE

- `approvedForAI` + `approvedProjectFacts` on WorkProject
- Actions: FILL_MISSING, BUILD_FROM_PROJECT_FACTS, IMPROVE_*, FORMAT_RESULTS, GENERATE_SEO, SUGGEST_RELATIONSHIPS, REVIEW_PROOF, REVIEW_CASE_STUDY
- Results: only when verified metrics/outcome exist; claim blockers on unsupported proof
- Privacy: approved opt-in; private notes excluded by default
- Admin: `/admin/work/[id]` Case Study AI panel + project source facts

### C2. Testimonial Assistant — DONE

- Actions: FORMAT_QUOTE, CREATE_EXCERPT, SUGGEST_RELATED_WORK, CLASSIFY_THEME, REVIEW_TESTIMONIAL
- **No generate-quote action** in UI or API
- `originalQuote` + `displayExcerpt` + `themesJson` (additive migration; quotes preserved)
- Deterministic integrity validation; Admin: `/admin/testimonials/[id]`

**Exit:** Proof content assisted safely; tests forbid quote generation and metric invention.

**TI note:** `UPDATE_WORK_PAGE` deferred — not in current recommendation set.

---

## Phase D — Resource subtypes — DONE

Guide AI · Comparison AI · Checklist AI · Glossary AI · Template Assistant · Tool Copy Assistant.

- Explicit `AIContentEntityType` values (not a single RESOURCE type)
- Shared CmsResource editor loads subtype panel
- Stable-ID / scoring isolation helpers
- TI: `EXPAND_EXISTING_RESOURCE` → resource assistant when existing hit resolves
- Homepage AI **not** started

See `docs/AI_CONTENT_ASSISTANTS_PHASE_D_COMPLETION.md` and `docs/AI_RESOURCE_CONTENT_POLICY.md`.

---

## Phase E — Homepage + complete TI routing — **DONE**

- Homepage draft/revision boundary (`draftJson`) before AI
- Homepage Copy Assistant (copy only; draft apply; proof + curation gates)
- Topic Intelligence router: Service/Solution/Platform/Industry/Work/Homepage + resource subtypes
- Final architecture / operations / coverage matrix / Homepage docs

See `docs/AI_CONTENT_ASSISTANTS_PHASE_E_COMPLETION.md`.

**No further major AI content-assistant phases planned.**

---

## Model routing

Keep shared roles:

| Role | Use |
| --- | --- |
| FAST | Classification, short field polish |
| RESEARCH | Platform/Comparison/Glossary/Industry research |
| WRITING | Full/partial page drafts |
| EDITOR | Reviews, diffs, quality checks |
| FACT_REVIEW | Claim Ledger passes |

Content type = prompt/context, not a new model picker per type.

---

## UI concept (Service example)

```
SERVICE AI
What do you want to do?
 ○ Fill missing fields
 ○ Improve this Service
 ○ Rewrite hero
 ○ Create FAQs
 ○ Generate SEO
 ○ Suggest relationships
 ○ Review page

Instructions [optional]
[ Generate proposal ]

→ 7 suggested changes
  Hero  CURRENT | PROPOSED  [Accept] [Keep] [Edit]
  ...
[ Apply accepted to draft ]
```

Same shell; different actions per type.

---

## Database changes (planned, not now)

| Change | Why |
| --- | --- |
| `AIContentProposal` | Field proposals without duplicate CMS tables |
| Optional polymorphic run link | Track non-Insight generations |
| Work verified notes / approvedForAI | Case Study privacy boundary |
| Testimonial displayExcerpt (optional) | Excerpt integrity |
| Homepage draft (optional later) | Safer Homepage AI |

Do **not** create per-type AI content tables.

---

## Permissions

- AI actions require existing CMS edit capability for that entity
- Publish remains separate human action
- Reuse `use_ai_writer` initially; consider finer caps later if needed
- `approve_ai_cms` analogy for accepting large proposals optional

---

## Cost / jobs

| Op | Cost class | Execution |
| --- | --- | --- |
| Single field improve | Cheap | Request-scoped run |
| Fill missing / full page | Moderate | Request-scoped + fingerprint |
| Platform/Industry research | Research-heavy | Run record; consider job recovery |
| Guide long draft | Moderate–heavy | Similar to Insight pipeline |

Reuse stale-run recovery; no cron required for assistants.

---

## Success criteria

1. Editors get type-correct help without generic SEO sludge  
2. Zero fabricated testimonials/metrics/experience  
3. Stable IDs/scoring untouched  
4. Insight AI Writer undisturbed  
5. Topic Intelligence can route UPDATE_PLATFORM etc. to Platform AI  
6. All accepts go through draft/revision/publish  

---

## Out of scope for first implementation

- Auto-publish  
- Generating testimonials  
- Mutating tool scoring  
- Replacing Topic Intelligence with CMS writers  
- Full Homepage redesign  
- Nigeria-specific defaults
