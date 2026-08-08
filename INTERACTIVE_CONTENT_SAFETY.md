# Interactive content safety (Phase 3)

## Checklist

- Stable **item IDs** power `localStorage` progress for the Website Redesign Checklist.
- Migration preserves all **127** IDs.
- Admin may edit item **text**, priority, and ordering.
- Do **not** rename IDs after publish. Prefer archive/inactive over delete for published items.

## Template

- Website Project Brief Template: **14** sections / **73** field IDs.
- Browser key: `smartlance.template.website-project-brief-template`.
- Admin may edit labels, help, options.
- Condition configuration must stay on whitelisted field/option IDs.
- Rendering/persistence/print engines remain in code.

## Tool

- Website Platform Selector scoring, tie-break, low-confidence, and commerce filters remain in **code**.
- Admin may edit question/option display copy and result descriptions.
- Question IDs, option IDs, and candidate platform IDs stay stable.
- After content import, re-run selector scenario tests — ordering must not change from copy-only edits.
