import type { NormalizedTopicSignal } from "@/lib/ai/topic-intelligence/types";
import { fingerprintSignal, clusterKeyForSignal } from "@/lib/ai/topic-intelligence/types";

export type SignalCluster = {
  clusterKey: string;
  anchor: NormalizedTopicSignal;
  supporting: NormalizedTopicSignal[];
  fingerprints: string[];
};

const AUTHORITY_RANK: Record<string, number> = {
  OFFICIAL: 0,
  PRIMARY: 1,
  RESEARCH: 2,
  INDUSTRY: 3,
  NEWS: 4,
  COMMUNITY: 5,
  COMPETITOR: 6,
};

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(the|a|an|of|for|to|and|in|on|with)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

/**
 * Deduplicate identical stories and group into development clusters.
 * Prefer OFFICIAL/PRIMARY as cluster anchor.
 */
export function clusterSignals(signals: NormalizedTopicSignal[]): SignalCluster[] {
  const byFingerprint = new Map<string, NormalizedTopicSignal>();
  for (const s of signals) {
    const fp = fingerprintSignal({
      title: s.title,
      sourceUrl: s.sourceUrl,
      publishedAt: s.publishedAt,
      provider: s.provider,
    });
    const existing = byFingerprint.get(fp);
    if (!existing) {
      byFingerprint.set(fp, s);
      continue;
    }
    // Prefer higher authority when same fingerprint
    const er = AUTHORITY_RANK[existing.sourceAuthorityType] ?? 9;
    const nr = AUTHORITY_RANK[s.sourceAuthorityType] ?? 9;
    if (nr < er) byFingerprint.set(fp, s);
  }

  const unique = [...byFingerprint.values()];
  const groups = new Map<string, NormalizedTopicSignal[]>();

  for (const s of unique) {
    const titleKey = normalizeTitle(s.title);
    // Prefer URL host+path similarity for news, else title+type
    let key = clusterKeyForSignal(s);
    if (titleKey.length > 20) {
      key = `story:${titleKey.slice(0, 60)}`;
    }
    const list = groups.get(key) || [];
    list.push(s);
    groups.set(key, list);
  }

  const clusters: SignalCluster[] = [];
  for (const [clusterKey, members] of groups) {
    const sorted = [...members].sort((a, b) => {
      const ar = AUTHORITY_RANK[a.sourceAuthorityType] ?? 9;
      const br = AUTHORITY_RANK[b.sourceAuthorityType] ?? 9;
      return ar - br;
    });
    const anchor = sorted[0]!;
    clusters.push({
      clusterKey,
      anchor,
      supporting: sorted.slice(1),
      fingerprints: sorted.map((m) =>
        fingerprintSignal({
          title: m.title,
          sourceUrl: m.sourceUrl,
          publishedAt: m.publishedAt,
          provider: m.provider,
        }),
      ),
    });
  }

  return clusters;
}

/** Simple noise filter for clearly irrelevant headlines. */
export function isNewsNoise(title: string, summary?: string): boolean {
  const hay = `${title} ${summary || ""}`.toLowerCase();
  const noise = [
    "celebrity",
    "box office",
    "stock price",
    "shares surge",
    "shares fall",
    "stocks surge",
    "tech stocks",
    "crypto crash",
    "football transfer",
    "reality tv",
    "gossip",
  ];
  return noise.some((n) => hay.includes(n));
}
