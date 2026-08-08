# Topic Signal Providers

## Registry

`lib/ai/topic-intelligence/providers/index.ts`

Ask for a **capability**, not a vendor:

| Capability | Providers |
|---|---|
| WEB_SEARCH | Tavily |
| NEWS | NewsAPI (preferred) or GNews |
| RSS | Generic RSS/Atom |
| TRENDS | Google Trends (stub until official API) |
| FIRST_PARTY_SEARCH | Search Console (stub) |
| MANUAL | User seeds |

## Secrets (environment only)

| Env | Provider |
|---|---|
| `TAVILY_API_KEY` / `AI_RESEARCH_API_KEY` | Tavily (shared with article research) |
| `NEWS_API_KEY` | NewsAPI |
| `GNEWS_API_KEY` | GNews (used only if NewsAPI unset) |
| `GOOGLE_TRENDS_API_KEY` | Reserved; adapter not live |
| `GOOGLE_SEARCH_CONSOLE_CONNECTED` | Future first-party flag |

Never display secret values in Admin. Status shows Configured / Not configured.

## Data stored

For each signal: title, summary, URL, domain, published/discovered timestamps, authority, provenance.  
**Not stored:** full copyrighted article bodies.

## Fallback behavior

- Provider outage reduces signals; discovery continues with remaining sources
- Provenance is never silently rewritten (e.g. Tavily results are not labeled Trends)
- HTTP 429: fail that provider cleanly — no endless retry
- Trends unavailable → UI shows “Trend data unavailable”; search volume “Not available”

## Caching

Short in-memory cache by provider + query + market (~10–15 minutes). Force refresh available in Admin.
