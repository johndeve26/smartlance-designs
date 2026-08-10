# Prospect to Client

Same `ClientPortalUser` throughout.

1. Prospect uses workspace
2. Admin sends proposal → `grantProposalAccess`
3. Prospect accepts via existing `/portal/proposals/[id]`
4. Project conversion grants project access
5. `/portal` becomes available — no new signup

Historical reviews, briefs, and requests remain in workspace.

Proposal traceability: `AgencyProposal.sourceProspectRequestId`.
