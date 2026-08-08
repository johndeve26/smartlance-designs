/**
 * Build a small focused discovery query set from a seed.
 * Heuristic by default; optional AI FAST enrichment can be added by caller.
 * Prefer distinct research directions — not keyword permutations.
 */

export function planDiscoveryQueries(seed: string, max = 6): string[] {
  const s = seed.trim();
  if (!s) return [];
  const base = [
    s,
    `${s} business problems`,
    `${s} recent guidance`,
    `${s} common mistakes`,
    `${s} decision criteria`,
  ];
  if (/seo|search/i.test(s)) base.push(`${s} official documentation`);
  if (/wordpress|shopify|webflow|bigcommerce/i.test(s)) {
    base.push(`${s} platform update changelog`);
  }
  if (/migrat|redesign|performance|conversion/i.test(s)) {
    base.push(`${s} technical SEO`);
  }
  const uniq = [...new Set(base.map((q) => q.trim()).filter(Boolean))];
  return uniq.slice(0, Math.max(1, Math.min(max, 8)));
}

/** Flag near-duplicate query permutations (same token multiset). */
export function detectQueryPermutationSpam(queries: string[]): string[] {
  const seen = new Map<string, string>();
  const spam: string[] = [];
  for (const q of queries) {
    const key = q
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 2)
      .sort()
      .join(" ");
    if (!key) continue;
    const prior = seen.get(key);
    if (prior && prior !== q) spam.push(q);
    else seen.set(key, q);
  }
  return spam;
}

/** Soft quality flags for human review — not hard blocks. */
export function flagDiscoveryQueryQuality(queries: string[]): string[] {
  const flags: string[] = [];
  for (const q of queries) {
    if (q.split(/\s+/).length <= 1) flags.push(`too-broad:${q}`);
    if (/\b(top\s*\d+|ultimate|best ever)\b/i.test(q)) flags.push(`content-farm-shaped:${q}`);
  }
  const perms = detectQueryPermutationSpam(queries);
  for (const p of perms) flags.push(`permutation:${p}`);
  return flags;
}
