# CRM Architecture

Smartlance CRM Foundation V1 is an internal Admin sales workspace. It is separate from Audience (marketing subscribers) and Enquiries (inbound form records).

## Domain separation

| Concept | Purpose |
|---------|---------|
| **CrmContact** | Business relationship / prospect |
| **Subscriber** | Explicit marketing opt-in |
| **Enquiry** | Inbound form submission record |
| **CrmLead** | Active sales pursuit for a contact |
| **CrmDeal** | Qualified opportunity in pipeline |

Creating a CRM Contact does **not** subscribe anyone. Enquiry persistence never depends on CRM success.

## Lead policy (V1)

- **One active lead per contact** — active means status not in `UNQUALIFIED`, `CLOSED`.
- Repeat inbound forms link activity to the existing active lead instead of creating duplicates.
- When a lead becomes inactive, a new lead may be created manually or from a future enquiry.

## Follow-up canonical source

- **Tasks** are the canonical follow-up action.
- `CrmContact.nextActivityAt` is denormalized from the earliest open task due date.

## Activity vs AuditLog

- **CrmActivity** — sales relationship timeline (notes, emails, status changes).
- **AuditLog** — security/admin actions (exports, archive, email status overrides).

## Enquiry integration

Order: validate → save enquiry → notify → optional audience opt-in → **async CRM upsert** (failures logged, enquiry preserved).

Inbound contact / website review creates or updates Contact, creates WARM lead if none active, records `FORM_SUBMISSION` activity with enquiry reference (not full body).

## Email & suppression

CRM contacts have independent `emailStatus`. Outbound CRM email checks status server-side. Subscriber unsubscribe may sync to CRM `UNSUBSCRIBED` for shared emails — marketing consent remains distinct from one-to-one business correspondence.

## Routes

- `/admin/crm` — overview
- `/admin/crm/contacts`, `/companies`, `/leads`, `/deals`, `/tasks`, `/email-templates`

## RBAC

- `view_crm` — SUPER_ADMIN, EDITOR
- `manage_crm`, `send_crm_email` — SUPER_ADMIN, EDITOR
- `export_crm` — SUPER_ADMIN only
