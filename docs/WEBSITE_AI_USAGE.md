# Website AI Usage

Smartlance has **two different AI contexts** — do not confuse them.

## 1. Visitor-triggered AI (public runtime)

Runs when someone uses a tool on the marketing site or workspace. **All use `FAST_MODEL`** → **Admin → AI → Settings → Model routing → Website & prospect tools**.

| Feature | Route | What AI does |
|---------|-------|----------------|
| Free Website Review | `/free-website-review` | Summary, priorities, strengths, findings after automated crawl/checks |
| Website Brief — field help | `/website-brief` | "Improve with AI" on individual brief fields |

**Not AI on the public site:**

| Feature | Route | Notes |
|---------|-------|--------|
| Project Planner | `/project-planner` | Rule-based wizard only |
| Contact / human review form | `/contact`, `#human-review` | Form → enquiry, no AI |
| Browsing CMS pages | `/services`, `/work`, `/blog`, etc. | Pre-authored content; no live AI |

### Brief builder — implemented but not wired

These exist in `lib/prospect/ai/brief-assistant.ts` but have **no public API route yet**:

- Brief summary generation  
- Suggest answers from linked review  
- Section explanations  
- Missing-field prompts  

When exposed, they will also use **FAST_MODEL** (same routing row).

## 2. Admin content AI (edit time only)

Runs in **Admin** while staff edit content. Visitors never trigger this when browsing.

| Routing row | Typical use |
|-------------|-------------|
| **Writing** | Services, solutions, work, industries, platforms, resources, editorial studio drafts |
| **Editor** | SEO passes, editorial review, some content assistant actions |
| **Research** | Editorial research synthesis |
| **Website & prospect tools** | *Not used here* |

Homepage Copy Assistant applies to **draft only** — see `docs/HOMEPAGE_DRAFT_AND_AI.md`.

## Configuration

- **One provider connection** (e.g. Agent Router) can serve all rows.  
- Each row can override provider + model independently.  
- **Test website review AI** on Settings verifies structured JSON (required for reviews). Provider "Test connection" only checks plain text.

See also: `docs/FREE_WEBSITE_REVIEW_AI.md`, `docs/WEBSITE_BRIEF_AI_ASSISTANT.md`.
