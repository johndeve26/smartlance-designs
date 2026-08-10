# Client Portal Onboarding

## Access

Authenticated `ClientPortalUser` with active `AgencyProjectClientAccess` on the project. Revoking access immediately blocks onboarding routes.

## Workspace

`/portal/projects/[projectId]/onboarding`:

- Welcome message, progress, questionnaire sections
- "What we need from you" (requirements)
- File uploads and ACCESS invitation confirmations
- Clarification messages from review
- Submit for review (confirmation)

## Portal home

`getPortalOnboardingAttention()` surfaces unfinished onboarding and clarifications alongside existing project attention items.

## Privacy

Portal responses exclude internal admin notes. Onboarding routes are not in sitemap; portal remains noindex.
