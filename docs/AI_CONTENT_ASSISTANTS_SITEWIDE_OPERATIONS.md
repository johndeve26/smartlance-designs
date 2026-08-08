# AI Content Assistants — Sitewide Operations

How editors use specialized AI across the Smartlance CMS.

---

## Shared flow (every content family)

1. Open the **content editor** (not a central “rewrite site” console)  
2. Use the compact assistant panel  
3. Choose an action → **Generate proposal**  
4. Review CURRENT / PROPOSED → Accept / Keep / Edit  
5. **Apply** → CMS draft/revision  
6. **Preview**  
7. **Publish** manually (separate permission)

Nothing publishes automatically.

---

## By content family

| Family | Where | Typical actions | Notes |
| --- | --- | --- | --- |
| Insights | AI Writer | Brief → outline → draft | Separate editorial studio |
| Service | `/admin/services/[id]` | Fill / improve / FAQs / SEO | Commercial clarity |
| Solution | `/admin/solutions/[id]` | Fill / improve / SEO | Problem-first |
| Platform | `/admin/platforms/[id]` | Research & improve | Official-source policy |
| Industry | `/admin/industries/[id]` | Improve / experience-safe | Proven vs supported |
| Work | `/admin/work/[id]` | Case Study presentation | Verified facts only |
| Testimonial | `/admin/testimonials/[id]` | Format / excerpt | Never invent quotes |
| Guide…Tool | `/admin/resources/...` | Subtype-specific | IDs / scoring protected |
| Homepage | `/admin/homepage` | Hero / CTA / SEO / curation | **Draft only** until Publish |

If no action exists for a type: show **No AI action available** — never fall back to a generic page writer.

---

## Topic Intelligence → assistant

1. Discover opportunity  
2. See recommended action (Update Service, Expand Guide, Update Case Study, …)  
3. Click handoff → opens editor with “Suggested by Topic Intelligence”  
4. Human starts Generate proposal  
5. Proposal may link back to the opportunity ID  

Wrong type / ambiguous target → blocked or “choose page” — no guessing.

---

## Homepage draft ops

| Action | Effect on public site |
| --- | --- |
| Save draft | None |
| Apply AI proposal | Draft only |
| Preview | Shows draft |
| Discard draft | Reverts editor to published |
| Publish | Public updates + revalidate |

Unsaved browser form ≠ CMS draft. Labels distinguish them.

---

## Reviewing research / proof

- Check Research used / Claim Ledger when present  
- Field blockers prevent accepting unsafe claims  
- Platform/Comparison: official sources; no fabricated winners  
- Work: external news ≠ project results  
- Homepage: no “Trusted by 500+…” without verified config  

---

## Permissions

- Assistants: `use_ai_writer` **and** `edit_draft`  
- Publish: `publish` (separate)  
- AI never escalates to publish  

---

## See also

- `docs/AI_CONTENT_ASSISTANTS_FINAL_ARCHITECTURE.md`  
- `docs/AI_CONTENT_ASSISTANTS_COVERAGE_MATRIX.md`  
- `docs/HOMEPAGE_DRAFT_AND_AI.md`  
- `docs/TOPIC_INTELLIGENCE_OPERATIONS.md`
