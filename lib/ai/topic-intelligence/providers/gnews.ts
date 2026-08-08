import { z } from "zod";
import { createHash } from "crypto";
import { isSafeHttpUrl } from "@/lib/ai/safety";
import { OUTBOUND_TIMEOUTS, timeoutSignal } from "@/lib/ops/request-timeout";
import type { TopicSignalProvider, TopicSignalSearchOptions } from "@/lib/ai/topic-intelligence/providers/types";
import { TopicSignalProviderUnavailableError } from "@/lib/ai/topic-intelligence/providers/types";
import type { NormalizedTopicSignal } from "@/lib/ai/topic-intelligence/types";

const gnewsSchema = z.object({
  articles: z
    .array(
      z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        url: z.string().optional(),
        publishedAt: z.string().optional(),
        source: z.object({ name: z.string().optional() }).optional(),
      }),
    )
    .optional(),
});

const cache = new Map<string, { at: number; data: NormalizedTopicSignal[] }>();
const CACHE_MS = 10 * 60 * 1000;

/**
 * Optional GNews adapter. Env: GNEWS_API_KEY.
 * Used only when NewsAPI is not configured (registry enforces one dedicated news provider).
 */
export class GNewsSignalProvider implements TopicSignalProvider {
  readonly id = "gnews";
  readonly label = "GNews";
  readonly capabilities = ["NEWS"] as const;

  private apiKey() {
    return process.env.GNEWS_API_KEY?.trim() || "";
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey());
  }

  async search(options: TopicSignalSearchOptions): Promise<NormalizedTopicSignal[]> {
    if (!this.isConfigured()) return [];

    const key = createHash("sha256")
      .update(`gnews:${options.query}:${options.market || ""}:${options.maxResults || 8}`)
      .digest("hex")
      .slice(0, 32);
    if (!options.forceRefresh) {
      const hit = cache.get(key);
      if (hit && Date.now() - hit.at < CACHE_MS) return hit.data;
    }

    const params = new URLSearchParams({
      q: options.query.slice(0, 200),
      lang: "en",
      max: String(Math.min(options.maxResults ?? 8, 20)),
      apikey: this.apiKey(),
    });
    const res = await fetch(`https://gnews.io/api/v4/search?${params}`, {
      signal: timeoutSignal(OUTBOUND_TIMEOUTS.research, options.signal),
    });
    if (res.status === 429) {
      throw new TopicSignalProviderUnavailableError(this.id, "GNews rate limited (429).");
    }
    if (!res.ok) {
      throw new TopicSignalProviderUnavailableError(this.id, `GNews HTTP ${res.status}`);
    }
    const json = gnewsSchema.parse(await res.json());
    const data: NormalizedTopicSignal[] = (json.articles || [])
      .map((a) => {
        const url = a.url || "";
        if (!url || !isSafeHttpUrl(url)) return null;
        let domain: string | undefined;
        try {
          domain = new URL(url).hostname;
        } catch {
          domain = undefined;
        }
        let publishedAt: Date | null = null;
        if (a.publishedAt) {
          const d = new Date(a.publishedAt);
          if (!Number.isNaN(d.getTime())) publishedAt = d;
        }
        return {
          provider: this.id,
          type: "NEWS" as const,
          title: (a.title || url).slice(0, 300),
          summary: (a.description || "").slice(0, 500) || undefined,
          sourceUrl: url,
          sourceDomain: domain,
          publishedAt,
          market: options.market,
          language: "en",
          sourceAuthorityType: "NEWS" as const,
          freshness: "TIMELY" as const,
          provenance: {
            capability: "NEWS" as const,
            label: `GNews / ${a.source?.name || domain || "news"}`,
          },
        } satisfies NormalizedTopicSignal;
      })
      .filter(Boolean) as NormalizedTopicSignal[];

    cache.set(key, { at: Date.now(), data });
    return data;
  }
}
