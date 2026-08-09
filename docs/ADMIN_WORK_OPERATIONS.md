# Admin Work operations

## Editor buttons

| Button | Permission | Effect |
| --- | --- | --- |
| Save draft | `edit_draft` | Writes `draftJson` overlay; public unchanged |
| Preview | `preview` | Sets preview cookie; renders effective fields |
| Publish | `publish` | Saves form to draft first (if fields present), then promotes |
| Discard draft | `edit_draft` | Clears overlay |
| Unpublish | `publish` | Sets `ARCHIVED` |
| Change slug + 301 | `slug_redirect` | Immediate published slug change (prefer draft slug + publish) |

## Case study tab

- **Website:** challenge/approach/solution points, highlights, platform context
- **Product:** engineering, principles, features, SaaS infrastructure, architecture diagram, CTA

`caseStudyKind` controls which product sections are shown. Kind changes do not delete stored JSON; inactive sections remain in `caseStudyContent` until cleared.

## AI Case Study assistant

Uses `approvedProjectFacts` only. Cannot modify `caseStudyKind`, stable structured IDs, media paths, or publish directly.
