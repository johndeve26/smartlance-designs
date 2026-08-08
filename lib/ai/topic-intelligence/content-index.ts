/**
 * Canonical content index for Topic Intelligence.
 * Metadata only — never loads full Insight bodies.
 * NEVER imports Enquiry / EnquiryNote / Admin PII.
 */

import { prisma, hasDatabaseUrl } from "@/lib/db";
import { getPublishedGuides } from "@/data/guides";
import { getPublishedComparisons } from "@/data/comparisons";
import { getPublishedChecklists } from "@/data/checklists";
import { getPublishedGlossaryEntries } from "@/data/glossary";
import { getPublishedTemplates } from "@/data/templates";
import { getPublishedTools } from "@/data/tools";
import type { ContentIndexRecord } from "@/lib/ai/topic-intelligence/types";
import { AI_FORBIDDEN_CONTEXT_SOURCES } from "@/lib/ai/safety";

/** Compile-time guard: this module must never reference forbidden sources. */
void AI_FORBIDDEN_CONTEXT_SOURCES;

function tokensFrom(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2)
    .slice(0, 12);
}

/** Common words that inflate weak overlaps across unrelated Insights. */
const OVERLAP_STOP = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "your",
  "web",
  "website",
  "websites",
  "business",
  "businesses",
  "owners",
  "guide",
  "how",
  "why",
  "what",
  "when",
  "page",
  "pages",
  "online",
  "digital",
  "content",
  "article",
]);

function scoreOverlap(record: ContentIndexRecord, query: string): number {
  const q = query.toLowerCase().trim();
  const tokens = tokensFrom(query).filter((t) => !OVERLAP_STOP.has(t));
  const titleHay = record.title.toLowerCase();
  const hay = `${record.title} ${record.summary} ${record.path} ${record.topics.join(" ")}`.toLowerCase();
  let score = 0;
  if (q.length > 12 && hay.includes(q)) score += 12;
  if (q.length > 8 && titleHay.includes(q)) score += 8;
  for (const t of tokens) {
    if (titleHay.includes(t)) score += 4;
    else if (hay.includes(t)) score += 1;
  }
  // Distinctive multi-token title hit
  const titleTokens = tokensFrom(record.title).filter((t) => !OVERLAP_STOP.has(t));
  const shared = titleTokens.filter((t) => tokens.includes(t));
  if (shared.length >= 2) score += 4;
  if (shared.length >= 3) score += 4;
  return score;
}

/** True cannibalization: high score plus shared distinctive title tokens from the seed. */
export function isStrongContentCannibalization(
  record: ContentIndexRecord & { overlapScore: number },
  seedText: string,
  signalTitle: string,
): boolean {
  if (record.overlapScore >= 18) return true;
  const seedTokens = tokensFrom(seedText).filter((t) => !OVERLAP_STOP.has(t));
  const signalTokens = tokensFrom(signalTitle).filter((t) => !OVERLAP_STOP.has(t));
  const titleTokens = tokensFrom(record.title).filter((t) => !OVERLAP_STOP.has(t));
  // Prefer seed-title overlap so supporting signal wording cannot invent false duplicates
  const sharedFromSeed = titleTokens.filter((t) => seedTokens.includes(t));
  if (record.overlapScore >= 8 && sharedFromSeed.length >= 2) return true;
  if (record.overlapScore >= 12 && sharedFromSeed.length >= 1) return true;
  // Near-identical seed and existing title
  const seedJoined = seedTokens.slice(0, 6).join(" ");
  if (seedJoined.length > 10 && record.title.toLowerCase().includes(seedJoined)) return true;
  // Fallback: seed empty-ish — use signal title carefully
  if (seedTokens.length < 2) {
    const sharedFromSignal = titleTokens.filter((t) => signalTokens.includes(t));
    if (record.overlapScore >= 10 && sharedFromSignal.length >= 2) return true;
  }
  return false;
}

