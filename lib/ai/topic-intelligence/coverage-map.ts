/**
 * Commercial authority map + content balance for Topic Intelligence.
 * Uses metadata relationships only — does not invent coverage.
 */

import type { ContentIndexRecord, CoverageRow } from "@/lib/ai/topic-intelligence/types";
import { resourceTopics } from "@/data/resources";

const RECENT_MS = 180 * 24 * 60 * 60 * 1000; // ~6 months

function isRecent(iso?: string | null): boolean {
  if (!iso) return false;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return false;
  return Date.now() - t < RECENT_MS;
}

function related(queryTokens: string[], record: ContentIndexRecord): boolean {
  const hay = `${record.title} ${record.summary} ${record.topics.join(" ")}`.toLowerCase();
  let hits = 0;
  for (const t of queryTokens) {
    if (hay.includes(t)) hits += 1;
  }
  return hits >= Math.min(2, queryTokens.length) || (queryTokens.length === 1 && hits >= 1);
}

function gapLevel(insightCount: number, resourceCount: number, recent: number): CoverageRow["gapLevel"] {
  const depth = insightCount + resourceCount * 0.75 + recent * 0.5;
  if (depth >= 5) return "strong";
  if (depth >= 2.5) return "moderate";
  if (depth >= 1) return "weak";
  return "none";
}

export function buildCommercialCoverageMap(index: ContentIndexRecord[]): CoverageRow[] {
  const commercials = index.filter((r) =>
    ["Service", "Solution", "Platform", "Industry"].includes(r.type),
  );
  const insights = index.filter((r) => r.type === "Insight");
  const resources = index.filter((r) =>
    ["Guide", "Comparison", "Checklist", "Glossary", "Template", "Tool", "CmsResource"].includes(
      r.type,
    ),
  );
  const work = index.filter((r) => r.type === "Work");

  return commercials.map((c) => {
    const tokens = `${c.title} ${c.slug}`
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 2)
      .slice(0, 8);
    const relatedInsights = insights.filter((i) => related(tokens, i));
    const relatedResources = resources.filter((r) => related(tokens, r));
    const relatedWork = work.filter((w) => related(tokens, w));
    const recentInsightCount = relatedInsights.filter(
      (i) => isRecent(i.updatedAt) || isRecent(i.publishedAt),
    ).length;

    return {
      entityType: c.type as CoverageRow["entityType"],
      id: c.id,
      title: c.title,
      path: c.path,
      slugOrHref: c.slug,
      insightCount: relatedInsights.length,
      resourceCount: relatedResources.length,
      workCount: relatedWork.length,
      recentInsightCount,
      gapLevel: gapLevel(relatedInsights.length, relatedResources.length, recentInsightCount),
      relatedTopics: tokens.slice(0, 5),
    };
  });
}

export type ContentBalanceRow = {
  topicId: string;
  label: string;
  insightCount: number;
  resourceCount: number;
  note?: string;
};

/**
 * Distribution across configured resource topics — observation only, not quotas.
 */
export function buildContentBalance(index: ContentIndexRecord[]): ContentBalanceRow[] {
  const insights = index.filter((r) => r.type === "Insight");
  const resources = index.filter((r) => r.type !== "Insight" && r.type !== "Service" && r.type !== "Solution" && r.type !== "Platform" && r.type !== "Industry" && r.type !== "Work");

  return resourceTopics.map((topic) => {
    const label = topic.label.toLowerCase();
    const tokens = label.split(/[^a-z0-9]+/).filter((t) => t.length > 2);
    const match = (r: ContentIndexRecord) => {
      const hay = `${r.title} ${r.summary} ${r.topics.join(" ")}`.toLowerCase();
      if (topic.blogCategory && r.topics.some((t) => t.toLowerCase() === topic.blogCategory!.toLowerCase())) {
        return true;
      }
      return tokens.some((t) => hay.includes(t));
    };
    const insightCount = insights.filter(match).length;
    const resourceCount = resources.filter(match).length;
    return {
      topicId: topic.id,
      label: topic.label,
      insightCount,
      resourceCount,
    };
  });
}

export function detectCoverageImbalance(balance: ContentBalanceRow[]): string | null {
  if (balance.length < 2) return null;
  const sorted = [...balance].sort((a, b) => b.insightCount - a.insightCount);
  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];
  if (!top || !bottom) return null;
  if (top.insightCount >= 8 && bottom.insightCount <= 1 && top.insightCount >= bottom.insightCount * 4) {
    const bottomCount =
      bottom.insightCount === 0 ? "none" : String(bottom.insightCount);
    return `${top.label} has ${top.insightCount} Insights, while ${bottom.label} currently has ${bottomCount}.`;
  }
  return null;
}
