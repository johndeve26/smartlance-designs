# CRM Operations

## Daily workflow

1. Open **CRM → Overview** for overdue/today tasks and pipeline counts.
2. Work **Tasks** view (defaults to overdue + today emphasis).
3. Use **Contact detail** for 360° context: lead state, deals, timeline, email eligibility.

## Manual contact creation

Admin → CRM → Contacts → New Contact. Does not create Subscriber.

## CSV contact import

Admin → CRM → Contacts → **Import CSV**. See [CRM_CSV_IMPORT.md](./CRM_CSV_IMPORT.md) and [CRM_IMPORT_DUPLICATE_POLICY.md](./CRM_IMPORT_DUPLICATE_POLICY.md).

- Preview before import; max 5 MB / 5,000 rows
- Standard fields + location + social + custom properties
- Match existing contacts by normalized email
- Suppression always wins; no Subscriber creation

## Contact properties (V3.4)

Location, social profiles, typed custom properties, advanced filters, saved views. See [CRM_CONTACT_PROPERTIES.md](./CRM_CONTACT_PROPERTIES.md).

## Qualification flow

Contact → Lead (NEW) → CONNECTED → QUALIFIED → Create Deal → stage through pipeline → WON sets contact lifecycle to CLIENT.

## Archive

Contacts are archived (`isArchived`), not hard-deleted. Use existing enquiry anonymization for separate privacy workflows.

## Export

Super Admin only. CSV uses formula-injection escaping. Exports are audit-logged.

## Backfill (optional)

```bash
npm run crm:backfill:enquiries -- --dry-run
npm run crm:backfill:enquiries
```

Does not alter enquiries. Reports conflicts. Does not create subscribers.

## Deployment

1. Backup DB
2. `npx prisma migrate deploy`
3. `npx prisma generate`
4. Restart app (Prisma client fingerprint bumped)
