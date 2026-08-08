# AI Content Assistants — Architecture (Phases A–E)

**Status:** Service · Solution · Platform · Industry · Work · Testimonial · Guide · Comparison · Checklist · Glossary · Template · Tool · **Homepage**  
**Final architecture:** `docs/AI_CONTENT_ASSISTANTS_FINAL_ARCHITECTURE.md`

---

## Principle

```
SHARED PROVIDERS / BRAND VOICE / SECURITY / PROPOSALS / RESEARCH
+ specialized modules per entity type
→ HUMAN-REVIEWED FIELD PROPOSALS
→ NORMAL CMS REVISION / DRAFT / PUBLISH
```

Resources are **not** one GenericResourceAI. Six separate modules share `resource-factory` / ID-safety helpers only.  
Homepage uses `draftJson` — AI never writes live columns directly.

---

## Registry

| Entity | Module |
| --- | --- |
| SERVICE | `service/` |
| SOLUTION | `solution/` |
| PLATFORM | `platform/` |
| INDUSTRY | `industry/` |
| WORK | `work/` (Case Study AI) |
| TESTIMONIAL | `testimonial/` |
| GUIDE | `guide/` |
| COMPARISON | `comparison/` |
| CHECKLIST | `checklist/` |
| GLOSSARY | `glossary/` |
| TEMPLATE | `template/` |
| TOOL | `tool/` (Tool Copy Assistant) |
| HOMEPAGE | `homepage/` (Homepage Copy Assistant) |

**Count:** 13. Not registered: GENERIC_PAGE.

Shared: `proposals.ts`, `allowlists.ts`, `proof.ts`, `research.ts`, `resource-kinds.ts`, `resource-shared.ts`, `resource-id-safety.ts`, `resource-factory.ts`.

CmsResource subtypes share `/admin/resources/[type]/[id]` — panel title/actions switch by subtype.

---

## Topic Intelligence handoffs

Central router: `lib/ai/topic-intelligence/content-assistant-handoff.ts`

| Recommendation | Target |
| --- | --- |
| WRITE_NEW | Insight Editorial Studio |
| UPDATE_*_PAGE | Matching CMS assistant |
| UPDATE_WORK_PAGE | Case Study AI (existing Work only) |
| UPDATE_HOMEPAGE | Homepage Copy Assistant |
| EXPAND_EXISTING_RESOURCE | Resource subtype assistant |

Does not create Insight projects by default. TEMPLATE/TOOL only when an existing resource is identified. Never GENERATE_TESTIMONIAL. Never Tool scoring changes. Human initiates generation.

---

## Homepage draft boundary

See `docs/HOMEPAGE_DRAFT_AND_AI.md`. Published columns = live; `draftJson` = unpublished; publish is human-only.

---

## Related docs

- `docs/AI_CONTENT_ASSISTANTS_SITEWIDE_OPERATIONS.md`
- `docs/AI_CONTENT_ASSISTANTS_COVERAGE_MATRIX.md`
- `docs/AI_CONTENT_ASSISTANTS_PHASE_E_COMPLETION.md`
- `docs/AI_PROOF_CONTENT_POLICY.md`
- `docs/AI_RESOURCE_CONTENT_POLICY.md`
