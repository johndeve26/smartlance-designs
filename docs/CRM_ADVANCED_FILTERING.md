# CRM Advanced Filtering

## Filter language (v3)

Shared AST used by **Saved Views** and **Segment filter version 3**:

```json
{
  "version": 3,
  "match": "ALL",
  "conditions": [
    { "kind": "STANDARD", "field": "countryCode", "operator": "IS", "value": "US" },
    { "kind": "CUSTOM", "propertyId": "...", "operator": "GT", "value": 100000 },
    { "kind": "SOCIAL", "platform": "LINKEDIN", "operator": "HAS" },
    { "kind": "NOTES", "operator": "CONTAINS", "value": "proposal" }
  ]
}
```

- Max 30 conditions
- **Never** store raw Prisma `where` objects
- Server validates operators per field/property type
- Translator: `contactFilterV3ToWhere()` in `lib/crm/filters/contact-filter-query.ts`

## Segment compatibility

- v1/v2 segment filters unchanged (`segmentFilterToWhereLegacy`)
- New segments may use v3 (same AST as views)
- Custom property filters reference `propertyId`, not display label

## Notes filter

`NOTES CONTAINS` searches `CrmActivity` type NOTE only — not included in default quick search.

## Quick search

Global `q` search covers standard text fields + company name + text custom properties (not notes).
