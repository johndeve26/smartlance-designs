import { createHash } from "crypto";
import { classifySource, createResearchProvider } from "@/lib/ai/research";
import { isSafeHttpUrl } from "@/lib/ai/safety";
import type { TopicSignalProvider } from "@/lib/ai/topic-intelligence/providers/types";
import type { NormalizedTopicSignal } from "@/lib/ai/topic-intelligence/types";

const cache = new Map<string, { at: number; data: NormalizedTopicSignal[] }>();
const CACHE_MS = 10 * 60 * 1000;

function cacheKey(query: string, market?: string, max?: number) {
  return createHash("sha256")
    .update(`tavily:${query}:${market || ""}:${max || 8}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * Reuses the existing Tavily research client — does not duplicate API config.
 */
export class TavilySignalProvider implements TopicSignalProvider {
  readonly id = "tavily";
  readonly label = "Tavily web research";
  readonly capabilities = ["WEB_SEARCH", "NEWS"] as const;

  isConfigured(): boolean {
    return createResearchProvider().id === "tavily" && createResearchProvider().isConfigured();
  }

  async search(options: {
    query: string;
    market?: string;
    maxResults?: number;
    signal?: AbortSignal;
    forceRefresh?: boolean;
  }): Promise<NormalizedTopicSignal[]> {
    if (!this.isConfigured()) return [];

    const key = cacheKey(options.query, options.market, options.maxResults);
    if (!options.forceRefresh) {
      const hit = cache.get(key);
      if (hit && Date.now() - hit.at < CACHE_MS) return hit.data;
    }

    const research = createResearchProvider();
    let results;
    try {
      results = await research.search({
        query: options.query,
        maxResults: Math.min(options.maxResults ?? 8, 12),
        signal: options.signal,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Tavily unavailable";
      throw new Error(msg);
    }

    const data: NormalizedTopicSignal[] = results
      .filter((r) => isSafeHttpUrl(r.url))
      .map((r) => {
        let domain: string | undefined;
        try {
          domain = new URL(r.url).hostname;
        } catch {
          domain = undefined;
        }
        const hint = r.sourceTypeHint || classifySource(r.url);
        const authority =
          hint === "OFFICIAL" || hint === "PRIMARY"
            ? hint
            : hint === "COMPETITOR"
              ? "COMPETITOR"
              : "INDUSTRY";
        const looksNews = /news|announce|update|release|changelog/i.test(
          `${r.title || ""} ${r.snippet || ""}`,
        );
        return {
          provider: this.id,
          type: looksNews ? ("NEWS" as const) : ("RESEARCH" as const),
          title: r.title || r.url,
          summary: r.snippet?.slice(0, 500),
          sourceUrl: r.url,
          sourceDomain: domain,
          publishedAt: null,
          market: options.market,
          language: "en",
          sourceAuthorityType: authority,
          freshness: looksNews ? ("TIMELY" as const) : ("HYBRID" as const),
          provenance: {
            capability: "WEB_SEARCH" as const,
            label: "Tavily / Web",
          },
        };
      });

    cache.set(key, { at: Date.now(), data });
    return data;
  }
}
