# Smartlance UI Design System V1

## Brand

- Primary orange: `#F47A48` (`--orange-500`)
- Dark charcoal: `#535353` (`--neutral-600`)
- White: `#FFFFFF`
- Warm neutral page background: `#FAF9F7` (`--neutral-50`)

Interactive CTAs use `--color-cta` (orange-700) for WCAG AA with white text.

## Tokens

Source of truth: [`app/globals.css`](../app/globals.css)  
JS mirror: [`lib/ui/tokens.ts`](../lib/ui/tokens.ts)

### Typography scale

| Utility | Use |
|---------|-----|
| `.text-display` | Marketing hero (public) |
| `.text-page-title` | Dashboard/page titles |
| `.text-section-heading` | Section headings |
| `.text-card-title` | Card/list titles |
| `.text-body-sm` | Supporting copy |
| `.text-label` | Form labels |

Fonts: **Syne** (display), **Figtree** (body).

### Radius

- Buttons/inputs: `--radius-md` (10px)
- Cards: `--radius-lg` (14px)
- Status pills: full rounded

### Surfaces

- `--surface-page` — warm neutral page background
- `--surface-elevated` / `--color-surface` — white content panels
- Borders: `--color-border`

## Shared primitives

Located in [`components/ui/`](../components/ui/):

- `Button` — primary, secondary, outline, ghost, tertiary, destructive
- `Input`, `Textarea`, `Select`, `Checkbox`
- `Badge`, `StatusBadge`
- `PageHeader`, `ProductSectionHeader`
- `EmptyState`, `Skeleton`
- `Alert`, `Dialog`
- `DataTable`, `FilterBar`, `SearchInput`, `Pagination`

## Status system

[`lib/ui/status.ts`](../lib/ui/status.ts) maps domain enums to semantic tones:

`neutral | info | success | warning | danger | active`

Client-facing labels: [`lib/portal/status-labels.ts`](../lib/portal/status-labels.ts)

## Button hierarchy

1. **Primary** — one obvious action per section (orange CTA fill)
2. **Secondary** — outline
3. **Tertiary** — text link
4. **Destructive** — red, never styled as primary CTA

## Forms

Always use visible labels. Optional fields marked `(optional)`. Errors below field with `role="alert"`.

## Tables

Admin operational tables use `DataTable` with sticky headers. Mobile: horizontal scroll or row cards per page.

## Icons

Lucide only via [`components/ui/icon.tsx`](../components/ui/icon.tsx).

## Experience density

| Surface | Density |
|---------|---------|
| Public | Editorial, spacious |
| Prospect | Light, guided |
| Client | Calm, action-oriented |
| Admin | Operational, compact |
