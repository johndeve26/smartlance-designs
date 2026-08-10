# Client Portal Architecture (V2)

## Mental model

The Client Portal is a **composition layer** over existing agency domain systems. Clients experience one workspace — not separate modules for proposals, contracts, billing, onboarding, or change requests.

Core client questions:

- What needs my attention?
- How is my project going?
- What does Smartlance need from me?
- What do I need to approve?
- What have I signed / paid?
- Where are my files?

## Navigation

### Desktop sidebar

- Home
- Projects
- Approvals
- Files
- Documents (Proposals + Contracts)
- Billing
- Account / Sign out

### Mobile bottom nav

- Home · Projects · Files · Billing · More

**More** links to Approvals, Documents, Account, Sign out.

## Routes

| Route | Purpose |
|-------|---------|
| `/portal` | Home — attention, projects, activity |
| `/portal/projects` | All accessible projects |
| `/portal/projects/[id]` | Project workspace (Overview, Timeline, Files, Changes) |
| `/portal/approvals` | Unified approval center |
| `/portal/files` | Global file library |
| `/portal/documents` | Proposals and contracts |
| `/portal/billing` | Invoices and payments |
| `/portal/account` | Profile and team (read-only) |
| `/portal/more` | Mobile hub |

Nested detail routes preserved for email CTAs:

- `/portal/proposals/[id]`, `/portal/contracts/[id]`, `/portal/invoices/[id]`
- `/portal/projects/[id]/onboarding`, `/portal/projects/[id]/changes/[changeId]`

List routes `/portal/proposals` and `/portal/contracts` redirect to `/portal/documents`.

## Data boundary

All client-facing reads go through `lib/portal/*`:

- `home.ts`, `attention.ts`, `timeline.ts`, `files.ts`, `approvals.ts`, `documents.ts`, `account.ts`, `project-workspace.ts`, `status-labels.ts`

Components must not query admin models directly.

## Authorization pattern

1. Authenticate portal session
2. Authorize resource (explicit access grant)
3. Build client-safe DTO
4. Render

**Same company ≠ authorized.** Every resource requires explicit grants.

## UI shell

`PortalShell` provides consistent layout, brand colors (#F47A48 primary, #535353 charcoal), attention badge, and responsive navigation.

Portal pages use `noindex` metadata and private caching.

## Deferred (Client Success V1+)

- Support tickets
- Website care
- Analytics / reporting
- AI summaries
- Full client team invitations (V2 shows read-only “People with access”)
