import type {
  ResearchProvider,
  ResearchResult,
  ResearchSearchOptions,
} from "@/lib/ai/research/types";
import { ResearchProviderNotConfiguredError } from "@/lib/ai/research/types";
import { isSafeHttpUrl } from "@/lib/ai/safety";
import { OUTBOUND_TIMEOUTS, timeoutSignal } from "@/lib/ops/request-timeout";

/**
 * Tavily Search API (optional). When unset, research still works via Admin-supplied URLs.
 */
export class TavilyResearchProvider implements ResearchProvider {
  readonly id = "tavily";

  private apiKey() {
    return process.env.TAVILY_API_KEY?.trim() || process.env.AI_RESEARCH_API_KEY?.trim() || "";
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey());
  }

  async search(options: ResearchSearchOptions): Promise<ResearchResult[]> {
    if (!this.isConfigured()) {
      throw new ResearchProviderNotConfiguredError(this.id);
    }
    const max = Math.min(options.maxResults ?? 8, 12);
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: this.apiKey(),
        query: options.query,
        search_depth: "basic",
        max_results: max,
        include_answer: false,
      }),
      signal: timeoutSignal(OUTBOUND_TIMEOUTS.research, options.signal),
    });
    if (!res.ok) {
      throw new Error(`Research provider HTTP ${res.status}`);
    }
    const json = (await res.json()) as {
      results?: Array<{ url?: string; title?: string; content?: string }>;
    };
    return (json.results ?? [])
      .map((r) => ({
        url: r.url || "",
        title: r.title,
        snippet: r.content?.slice(0, 500),
        sourceTypeHint: classifySource(r.url || ""),
      }))
      .filter((r) => isSafeHttpUrl(r.url));
  }
}

export class ManualOnlyResearchProvider implements ResearchProvider {
  readonly id = "manual";
  isConfigured(): boolean {
    return true;
  }
  async search(): Promise<ResearchResult[]> {
    return [];
  }
}

export function classifySource(
  url: string,
): ResearchResult["sourceTypeHint"] {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (
      host.includes("developers.google.com") ||
      host.includes("search.google") ||
      host.endsWith(".gov") ||
      host.includes("w3.org") ||
      host.includes("ietf.org")
    ) {
      return "OFFICIAL";
    }
    if (host.includes("docs.") || host.includes("developer.")) {
      return "PRIMARY";
    }
    return "INDUSTRY";
  } catch {
    return "INDUSTRY";
  }
}

let cached: ResearchProvider | null = null;

export function createResearchProvider(): ResearchProvider {
  if (cached) return cached;
  const tavily = new TavilyResearchProvider();
  cached = tavily.isConfigured() ? tavily : new ManualOnlyResearchProvider();
  return cached;
}

export function getResearchProviderStatus() {
  const p = createResearchProvider();
  const configured = p.id !== "manual" && p.isConfigured();
  return {
    configured,
    providerId: p.id,
    label: configured ? ("Configured" as const) : ("Not Configured" as const),
  };
}

export function setResearchProviderForTests(provider: ResearchProvider | null) {
  cached = provider;
}
