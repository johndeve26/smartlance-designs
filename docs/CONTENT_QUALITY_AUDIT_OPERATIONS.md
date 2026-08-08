# Content Quality Audit — Operations

## Purpose

Review **published** Smartlance pages for clarity, freshness, duplication, proof, SEO, and relationships.  
Identify **what** needs attention. Use existing specialized assistants for **how** to improve.

This is **not** a site-wide rewrite engine.

---

## Where to run

Admin → Site → **Content audit** → `/admin/content-audit`

Requires `edit_draft`.

CLI (read-only baseline refresh):

```bash
npx tsx scripts/dump-published-content-inventory.ts
npx tsx scripts/run-content-quality-audit.ts
```

Artifacts land in `docs/audit-artifacts/`.

---

## Interpret verdicts

| Verdict | Meaning |
| --- | --- |
| STRONG | Protect — no change recommended unless a new issue appears |
| LIGHT_POLISH | Minor gaps (CTA, relations, optional fields) |
| NEEDS_IMPROVEMENT | Material copy/SEO/structure gaps |
| NEEDS_RESEARCH | Factual review required later via Platform/Comparison/Guide AI |
| NEEDS_PROOF_REVIEW | Proof claim risk — human first |
| NEEDS_STRUCTURAL_REVIEW | Structure/pageContent issues |
| DUPLICATE / CANNIBALIZATION REVIEW | Overlap cluster — human consolidation |
| STALE | Actual outdated signals (not age alone) |
| BLOCKED BY MISSING FACTS | Cannot responsibly improve without source facts |

Priority (HIGH / NORMAL / LOW) is editorial urgency — **not** a quality score.

---

## Workflow

1. Open Content audit  
2. Filter by type / verdict / priority  
3. Read site-level findings + first improvement wave  
4. Open the page editor from the handoff link  
5. Choose the matching assistant action (do **not** expect auto-generation from the audit)  
6. Generate proposal → human accept → apply to **draft**  
7. Preview → publish manually  
8. Re-run audit later to see remaining OPEN issues  

Homepage: apply AI to draft only; publish separately.

---

## False positives

If a finding is wrong or intentional:

- Treat as dismissible for calibration (document reason in editorial notes for now)  
- Reasons: Intentional · Already handled · Incorrect · Not priority · Other  

Full persisted finding status workflow can mirror Link Health later; baseline v1 is live-scan + JSON snapshot.

---

## Mapping findings → assistants

| Finding type | Assistant |
| --- | --- |
| Generic / thin Service | Service AI |
| Stale Platform facts | Platform AI → Research & improve |
| Thin Industry | Industry AI |
| Work presentation | Case Study AI |
| Comparison freshness | Comparison AI |
| Glossary definition | Glossary AI |
| Homepage SEO/copy | Homepage Copy Assistant |
| Insight consolidation | Insight Editorial Studio + human redirects |

Never: Generate Testimonial · Optimize Tool scoring · Rewrite entire site.

---

## Security

Audit uses published CMS fields only. It must not load Enquiries, private Work notes, Testimonial verification notes, or provider secrets.

---

## Related docs

- `docs/SMARTLANCE_CONTENT_AUDIT_BASELINE.md`  
- `docs/SMARTLANCE_CONTENT_AUDIT_REPORT.md`  
- `docs/SMARTLANCE_CONTENT_IMPROVEMENT_PLAN.md`  
- `docs/AI_CONTENT_ASSISTANTS_SITEWIDE_OPERATIONS.md`
