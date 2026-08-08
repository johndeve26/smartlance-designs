# AI Editorial Operations

## Workflow (new article)

1. Topic & goal  
2. Existing content / cannibalization check  
3. Research + source review  
4. Content brief (+ unique value)  
5. Outline (editable / lockable)  
6. Draft (full or section)  
7. Fact check / claim ledger  
8. SEO + AI Search review (PASS / WARNING / REVIEW / BLOCKER — no fake scores)  
9. Internal links (published routes only)  
10. Editorial quality review  
11. Approve for CMS → Create Insight draft → existing preview/publish  

## Modes

`NEW_ARTICLE` · `UPDATE_EXISTING` · `BRIEF_ONLY` · `OUTLINE_ONLY` · `IMPROVE_DRAFT`

Refresh modes preserve Insight `originalPublishedAt`. Prefer update when cannibalization is `BETTER_AS_UPDATE`.

## Statuses

`IDEA` → `RESEARCHING` → `BRIEF_READY` → `OUTLINE_READY` → `DRAFTING` → `DRAFT_READY` → `NEEDS_REVIEW` → `APPROVED_FOR_CMS` · `ARCHIVED`

## Human control

- Never auto-publish  
- Critical unsupported numerical / platform claims block approval unless override + reason (audited)  
- Linked Insight edited after snapshot → conflict warning; no silent overwrite  

## Failures

Failed runs keep the project. Retry from the UI. Safe error summaries only — no secrets/stack traces in Admin.
