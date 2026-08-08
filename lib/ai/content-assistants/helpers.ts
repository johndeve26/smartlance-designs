/**
 * Shared emptiness / snapshot helpers for content assistants.
 */

export function isEmptyValue(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") {
    return Object.keys(value as object).length === 0;
  }
  // 0 / false are valid content for some fields — not "missing"
  return false;
}

export function entityToPlain(row: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(
    JSON.stringify(row, (_k, v) => (v instanceof Date ? v.toISOString() : v)),
  ) as Record<string, unknown>;
}

export function formatFieldForDisplay(value: unknown): string {
  if (value == null) return "(empty)";
  if (typeof value === "string") return value || "(empty)";
  if (Array.isArray(value)) {
    if (!value.length) return "(empty list)";
    return value
      .map((item) => {
        if (typeof item === "string") return `• ${item}`;
        if (item && typeof item === "object") {
          const o = item as Record<string, unknown>;
          if (o.question && o.answer) return `Q: ${o.question}\nA: ${o.answer}`;
          if (o.title && o.description) return `${o.title} — ${o.description}`;
          if (o.title) return String(o.title);
          return JSON.stringify(item);
        }
        return String(item);
      })
      .join("\n");
  }
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

const FORBIDDEN_CLAIM_RE =
  /\b(guaranteed rankings?|guarantee[sd]? (conversion|revenue|traffic|roi)|%\s*(increase|growth|boost)|increase(d)? (traffic|revenue|conversions?) by\s*\d)/i;

export function containsUnsafeCommercialClaim(text: string): boolean {
  return FORBIDDEN_CLAIM_RE.test(text);
}

/** Unsupported Smartlance industry experience claims (supported industries). */
const FAKE_INDUSTRY_EXPERIENCE_RE =
  /\b(our clients in this (industry|sector)|our extensive experience|we('ve| have) (helped|worked with) (many |numerous )?(businesses|clients)|from our work with .{0,40} businesses|our proven track record in)\b/i;

export function containsUnsupportedIndustryExperience(text: string): boolean {
  return FAKE_INDUSTRY_EXPERIENCE_RE.test(text);
}

/** Platform partnership / certification / absolute superiority claims. */
const UNSAFE_PLATFORM_CLAIM_RE =
  /\b(certified .{0,40} partner|officially endorsed|guarantees? faster|always better for seo|unmatched|revolutionary|perfect platform|best platform)\b/i;

export function containsUnsafePlatformClaim(text: string): boolean {
  return UNSAFE_PLATFORM_CLAIM_RE.test(text) || containsUnsafeCommercialClaim(text);
}

/** Pricing / exact cost claims without sources. */
const VOLATILE_PRICE_RE =
  /\b(costs?|priced?|pricing)\b.{0,40}\$?\d+(\.\d+)?(\s*\/\s*(mo|month|yr|year))?/i;

export function containsVolatilePriceClaim(text: string): boolean {
  return VOLATILE_PRICE_RE.test(text);
}

export function scrubUnsafeStrings<T>(value: T): T {
  if (typeof value === "string") {
    let out: string = value;
    if (containsUnsafeCommercialClaim(out)) {
      out = out.replace(FORBIDDEN_CLAIM_RE, "[claim removed]");
    }
    if (containsUnsafePlatformClaim(out)) {
      out = out.replace(UNSAFE_PLATFORM_CLAIM_RE, "[claim removed]");
    }
    if (containsUnsupportedIndustryExperience(out)) {
      out = out.replace(FAKE_INDUSTRY_EXPERIENCE_RE, "[unsupported experience claim removed]");
    }
    return out as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => scrubUnsafeStrings(v)) as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as object)) {
      out[k] = scrubUnsafeStrings(v);
    }
    return out as T;
  }
  return value;
}

/** Walk proposal field text and attach claim blockers. */
export function annotateFieldClaimBlockers(
  fields: Array<{
    field: string;
    proposed: unknown;
    claimBlockers?: string[];
  }>,
  opts?: { allowExperienceClaims?: boolean; hasResearchSources?: boolean },
) {
  for (const f of fields) {
    const text =
      typeof f.proposed === "string"
        ? f.proposed
        : JSON.stringify(f.proposed ?? "");
    const blockers: string[] = [...(f.claimBlockers || [])];
    if (containsUnsafePlatformClaim(text)) {
      blockers.push("Unsupported platform partnership, guarantee, or absolute claim.");
    }
    if (containsVolatilePriceClaim(text) && !opts?.hasResearchSources) {
      blockers.push("Volatile pricing/availability claim lacks current research sources.");
    }
    if (
      !opts?.allowExperienceClaims &&
      containsUnsupportedIndustryExperience(text)
    ) {
      blockers.push("Implies Smartlance industry experience without verified Work.");
    }
    f.claimBlockers = blockers.length ? blockers : undefined;
  }
}
