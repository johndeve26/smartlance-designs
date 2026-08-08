export type AnalysisKind =
  | "factCheck"
  | "seo"
  | "aiSearch"
  | "internalLinks"
  | "quality"
  | "cannibalization"
  | "brief"
  | "outline";

export type AnalysisStaleMap = Partial<Record<AnalysisKind, boolean>>;

/** Draft change invalidates claim + review analyses. */
export const DRAFT_INVALIDATES: AnalysisKind[] = [
  "factCheck",
  "seo",
  "aiSearch",
  "internalLinks",
  "quality",
];

/** Source change invalidates fact check and related reviews. */
export const SOURCE_INVALIDATES: AnalysisKind[] = [
  "factCheck",
  "seo",
  "aiSearch",
  "quality",
];

/** Brief/intent change warns draft may need regen + reviews. */
export const BRIEF_INVALIDATES: AnalysisKind[] = [
  "outline",
  "factCheck",
  "seo",
  "aiSearch",
  "internalLinks",
  "quality",
];

export function mergeStale(
  current: unknown,
  keys: AnalysisKind[],
): AnalysisStaleMap {
  const base =
    current && typeof current === "object" && !Array.isArray(current)
      ? ({ ...(current as AnalysisStaleMap) } as AnalysisStaleMap)
      : ({} as AnalysisStaleMap);
  for (const k of keys) base[k] = true;
  return base;
}

export function clearStale(
  current: unknown,
  keys: AnalysisKind[],
): AnalysisStaleMap {
  const base =
    current && typeof current === "object" && !Array.isArray(current)
      ? ({ ...(current as AnalysisStaleMap) } as AnalysisStaleMap)
      : ({} as AnalysisStaleMap);
  for (const k of keys) delete base[k];
  return base;
}

export function isStale(current: unknown, key: AnalysisKind): boolean {
  if (!current || typeof current !== "object") return false;
  return Boolean((current as AnalysisStaleMap)[key]);
}

export function staleLabel(current: unknown, key: AnalysisKind): string | null {
  return isStale(current, key) ? "Needs rerun" : null;
}
