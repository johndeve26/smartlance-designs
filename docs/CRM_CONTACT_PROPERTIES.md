# CRM Contact Properties (V3.4)

## Standard vs custom

**Standard Contact fields** (first-class columns on `CrmContact`):

- Identity: first/last/display name, email, phone, job title, company
- Location: countryCode, countryName, stateRegion, city, postalCode, timezone
- CRM ops: source, lifecycle, lead status/temperature (via Lead), email status

**Social profiles** — `CrmContactSocialProfile` relation (LINKEDIN, X, FACEBOOK, etc.)

**Custom properties** — typed `CrmPropertyDefinition` + `CrmContactPropertyValue`

Do not use custom properties for standard fields like Country or Email.

## Property types

TEXT, MULTILINE_TEXT, NUMBER, BOOLEAN, DATE, SINGLE_SELECT, MULTI_SELECT, URL, EMAIL, PHONE

- Max 100 active Contact properties
- Keys immutable; labels may change
- Archive (deactivate) preserves values
- Field type immutable once values exist
- Field type editable while zero current values exist; concurrent type change and first value write are serialized via PostgreSQL row lock on `CrmPropertyDefinition`

## Property type concurrency invariant

The property definition row is the synchronization point for type safety.

**Type mutation** (`updateContactPropertyDefinition`):

1. `BEGIN`
2. `SELECT … FROM "CrmPropertyDefinition" WHERE id = ? FOR UPDATE`
3. If `fieldType` is changing, count current values under the same lock
4. Reject with `PROPERTY_TYPE_IN_USE` when values exist
5. Update definition
6. `COMMIT`

**Value writes** (`setContactPropertyValue` / bulk `setContactPropertyValues`):

1. `BEGIN`
2. Acquire the same `FOR UPDATE` lock on the parent definition
3. Reload authoritative definition (current `fieldType`, active state, options)
4. Validate submitted value against **current** type
5. Upsert or delete value
6. `COMMIT`

**Multi-property bulk writes** lock definitions in stable ascending ID order to reduce deadlock risk.

**Product semantics:** type change is allowed only when **zero current values** exist. Deleting the last value re-opens type change. A concurrent type change and first value insert cannot both commit with incompatible assumptions — one wins, the other validates against the committed state.

Integration tests: `tests/crm/integration/property-concurrency.test.ts` (requires `TEST_DATABASE_URL`).

All production `CrmContactPropertyValue` writes go through `lib/crm/properties/values.ts` (Contact edit, CSV import included).

## Admin

`/admin/crm/settings/properties` — create/archive Contact property definitions (`manage_crm`)

Contact edit: `/admin/crm/contacts/[id]/edit`

## CSV import

Standard location/social columns + active custom properties (`custom:{definitionId}` mapping).

MULTI_SELECT CSV delimiter: semicolon (`;`).

Unknown columns are not auto-created as properties.

## Export

Contact export includes country, social URLs, and custom property columns.

## Privacy

Location, social URLs, and custom values are CRM-admin only and included in contact deletion cascades.

See also: [CRM_ADVANCED_FILTERING.md](./CRM_ADVANCED_FILTERING.md), [CRM_SAVED_VIEWS.md](./CRM_SAVED_VIEWS.md), [CRM_LOCATION_AND_SOCIAL.md](./CRM_LOCATION_AND_SOCIAL.md)
