# Public Site Architecture (V1.3)

## Purpose

The public Smartlance website exposes the full prospect conversion ecosystem without duplicating authenticated product surfaces (Admin, Client Portal, Prospect Workspace).

**Visitor journey:** Discover → Understand → Trust → Try → Plan → Request → Client

## Core positioning

- **Tagline:** Websites Built to Rank, Convert and Grow
- **Role:** Web growth partner (not generic freelancer, not SaaS platform, not AI company)

## Information architecture

| Area | Role | Hub route |
|------|------|-----------|
| Services | Web design, development, SEO, conversion | `/services` |
| AI & Automation | Practical AI, workflows, integrations | `/ai-automation` |
| Solutions | Problems Smartlance fixes | `/solutions` |
| Work | Evidence / case studies | `/work` |
| How We Work | Structured client journey | `/how-we-work` |
| Resources | Learn | `/resources`, guides, insights, etc. |
| Free Tools | Do something useful | `/free-tools` |
| About | Who / philosophy | `/about` |
| Contact | General + project enquiry | `/contact` |

See also: `docs/PUBLIC_AI_AUTOMATION_ARCHITECTURE.md`, `docs/PUBLIC_CONVERSION_PATHS.md`, `docs/NAVIGATION_ARCHITECTURE.md`.

## Homepage section order (V1.3)

1. Hero — project CTA + free review
2. Capability strip — Web / Growth / AI / Automation
3. Trust strip (CMS-controlled visibility)
4. Problem / outcomes → Explore Solutions
5. **Free Tools** (featured Review + Brief + Planner)
6. Selected Work
7. Core Capabilities (Web / Growth / AI / Automation pillars)
8. **AI & Automation** editorial section → `/ai-automation`
9. How Smartlance Works (5 steps) → `/how-we-work`
10. Why Smartlance
11. Industries teaser
12. Client Portal preview
13. Platforms / growth system (CMS-controlled)
14. Resources / insights
15. Final CTA
13. Final CTA

## New routes (V1.3)

- `/how-we-work` — full client journey (before project, delivery, after launch, portal)
- `/free-tools` — canonical hub for Free Website Review, Website Brief Builder, Project Planner

## CTA vocabulary

Centralized in [`lib/public/cta-map.ts`](../lib/public/cta-map.ts):

| Intent | Label | Destination |
|--------|-------|-------------|
| High intent | Tell Us About Your Project | `/contact` |
| Existing site | Get a Free Website Review | `/free-website-review` |
| Planning | Build Your Website Brief | `/website-brief` |
| Unsure scope | Plan Your Project | `/project-planner` |
| Evidence | See Our Work | `/work` |
| Process | See How We Work | `/how-we-work` |

## Data sources

- Homepage: `homepageRepository` + typed fallbacks in `data/home.ts`
- Work, services, solutions, industries, platforms: existing CMS/content services — no raw Prisma on public pages
- Process copy: `lib/public/how-we-work-content.ts`

## SEO

- Sitemap includes `/how-we-work`, `/free-tools`, `/website-brief` via [`lib/seo/sitemap-entries.ts`](../lib/seo/sitemap-entries.ts)
- Workspace, Portal, Admin remain noindex / private

## Scope boundaries (V1.3)

No Prisma schema changes, no Admin/Portal/Workspace UI changes, no CRM or billing logic changes.
