# AI Content Assistants — Security (Phases A–E)

## Permissions

Both required server-side: `use_ai_writer` + `edit_draft`.  
Publish remains a separate `publish` permission. AI cannot publish Homepage or any other CMS type.

---

## Field allowlists

Separate allowlists per type. Protected examples:

| Type | Never AI-set |
| --- | --- |
| Platform | `verifiedExperience`, `platformMatch`, `prominence`, `featured`, `status`, `publishedAt`, `lastReviewedAt` (server-only) |
| Industry | `group`, `hasVerifiedProjectExperience`, `featured`, `status`, `publishedAt` |
| Work | `status`, `publishedAt`, featured flags, `clientName`/`name`/`slug`, `approvedForAI`/`approvedProjectFacts`, private notes, `platformId` |
| Testimonial | `verified`, `status`, attribution, `originalQuote`, internal notes |
| Guide/Comparison/Glossary | status/slug/href/featured; wholesale `payload`; structural IDs |
| Checklist | item/section/subgroup IDs (server generates new item IDs) |
| Template | field IDs, option values, `showWhenAny`, storage |
| Tool | scoring/weights/signals/question IDs/option values — CMS copy only |
| Homepage | `sectionVisibility`, `noIndex`, `canonicalOverride`, `draftJson` / draft clocks, status/publish |
| Service / Solution | unchanged from Phase A |

Wrong-subtype apply is rejected (e.g. Comparison proposal cannot apply to Guide).  
TI handoff rejects recommendation ↔ targetEntityType mismatches.

---

## Research & claims

- Required research fails closed when provider unavailable
- Sources treated as UNTRUSTED DATA
- Comparison: no universal winners / fake ratings
- Glossary: do not present obsolete metrics (e.g. FID) as current CWV
- Homepage: block invented client counts / awards / fake trust metrics
- Field blockers / apply validation prevent accepting unsafe fields

---

## Case Study / Testimonial

- Work: external news cannot prove project results
- Testimonial: never generate quotes; curation suggests verified published only

---

## Homepage publish boundary

AI apply → `saveHomepageDraft` only. Draft saves do not revalidate public Homepage. Only human `publishHomepage` revalidates.

---

## PII / secrets

Context builders exclude Enquiry, EnquiryNotes, private client notes, admin PII. Provider secrets never enter prompts. SSRF and prompt-injection protections unchanged.
