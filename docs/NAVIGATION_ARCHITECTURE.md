# Navigation Architecture

## Public (`/`)

- **Pattern:** Top horizontal navigation with keyboard-accessible mega menus (desktop) and accordion drawer (mobile)
- **Config:** [`data/navigation.ts`](../data/navigation.ts) — single source of truth; CMS overrides via `navigationRepository` when published
- **Top-level items:** Services · AI & Automation · Solutions · Work · Resources · Company
- **Primary CTA:** Tell Us About Your Project → `/contact`
- **Active states:** [`lib/navigation/active-section.ts`](../lib/navigation/active-section.ts)

### Services mega menu

- **Services** — Web Design, Development, SEO, Conversion, Maintenance, Digital Growth
- **Platforms** — Website & Commerce, CRM & Business, AI & Automation

### AI & Automation menu

AI Solutions, AI Agents, Workflow Automation, Voice AI, AI Integrations, Custom AI Tools.

Service pages use `/services/*` slugs — publish matching service pages in CMS when ready.

### Solutions menu

Problem categories linking to hub anchors on `/solutions`:

- Website Problems → `#website-quality`
- Growth Problems → `#visibility`
- Lead Problems → `#growth-conversion`
- Operational Problems → `#change-new`
- Automation Problems → `/solutions`

### Work menu

Websites · AI · Automation — filter links use `/work?capability=…`.

### Resources mega menu

- **Free Tools** — Free Website Review, Website Brief Builder, Project Planner
- **Learn** — Guides, Insights, Glossary, Templates

Checklists and the Free Tools hub remain reachable via footer / resources hub.

### Company menu

About, How We Work, Contact, Pricing.

### Footer columns

Services · AI & Automation · Solutions · Company · Resources · Legal

### Mobile

Same top-level order; each expandable section mirrors its desktop dropdown.

---

## Prospect (`/workspace`)

- **Pattern:** Compact left sidebar (desktop) · bottom nav (mobile)
- **Config:** [`lib/prospect/navigation.ts`](../lib/prospect/navigation.ts)
- **Not exposed** in public primary navigation

## Client Portal (`/portal`)

- **Pattern:** Left sidebar (desktop) · bottom nav (mobile)
- **Config:** [`lib/portal/navigation.ts`](../lib/portal/navigation.ts)
- **Not exposed** in public primary navigation (benefit shown on marketing pages only)

## Admin (`/admin`)

- **Pattern:** Persistent hierarchical sidebar + top utility bar
- **Config:** [`lib/admin/navigation.ts`](../lib/admin/navigation.ts)

## Role filtering

Navigation hiding is UX only. Server authorization remains mandatory on every route.
