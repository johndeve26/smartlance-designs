# Link Health

Admin: `/admin/link-health`

## What is checked

On-demand `Run link check` (`runLinkHealthCheck`):

- Published navigation / footer hrefs → broken, redirecting, unpublished destination
- Industry → Work relations when destination unpublished
- Orphan warnings for important routes (Pricing, Project Planner, Free Review, Contact, Work, Resources) missing from nav/footer
- Featured work without nav link (info)

Results stored on `LinkHealthRun` / `LinkHealthIssue`. Latest run shown in Admin; not executed on every page load.

## What is not checked

- External internet crawling
- Full rich-content DOM crawl on every request (insights body may be extended later)

## Fix actions

Issues include text hints (open navigation, update destination). No automatic content rewrites.