export async function buildContentIndex(): Promise<ContentIndexRecord[]> {
  const records: ContentIndexRecord[] = [];

  if (hasDatabaseUrl()) {
    const [insights, services, solutions, platforms, industries, work, resources] =
      await Promise.all([
        prisma.insight.findMany({
          where: { status: "PUBLISHED" },
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            publishedAt: true,
            updatedAt: true,
            categoryLabel: true,
          },
        }),
        prisma.service.findMany({
          where: { status: "PUBLISHED" },
          select: { id: true, href: true, title: true, summary: true, updatedAt: true },
        }),
        prisma.solution.findMany({
          where: { status: "PUBLISHED" },
          select: {
            id: true,
            slug: true,
            title: true,
            shortDescription: true,
            updatedAt: true,
          },
        }),
        prisma.platform.findMany({
          where: { status: "PUBLISHED" },
          select: {
            id: true,
            slug: true,
            title: true,
            summary: true,
            href: true,
            updatedAt: true,
          },
        }),
        prisma.industry.findMany({
          where: { status: "PUBLISHED" },
          select: {
            id: true,
            slug: true,
            name: true,
            description: true,
            updatedAt: true,
          },
        }),
        prisma.workProject.findMany({
          where: { status: "PUBLISHED" },
          select: {
            id: true,
            slug: true,
            name: true,
            title: true,
            shortDescription: true,
            updatedAt: true,
          },
        }),
        prisma.cmsResource.findMany({
          where: { status: "PUBLISHED" },
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            type: true,
            href: true,
            updatedAt: true,
          },
        }),
      ]);

    for (const i of insights) {
      records.push({
        id: i.id,
        title: i.title,
        slug: i.slug,
        path: `/insights/${i.slug}`,
        type: "Insight",
        topics: i.categoryLabel ? [i.categoryLabel] : tokensFrom(i.title),
        summary: (i.description || "").slice(0, 400),
        publishedAt: i.publishedAt?.toISOString() ?? null,
        updatedAt: i.updatedAt?.toISOString() ?? null,
      });
    }
    for (const s of services) {
      records.push({
        id: s.id,
        title: s.title,
        slug: s.href,
        path: s.href.startsWith("/") ? s.href : `/${s.href}`,
        type: "Service",
        topics: tokensFrom(s.title),
        summary: (s.summary || "").slice(0, 400),
        updatedAt: s.updatedAt?.toISOString() ?? null,
      });
    }
    for (const s of solutions) {
      records.push({
        id: s.id,
        title: s.title,
        slug: s.slug,
        path: `/solutions/${s.slug}`,
        type: "Solution",
        topics: tokensFrom(s.title),
        summary: (s.shortDescription || "").slice(0, 400),
        updatedAt: s.updatedAt?.toISOString() ?? null,
      });
    }
    for (const p of platforms) {
      records.push({
        id: p.id,
        title: p.title,
        slug: p.slug,
        path: p.href?.startsWith("/") ? p.href : `/platforms/${p.slug}`,
        type: "Platform",
        topics: tokensFrom(p.title),
        summary: (p.summary || "").slice(0, 400),
        updatedAt: p.updatedAt?.toISOString() ?? null,
      });
    }
    for (const i of industries) {
      records.push({
        id: i.id,
        title: i.name,
        slug: i.slug,
        path: `/industries/${i.slug}`,
        type: "Industry",
        topics: tokensFrom(i.name),
        summary: (i.description || "").slice(0, 400),
        updatedAt: i.updatedAt?.toISOString() ?? null,
      });
    }
    for (const w of work) {
      records.push({
        id: w.id,
        title: w.title || w.name,
        slug: w.slug,
        path: `/work/${w.slug}`,
        type: "Work",
        topics: tokensFrom(w.title || w.name),
        summary: (w.shortDescription || "").slice(0, 400),
        updatedAt: w.updatedAt?.toISOString() ?? null,
      });
    }
    for (const r of resources) {
      const typeMap: Record<string, ContentIndexRecord["type"]> = {
        guide: "Guide",
        comparison: "Comparison",
        checklist: "Checklist",
        glossary: "Glossary",
        template: "Template",
        tool: "Tool",
      };
      records.push({
        id: r.id,
        title: r.title,
        slug: r.slug,
        path: r.href?.startsWith("/") ? r.href : `/resources/${r.slug}`,
        type: typeMap[r.type] || "CmsResource",
        topics: tokensFrom(r.title),
        summary: (r.description || "").slice(0, 400),
        updatedAt: r.updatedAt?.toISOString() ?? null,
      });
    }
  }

  // Static registries (typed seed data) — metadata only
  for (const g of getPublishedGuides()) {
    records.push({
      id: `guide:${g.slug}`,
      title: g.title,
      slug: g.slug,
      path: `/guides/${g.slug}`,
      type: "Guide",
      topics: tokensFrom(g.title),
      summary: (g.description || "").slice(0, 400),
    });
  }
  for (const c of getPublishedComparisons()) {
    records.push({
      id: `comparison:${c.slug}`,
      title: c.title,
      slug: c.slug,
      path: `/compare/${c.slug}`,
      type: "Comparison",
      topics: tokensFrom(c.title),
      summary: (c.description || "").slice(0, 400),
    });
  }
  for (const c of getPublishedChecklists()) {
    records.push({
      id: `checklist:${c.slug}`,
      title: c.title,
      slug: c.slug,
      path: `/checklists/${c.slug}`,
      type: "Checklist",
      topics: tokensFrom(c.title),
      summary: (c.description || "").slice(0, 400),
    });
  }
  for (const g of getPublishedGlossaryEntries()) {
    records.push({
      id: `glossary:${g.slug}`,
      title: g.term || g.slug,
      slug: g.slug,
      path: `/glossary/${g.slug}`,
      type: "Glossary",
      topics: tokensFrom(g.term || g.slug),
      summary: (g.shortDefinition || "").slice(0, 400),
    });
  }
  for (const t of getPublishedTemplates()) {
    records.push({
      id: `template:${t.slug}`,
      title: t.title,
      slug: t.slug,
      path: `/templates/${t.slug}`,
      type: "Template",
      topics: tokensFrom(t.title),
      summary: (t.description || "").slice(0, 400),
    });
  }
  for (const t of getPublishedTools()) {
    records.push({
      id: `tool:${t.slug}`,
      title: t.title,
      slug: t.slug,
      path: `/tools/${t.slug}`,
      type: "Tool",
      topics: tokensFrom(t.title),
      summary: (t.description || "").slice(0, 400),
    });
  }

  return records;
}

export function findOverlappingContent(
  index: ContentIndexRecord[],
  query: string,
  limit = 8,
): Array<ContentIndexRecord & { overlapScore: number }> {
  return index
    .map((r) => ({ ...r, overlapScore: scoreOverlap(r, query) }))
    .filter((r) => r.overlapScore > 0)
    .sort((a, b) => b.overlapScore - a.overlapScore)
    .slice(0, limit);
}

/** Static audit helper for tests — discovery context must never query these. */
export const CONTENT_INDEX_FORBIDDEN_PRISMA = ["enquiry", "enquiryNote"] as const;
