/** Normalize subject and prepend a single Re: prefix for thread replies. */
export function normalizeReplySubject(subject: string): string {
  let display = subject.trim();
  while (/^(re|fw|fwd)\s*:\s*/i.test(display)) {
    display = display.replace(/^(re|fw|fwd)\s*:\s*/i, "").trim();
  }
  const normalized = display.charAt(0).toUpperCase() + display.slice(1) || "Conversation";
  return `Re: ${normalized}`;
}

export function snippetFromBody(body: string, max = 280): string {
  const flat = body.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max - 1)}…`;
}

export function waitingDurationLabel(since: Date | null | undefined): string | null {
  if (!since) return null;
  const ms = Date.now() - since.getTime();
  if (ms < 0) return null;
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 1) return "Waiting <1h";
  if (hours < 24) return `Waiting ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Waiting ${days}d`;
}
