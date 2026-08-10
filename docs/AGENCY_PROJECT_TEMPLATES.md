# Agency Project Templates

## Model

- `AgencyProjectTemplate` — name, service type, description, archived flag
- `AgencyProjectTemplateMilestone` — title, position, `offsetDaysStart`, `offsetDaysDue`, client visibility
- `AgencyProjectTemplateTask` — title, position, priority, `offsetDaysDue`, optional milestone link
- `AgencyProjectTemplateRequirement` — client requirement placeholders

## System templates

Seven generic starter templates are available via explicit admin action (**Install starter templates**). They are editable and identified by stable `systemKey` values:

- `website-design`, `website-redesign`, `landing-page`, `ecommerce`, `seo`, `branding`, `website-maintenance`

Installation is idempotent: existing templates (including edited starters) are skipped. Partial installation creates only missing starters. Archived starters are not silently restored.

**Templates are never auto-installed on page load.**

## Instantiation

`instantiateTemplateIntoProject()` runs in a transaction:

1. Creates milestones with dates from project start + offsets
2. Creates tasks linked to milestones
3. Creates requirement placeholders

If the project already has milestones, instantiation is rejected (no double-apply).

## Snapshot behavior

Template edits after instantiation **do not** change existing projects. Each project owns its own milestone/task/requirement rows.

## Archive

Archived templates cannot be selected for new projects. Existing projects are unaffected.

## Date offsets

Simple calendar-day offsets from project `startDate`. No business-day engine in V1.
