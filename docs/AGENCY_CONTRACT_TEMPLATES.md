# Contract Templates

## Model

- `AgencyContractTemplate` — named template with status
- `AgencyContractTemplateVersion` — immutable content history

When substantive template content changes, create a new **Template Version**. Existing contract versions retain their original template snapshot.

## No auto-seeded legal text

The empty state shows **Create Contract Template**. Smartlance does not install default legal agreements or imply they are jurisdiction-appropriate.

## Variables

Allowlisted merge variables are defined in `lib/contracts/variables.ts`:

- `{{client_company_name}}`, `{{client_contact_name}}`, `{{accepted_total}}`, etc.

Only variables with resolvable server-side data are exposed. The browser never supplies authoritative values.

## Unresolved variables

Sending is blocked when required variables in template content remain unresolved. Admin sees which variables are missing.

## Variable escaping

Plain-text values are escaped when merged into content so client/company names cannot inject HTML.

## Admin responsibility

Template wording must be professionally reviewed for your business and applicable law. Smartlance does not generate legal advice or AI-drafted clauses.
