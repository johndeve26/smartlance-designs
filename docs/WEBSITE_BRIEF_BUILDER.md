# Website Brief Builder

Routes: `/website-brief`, `/templates/website-project-brief-template` (resource entry)

## Schema

14 sections, 73 stable field IDs in `data/templates/website-project-brief-template.ts`.

localStorage key: `smartlance.template.website-project-brief-template`

## Persistence

- Anonymous: localStorage (unchanged)
- Authenticated: `AgencyWebsiteBrief.answersJson` with server-side completion calc

## Submission

Immutable snapshot on request submit; draft edits do not rewrite submitted data.

See `WEBSITE_BRIEF_AI_ASSISTANT.md`.
