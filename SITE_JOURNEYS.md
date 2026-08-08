# Site Journeys & Connection Architecture

Smartlance Designs should feel like **one connected system**, not separate
Services / Solutions / Resources / Tools sites.

Internal links answer: *What would this visitor reasonably want to do next?*

Do not maximize link count. Maximize connection quality.

---

## Page-family roles

| Family | Role | Typical next steps |
| --- | --- | --- |
| **Services** | What Smartlance can do | Solutions · Work · Pricing · Contact |
| **Solutions** | What problem needs solving | Services · Resources · Free Review / Planner · Contact |
| **Platforms** | Technology context | Selector · Comparison · Services · Contact |
| **Industries** | Business context | Solutions · Services · Work · Contact |
| **Work** | Proof | Services · Industry · Contact |
| **Resources** | Learn / decide / prepare | Deeper resource · Solution/Service · Contact when ready |
| **Pricing** | Scope / investment guidance | Planner · Brief · Selector · Free Review · Contact |
| **Project Planner** | What kind of project? | Solution · Brief · Selector · Pricing · Contact |
| **Project Brief** | Capture requirements | Pricing · Selector · Contact |
| **Platform Selector** | Technology shortlist | Platform pages · Comparison · Brief · Contact |
| **Free Website Review** | Existing-site diagnosis | Audit (deeper) · Solutions · Pricing · Contact |
| **About** | Trust | Work · Services · Contact |
| **Contact** | Commercial handoff | Planner / Brief / Free Review as secondary helpers only |

---

## Core visitor journeys

### A. I know my problem
Solution → relevant Service → proof/resource → Contact

### B. I know the service
Service → relevant Solution → Work → Contact

### C. I don’t know what I need
Project Planner → Solution/Service → planning resource → Contact

### D. New website
New Business Website → Planner → Brief → Platform Selector → Pricing → Contact  
*(No Free Review as primary.)*

### E. Existing website
Solution / Free Review → Service → Guide/Checklist → Pricing → Contact

### F. Choosing technology
Platforms → Selector → Comparison → Platform detail → Contact

### G. Researching
Insight / Guide / Glossary → deeper Resource → Solution/Service → Contact

### Short path (ready client)
Home → Service → Contact — must remain possible.

---

## Three connection levels

1. **Primary next step** — strongest logical action  
2. **Supporting education** — helps understanding  
3. **Optional alternative** — another readiness level  

Do not present five equal CTAs.

---

## CTA vocabulary

| Destination | Label |
| --- | --- |
| Contact | Tell Us About Your Project |
| Free Review | Get a Free Website Review |
| Planner | Plan Your Project |
| Project Brief | Use the Project Brief Template |
| Platform Selector | Use Website Platform Selector |
| Pricing | View Pricing & Project Scope |
| Services | Explore Services |
| Solutions | Explore Solutions |
| Work | View Our Work |
| Resources | Explore Resources |
| Case study | View Case Study |

---

## Related-content limits

| Type | Max shown |
| --- | ---: |
| Solutions | 2–3 |
| Services | 3–4 |
| Resources | 2–4 |
| Work | 3 |
| Platforms | 2–3 |
| Glossary peers | 2–4 |

Hide a section when relationships are weak — do not invent filler.

---

## Distinctions to preserve

| Pair | Difference |
| --- | --- |
| Free Review vs Contact | Diagnosis of an existing site vs ready to discuss a project |
| Planner vs Brief | Project type vs detailed requirements |
| Planner vs Platform Selector | Project type vs technology |
| Free Review vs Website Audit | Lightweight review vs deeper paid diagnosis |
| Pricing | Scope guidance — not an instant quote |

---

## Source of truth

| Layer | Location |
| --- | --- |
| Relationship priorities | `data/site-relationships.ts` |
| Resolvers | `lib/site-relationships.ts` |
| Connection UI | `components/connections/connection-links.tsx` |
| Commercial CTA matrix | `COMMERCIAL_JOURNEY.md` |
| Per-entity related fields | `data/solutions.ts`, `data/services.ts`, resource content types |

Prefer the relationship registry for Solution ↔ Service priority. Entity `related*` fields remain for work proof, peer lists, and copy-specific reasons.

---

## Primary CTA by page family (guidance)

| Page | Primary | Secondary |
| --- | --- | --- |
| Homepage | Contact | Work (hero); Planner / Free Review contextual mid-page |
| Services hub | Contact | Planner |
| Service detail | Contact | Free Review where existing-site |
| Solutions hub | Planner (uncertainty) | Contact / Free Review |
| Solution detail | Contextual (Review or Contact) | Alternate commercial |
| Platforms hub | Platform Selector | Contact |
| Platform detail | Contact | Selector / Comparison |
| Pricing | Contact | Planner |
| Planner / Brief / Selector | Interactive flow | Contact near completion |
| Free Review | Form submit | Audit / Solutions helpers |
| Contact | Form submit | Planner / Brief / Review helpers |
| Work / About | Contact | Work or Services |

Individual pages may differ when intent is clearer.

---

## Relationship matrix (summary)

See `data/site-relationships.ts` for the live matrix:

- `solutionJourney` — Solution → services / resources / Free Review flag  
- `serviceToSolutions` — Service → Solutions  
- `platformConnections` — Selector / Comparison / commerce cues  
- `industryToSolutions` — Industry themes → Solutions  

---

## Rules of thumb

- Navigation answers “Where can I go?” Contextual links answer “What’s next?”
- Breadcrumbs are hierarchy, not cross-sell.
- Educational pages progress education before Contact.
- No Free Review on New Business as the primary path.
- No giant “related everything” dumps.
- No AI / fake personalization language on static relationships.
