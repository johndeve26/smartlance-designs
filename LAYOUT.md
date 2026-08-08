# Layout widths

Smartlance Designs uses **one outer grid**. Page content shares the header’s full shell width — do not leave a large empty right gutter under a full-width header.

Do not invent page-specific `max-w-[…]` wrappers for standard sections.
Prefer `Container` (or the measure utilities below, which resolve to the shell).

---

## Canonical values

| Token | CSS variable | Max width | Use for |
| --- | --- | ---: | --- |
| **Shell / standard** | `--site-shell` / `--content-max` | **1280px** (80rem) | Header, footer, archives, section frames, hubs, **page body** |
| **Reading** | `--reading-max` | **same as shell** | Long-form pages (articles, guides, legal, glossary, FAQ) |
| **Narrow** | `--narrow-max` | **same as shell** | Kept for API compatibility |
| **Interactive** | `--interactive-max` | **same as shell** | Forms, Project Planner, Platform Selector, resource heroes |

Shell and content are the **same** value on purpose: header, footer, and page sections share one left **and** right edge. Nested narrower page columns (former 760px / 820px reading boxes) are not used.

Short headline or deck copy may still use local `max-w-2xl` / `max-w-3xl` / `max-w-[40rem]` — that is intentional line-length control, not a page frame.

---

## Gutters

Shared on all container sizes:

| Breakpoint | Gutter |
| --- | ---: |
| Mobile | **20px** (`px-5`) |
| Small tablet+ | **24px** (`sm:px-6`) |
| Desktop | **32px** (`lg:px-8`) |

---

## `Container` API

```tsx
import { Container } from "@/components/ui/container";

<Container>…</Container>                    // shell / standard
<Container size="reading">…</Container>     // same shell (API alias)
<Container size="narrow">…</Container>      // same shell (API alias)
<Container size="interactive">…</Container> // same shell (API alias)

// Deprecated alias — maps to size="reading"
<Container narrow>…</Container>
```

### Utility classes

These resolve to the shell max-width (kept so existing class names do not leave dead CSS):

- `readable-width` → `--reading-max` (= shell)
- `narrow-width` → `--narrow-max` (= shell)
- `interactive-width` → `--interactive-max` (= shell)

Prefer omitting them on new code and relying on `Container` alone.

**Alignment rule:** Content shares the shell left and right edges with the header. Do not reintroduce a page-level centered or inset measure that is narrower than the shell.

---

## Full-bleed sections

Backgrounds may be `w-full`. Inner content must still use `Container`:

```tsx
<section className="w-full bg-surface-dark">
  <Container>…</Container>
</section>
```

---

## Legitimate exceptions

| Pattern | Why |
| --- | --- |
| Hero intro copy `max-w-2xl` / `max-w-[34rem]` | Intentional headline/deck line length inside shell |
| Split heroes / case-study imagery | Editorial composition |
| Comparison / pricing matrices | Wide tables inside shell |
| Guide/blog TOC + body grids | Body `1fr` + sidebar — fills the shell |
| Template / checklist sidebars | Nav ~15rem + main `1fr` — fills the shell |
| Media breakouts (`.prose` wide images) | Intentional wider media in articles |

New pages should not add arbitrary `max-w-[1180px]`-style shells or page-level 760px reading boxes.

---

## Source of truth

- Tokens + utilities: `app/globals.css`
- Component: `components/ui/container.tsx`
