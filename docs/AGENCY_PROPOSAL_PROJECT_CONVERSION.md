# Proposal → Project Conversion

Accepted proposals enable project creation via `convertAcceptedProposalToProject()`:

- Reuses V1 `createProject()` — does not duplicate project logic.
- Links `AgencyProject.sourceProposalId` and `sourceProposalAcceptanceId` (unique — idempotent).
- Sets `sourceDealId` only if no project already linked to that deal.
- Copies scope summary, budget snapshot (accepted total), deliverable placeholders from accepted version.
- Optional grant of project portal access to selected contacts.
- Acceptance record is never mutated.

Admin confirms project creation — acceptance does not auto-create a project.

Future: contracts/billing remain out of scope for V2.
