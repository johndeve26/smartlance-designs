# Enquiry Privacy

## Fields stored

**Contact:** name, email, company, website, service, projectDetails, budget, timeline, referralSource, sourcePath, timestamps, notification metadata.

**Website review:** name, email, websiteUrl, mainConcern, sourcePath, timestamps, notification metadata.

No phone field (not collected). No Planner/Selector/Checklist state attached.

## Access

| Capability | SUPER_ADMIN | EDITOR | CONTENT_MANAGER | REVIEWER |
| --- | --- | --- | --- | --- |
| view_enquiries | yes | yes | no | no |
| manage_enquiries | yes | yes | no | no |
| export_enquiries | yes | no | no | no |
| enquiry_destructive | yes | no | no | no |

Enquiries are never exposed via public repositories/APIs/previews.

## Analytics

Client events may record submit success/error **without** name, email, website, or message.

## Logging

Do not log full form payloads. Prefer enquiry `reference` / id.

## Retention

No invented automatic legal retention window. Super Admin can anonymize or permanently delete. Document business retention separately if required.

## Session replay / Admin analytics

`/admin` remains private; public analytics scripts should not track Admin PII screens. Form privacy copy links to Privacy Statement.
