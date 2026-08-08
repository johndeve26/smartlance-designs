import { prisma, hasDatabaseUrl } from "@/lib/db";
import type { TopicSignalCapability } from "@/lib/ai/topic-intelligence/types";
import type { TopicSignalProvider } from "@/lib/ai/topic-intelligence/providers/types";
import { TavilySignalProvider } from "@/lib/ai/topic-intelligence/providers/tavily";
import { RssSignalProvider } from "@/lib/ai/topic-intelligence/providers/rss";
import { ManualSignalProvider } from "@/lib/ai/topic-intelligence/providers/manual";
import { NewsApiSignalProvider } from "@/lib/ai/topic-intelligence/providers/newsapi";
import { GNewsSignalProvider } from "@/lib/ai/topic-intelligence/providers/gnews";
import { GoogleTrendsSignalProvider } from "@/lib/ai/topic-intelligence/providers/google-trends";
import { FirstPartySearchSignalProvider } from "@/lib/ai/topic-intelligence/providers/first-party-search";

const tavily = new TavilySignalProvider();
const rss = new RssSignalProvider();
const manual = new ManualSignalProvider();
const newsApi = new NewsApiSignalProvider();
const gnews = new GNewsSignalProvider();
const trends = new GoogleTrendsSignalProvider();
const searchConsole = new FirstPartySearchSignalProvider();

/** All registered providers (order is not priority). */
export function listTopicSignalProviders(): TopicSignalProvider[] {
  return [tavily, rss, manual, newsApi, gnews, trends, searchConsole];
}

/**
 * One dedicated news provider max: NewsAPI preferred over GNews.
 * Tavily may still contribute news-capable web results separately.
 */
export function getActiveNewsProvider(): TopicSignalProvider | null {
  if (newsApi.isConfigured()) return newsApi;
  if (gnews.isConfigured()) return gnews;
  return null;
}

export function getProvidersForCapability(
  capability: TopicSignalCapability,
  opts?: { includeUnconfigured?: boolean },
): TopicSignalProvider[] {
  if (capability === "NEWS") {
    const active = getActiveNewsProvider();
    // Tavily can also contribute NEWS capability when configured
    const out: TopicSignalProvider[] = [];
    if (active) out.push(active);
    else if (opts?.includeUnconfigured) {
      out.push(newsApi, gnews);
    }
    if (tavily.isConfigured() || opts?.includeUnconfigured) {
      if (!out.some((p) => p.id === tavily.id)) out.push(tavily);
    }
    return out.filter((p) => opts?.includeUnconfigured || p.isConfigured());
  }

  return listTopicSignalProviders().filter(
    (p) =>
      p.capabilities.includes(capability) &&
      (opts?.includeUnconfigured || p.isConfigured()),
  );
}

export type DiscoveryProviderStatus = {
  webSearch: { configured: boolean; providerId: string; label: string };
  news: { configured: boolean; providerId: string | null; label: string };
  trends: { configured: boolean; providerId: string; label: string };
  rss: { configured: boolean; providerId: string; label: string };
  firstPartySearch: { configured: boolean; providerId: string; label: string };
  industryPacksActive: number;
};

export async function getDiscoveryProviderStatus(): Promise<DiscoveryProviderStatus> {
  const news = getActiveNewsProvider();
  let industryPacksActive = 0;
  if (hasDatabaseUrl()) {
    try {
      industryPacksActive = await prisma.topicSourcePack.count({
        where: { enabled: true },
      });
    } catch {
      industryPacksActive = 0;
    }
  }

  return {
    webSearch: {
      configured: tavily.isConfigured(),
      providerId: tavily.id,
      label: tavily.isConfigured() ? "Tavily" : "Not configured",
    },
    news: {
      configured: Boolean(news),
      providerId: news?.id ?? null,
      label: news
        ? news.label
        : tavily.isConfigured()
          ? "Dedicated news provider not configured (Tavily may contribute)"
          : "Not configured",
    },
    trends: {
      configured: trends.isConfigured(),
      providerId: trends.id,
      label: trends.isConfigured() ? "Google Trends" : "Trend data unavailable",
    },
    rss: {
      configured: true,
      providerId: rss.id,
      label: "Enabled",
    },
    firstPartySearch: {
      configured: searchConsole.isConfigured(),
      providerId: searchConsole.id,
      label: searchConsole.isConfigured() ? "Connected" : "Not connected",
    },
    industryPacksActive,
  };
}

export {
  tavily as tavilySignalProvider,
  rss as rssSignalProvider,
  manual as manualSignalProvider,
  newsApi as newsApiSignalProvider,
  gnews as gNewsSignalProvider,
  trends as googleTrendsSignalProvider,
  searchConsole as firstPartySearchSignalProvider,
};
