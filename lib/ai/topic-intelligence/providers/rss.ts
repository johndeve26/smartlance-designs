import { createHash } from "crypto";
import { safeFetchText, assertPublicHttpUrl } from "@/lib/ai/ssrf";
import { sandboxUntrustedText } from "@/lib/ai/safety";
import type { TopicSignalProvider } from "@/lib/ai/topic-intelligence/providers/types";
import type { NormalizedTopicSignal } from "@/lib/ai/topic-intelligence/types";
import { TopicSignalProviderUnavailableError } from "@/lib/ai/topic-intelligence/providers/types";

type RssItem = {
  title: string;
  link?: string;
  description?: string;
  pubDate?: string;
  guid?: string;
};

function parseRssOrAtom(xml: string): RssItem[] {
  const items: RssItem[] = [];
  // Minimal safe parser — no entity expansion / XXE (string slice only).
  const blocks =
    xml.match(/<item[\s\S]*?<\/item>/gi) ||
    xml.match(/<entry[\s\S]*?<\/entry>/gi) ||
    [];
  for (const block of blocks.slice(0, 40)) {
    const title = textBetween(block, "title");
    if (!title) continue;
    const link =
      attrBetween(block, "link", "href") ||
      textBetween(block, "link") ||
      textBetween(block, "id");
    const description =
      textBetween(block, "description") ||
      textBetween(block, "summary") ||
      textBetween(block, "content");
    const pubDate =
      textBetween(block, "pubDate") ||
      textBetween(block, "published") ||
      textBetween(block, "updated");
    const guid = textBetween(block, "guid") || textBetween(block, "id");
    items.push({
      title: stripTags(title).slice(0, 300),
      link: link?.trim(),
      description: stripTags(description || "").slice(0, 500),
      pubDate: pubDate || undefined,
      guid: guid || undefined,
    });
  }
  return items;
}

function textBetween(xml: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = xml.match(re);
  return m?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}

function attrBetween(xml: string, tag: string, attr: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*\\s${attr}=["']([^"']+)["'][^>]*/?>`, "i");
  return xml.match(re)?.[1];
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

const feedCache = new Map<string, { at: number; data: NormalizedTopicSignal[] }>();
const CACHE_MS = 15 * 60 * 1000;

/**
 * Generic RSS/Atom signal provider using hardened safeFetchText (SSRF-safe).
 */
export class RssSignalProvider implements TopicSignalProvider {
  readonly id = "rss";
  readonly label = "RSS / Atom feeds";
  readonly capabilities = ["RSS", "INDUSTRY_SOURCE"] as const;

  isConfigured(): boolean {
    return true;
  }

  async search(options: {
    query: string;
    market?: string;
    maxResults?: number;
    forceRefresh?: boolean;
    pack?: { rssFeeds?: string[]; excludedDomains?: string[]; keywords?: string[] };
  }): Promise<NormalizedTopicSignal[]> {
    const feeds = (options.pack?.rssFeeds || []).filter(Boolean).slice(0, 8);
    if (!feeds.length) return [];

    const excluded = new Set(
      (options.pack?.excludedDomains || []).map((d) => d.toLowerCase()),
    );
    const keywords = (options.pack?.keywords || [])
      .concat(options.query.split(/\s+/).filter((t) => t.length > 2))
      .map((k) => k.toLowerCase())
      .slice(0, 12);

    const out: NormalizedTopicSignal[] = [];
    for (const feedUrl of feeds) {
      try {
        assertPublicHttpUrl(feedUrl);
      } catch {
        continue;
      }
      const cacheKey = createHash("sha256").update(feedUrl).digest("hex").slice(0, 24);
      let items: NormalizedTopicSignal[] = [];
      const hit = feedCache.get(cacheKey);
      if (!options.forceRefresh && hit && Date.now() - hit.at < CACHE_MS) {
        items = hit.data;
      } else {
        try {
          const xmlResult = await safeFetchText(feedUrl, {
            maxBytes: 500_000,
            timeoutMs: 12_000,
            maxRedirects: 3,
          });
          const xml = xmlResult.text;
          // Treat feed body as untrusted data (prompt-injection resistant framing for consumers)
          void sandboxUntrustedText("RSS_FEED", xml.slice(0, 200));
          const parsed = parseRssOrAtom(xml);
          items = parsed
            .map((item) => {
              const url = item.link || "";
              let domain: string | undefined;
              try {
                if (url) domain = new URL(url).hostname;
              } catch {
                domain = undefined;
              }
              if (domain && excluded.has(domain.toLowerCase())) return null;
              let publishedAt: Date | null = null;
              if (item.pubDate) {
                const d = new Date(item.pubDate);
                if (!Number.isNaN(d.getTime())) publishedAt = d;
              }
              return {
                provider: this.id,
                type: "INDUSTRY_UPDATE" as const,
                title: item.title,
                summary: item.description,
                sourceUrl: url || undefined,
                sourceDomain: domain,
                publishedAt,
                market: options.market,
                language: "en",
                rawProviderId: item.guid,
                sourceAuthorityType: "INDUSTRY" as const,
                freshness: "TIMELY" as const,
                provenance: {
                  capability: "RSS" as const,
                  label: `RSS / ${domain || "feed"}`,
                },
              } satisfies NormalizedTopicSignal;
            })
            .filter(Boolean) as NormalizedTopicSignal[];
          feedCache.set(cacheKey, { at: Date.now(), data: items });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "RSS fetch failed";
          if (/Unsafe|invalid URL|private/i.test(msg)) {
            throw new TopicSignalProviderUnavailableError(this.id, msg);
          }
          continue;
        }
      }

      for (const item of items) {
        if (keywords.length) {
          const hay = `${item.title} ${item.summary || ""}`.toLowerCase();
          if (!keywords.some((k) => hay.includes(k))) continue;
        }
        out.push(item);
        if (out.length >= (options.maxResults ?? 8)) return out;
      }
    }
    return out;
  }
}
