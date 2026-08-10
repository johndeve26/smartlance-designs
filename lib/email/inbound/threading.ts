/** Normalize RFC Message-ID for comparison (strip angle brackets, lowercase). */
export function normalizeMessageId(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  return value.trim().replace(/^<|>$/g, "").toLowerCase();
}

/** Normalize reply subject prefixes for fallback matching. */
export function normalizeSubject(subject: string): string {
  let s = subject.trim();
  for (let i = 0; i < 5; i++) {
    const next = s.replace(/^(re|fw|fwd)\s*:\s*/i, "").trim();
    if (next === s) break;
    s = next;
  }
  return s.toLowerCase();
}

export function extractMessageIdsFromReferences(header: string | null | undefined): string[] {
  if (!header?.trim()) return [];
  const matches = header.match(/<[^>]+>/g) ?? [];
  return matches
    .map((m) => normalizeMessageId(m))
    .filter((id): id is string => Boolean(id));
}

export function parseReferencesChain(input: {
  inReplyTo?: string | null;
  references?: string | null;
}): string[] {
  const ids: string[] = [];
  const inReply = normalizeMessageId(input.inReplyTo);
  if (inReply) ids.push(inReply);
  for (const ref of extractMessageIdsFromReferences(input.references)) {
    if (!ids.includes(ref)) ids.push(ref);
  }
  return ids;
}
