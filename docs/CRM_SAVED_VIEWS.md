# CRM Saved Views

Saved views (`CrmContactView`) store validated filter v3 JSON for repeatable Contact browsing.

## vs Segments

| | Saved View | Segment |
|---|------------|---------|
| Purpose | Admin browsing | Operations/outreach populations |
| Entity | `CrmContactView` | `CrmSegment` |
| Filter | Contact filter v3 | v1/v2 legacy or v3 |

Same filter AST; different entities and UX.

## Usage

- URL: `/admin/crm/contacts?view={viewId}`
- Personal views: creator can edit/delete
- Optional shared views (`isShared`) visible to all CRM viewers
- Counts computed dynamically (not stored)

## Permissions

- Create/save/delete own views: `manage_crm`
- View shared/personal: `view_crm`
