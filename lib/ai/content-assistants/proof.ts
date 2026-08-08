/**
 * Proof integrity helpers — Case Study metrics + Testimonial excerpt extraction.
 */

const PERFORMANCE_METRIC_RE =
  /\b(increased|grew|boosted|improved|doubled|tripled|generated)\b.{0,40}(\d+\s*%|\$[\d,]+|\brevenue\b|\broi\b|\btraffic\b|\bconversions?\b|\brankings?\b|#\s*1)/i;

const EMBELLISHMENT_RE =
  /\b(explosive growth|game[- ]?changing|revolutioni[sz]ed|transformed everything|exceptional results|flawless execution|exceeded all (our )?expectations)\b/i;

export function containsUnsupportedPerformanceClaim(text: string): boolean {
  return PERFORMANCE_METRIC_RE.test(text) || EMBELLISHMENT_RE.test(text);
}

export function normalizeQuoteText(text: string): string {
  return text
    .replace(/\u201c|\u201d/g, '"')
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Tokenize for excerpt validation — words only, lowercased. */
export function quoteWords(text: string): string[] {
  return normalizeQuoteText(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Excerpt must use only words from the original, in order (subsequence).
 * Allows ellipsis / punctuation that do not introduce new words.
 */
export function isValidExcerptFromOriginal(
  original: string,
  excerpt: string,
): boolean {
  const orig = quoteWords(original);
  const ex = quoteWords(excerpt);
  if (!ex.length || !orig.length) return false;
  if (ex.length > orig.length) return false;

  let i = 0;
  for (const w of ex) {
    while (i < orig.length && orig[i] !== w) i += 1;
    if (i >= orig.length) return false;
    i += 1;
  }
  return true;
}

/** Reject creative rewrites: high word-set difference or embellishment. */
export function isSafeQuoteFormat(original: string, proposed: string): boolean {
  if (containsUnsupportedPerformanceClaim(proposed) && !containsUnsupportedPerformanceClaim(original)) {
    return false;
  }
  const a = new Set(quoteWords(original));
  const b = quoteWords(proposed);
  if (!b.length) return false;
  let missing = 0;
  for (const w of b) {
    if (!a.has(w)) missing += 1;
  }
  // Allow tiny punctuation-driven token noise; block material new wording
  if (missing / b.length > 0.08) return false;
  // Length should stay close
  const oa = quoteWords(original);
  if (Math.abs(b.length - oa.length) > Math.max(3, Math.floor(oa.length * 0.15))) {
    return false;
  }
  return true;
}

export function deterministicFormatQuote(quote: string): string {
  let out = normalizeQuoteText(quote);
  out = out.replace(/\s+([.,!?])/g, "$1");
  if (out.length && /^[a-z]/.test(out)) {
    out = out.charAt(0).toUpperCase() + out.slice(1);
  }
  return out;
}

export type ApprovedProjectFacts = {
  objective?: string;
  problem?: string;
  workCompleted?: string;
  deliverables?: string[];
  technology?: string[];
  platform?: string;
  clientContext?: string;
  outcome?: string;
  verifiedMetrics?: string[];
};

export function parseApprovedFacts(raw: unknown): ApprovedProjectFacts {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const str = (k: string) =>
    typeof o[k] === "string" ? (o[k] as string).trim() : undefined;
  const arr = (k: string) =>
    Array.isArray(o[k])
      ? (o[k] as unknown[]).filter((x): x is string => typeof x === "string")
      : undefined;
  return {
    objective: str("objective"),
    problem: str("problem"),
    workCompleted: str("workCompleted"),
    deliverables: arr("deliverables"),
    technology: arr("technology"),
    platform: str("platform"),
    clientContext: str("clientContext"),
    outcome: str("outcome"),
    verifiedMetrics: arr("verifiedMetrics"),
  };
}

export function hasEnoughProjectFacts(facts: ApprovedProjectFacts, work: {
  challenge?: string | null;
  solution?: string | null;
}): boolean {
  const problem = facts.problem || work.challenge;
  const workDone = facts.workCompleted || work.solution;
  return Boolean(
    (problem && problem.trim().length > 20) ||
      (workDone && workDone.trim().length > 20) ||
      facts.objective ||
      facts.outcome ||
      (facts.verifiedMetrics && facts.verifiedMetrics.length),
  );
}
