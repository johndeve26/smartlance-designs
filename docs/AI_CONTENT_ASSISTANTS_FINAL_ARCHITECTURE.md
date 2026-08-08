# AI Content Assistants — Final Architecture

**Status:** Phases A–E complete (13 specialized assistants)

---

## Principle

```
TOPIC INTELLIGENCE
  → correct content type
  → specialized assistant
  → AI proposal
  → human review
  → CMS draft / revision
  → preview
  → manual publish
```

Not: “AI can write anything.”  
Yes: each page type has intent, allowlists, evidence rules, and a human gate.

---

## Registry (13)

| Entity | Assistant | Module |
| --- | --- | --- |
| SERVICE | Service AI | `service/` |
| SOLUTION | Solution AI | `solution/` |
| PLATFORM | Platform AI | `platform/` |
| INDUSTRY | Industry AI | `industry/` |
| WORK | Case Study AI | `work/` |
| TESTIMONIAL | Testimonial Assistant | `testimonial/` |
| GUIDE | Guide AI | `guide/` |
| COMPARISON | Comparison AI | `comparison/` |
| CHECKLIST | Checklist AI | `checklist/` |
| GLOSSARY | Glossary AI | `glossary/` |
| TEMPLATE | Template Assistant | `template/` |
| TOOL | Tool Copy Assistant | `tool/` |
| HOMEPAGE | Homepage Copy Assistant | `homepage/` |

**Not registered:** GENERIC_PAGE.

Shared foundation: `AIContentRun`, `AIContentProposal`, allowlists, Zod schemas, prompts, Brand Voice, model routing, research providers, Source Policy, Claim Ledger, CURRENT/PROPOSED, partial accept, stale protection, CMS revisions, RBAC, audit, SSRF, prompt-injection, PII exclusions, **no auto-publish**.

---

## Proposal lifecycle

1. Human chooses assistant action  
2. Server builds typed context (no Enquiry / private notes)  
3. Provider or heuristic → structured proposal  
4. Editor accepts / keeps / edits fields  
5. Apply → draft/revision only  
6. Preview  
7. Human publish  

Stale: if entity `updatedAt` (Homepage: `draftUpdatedAt ?? updatedAt`) changes after generation → STALE, apply blocked.

---

## Research & proof

| Family | Research | Proof |
| --- | --- | --- |
| Service / Solution | Optional | No invented metrics |
| Platform / Industry | Often required / recommended | Official sources; experience boundaries |
| Work | Rare | Verified project facts only |
| Testimonial | No | Never invent quotes; verified only |
| Resources | By subtype | Neutrality / ID / scoring protections |
| Homepage | Normally none | No invented trust stats; curation = real IDs |

---

## Technical-field protection

Every action has a server-side allowlist. Protected examples: status, publishedAt, slugs (where policy says), visibility flags, scoring weights, checklist/template IDs, `verified`, Homepage `sectionVisibility` / `noIndex` / draft system fields.

---

## Topic Intelligence routing

Central: `lib/ai/topic-intelligence/content-assistant-handoff.ts`

Maps recommendations to assistants; prefers `targetEntityType`/`targetEntityId`; rejects mismatches; never auto-runs generation; never GENERATE_TESTIMONIAL; never Tool scoring changes.

---

## Homepage draft architecture

- **Live columns** = public Homepage  
- **`draftJson`** = unpublished editor/AI changes  
- Public reads published only  
- Publish promotes draft → live and revalidates  
- AI apply → draft only  

See `docs/HOMEPAGE_DRAFT_AND_AI.md`.

---

## Publishing boundary

AI cannot call publish actions, set `publishedAt` / status / live flags, or revalidate public Homepage via draft save.
