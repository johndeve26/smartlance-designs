/**
 * Timeout signals for outbound network calls.
 *
 * Every external request needs a bound: on serverless hosts a hung upstream
 * holds the function open until the platform kills it, so a slow provider
 * turns into failed page renders rather than a handled provider error.
 */

export const OUTBOUND_TIMEOUTS = {
  /** Operator notification (webhook / transactional email). */
  notification: 10_000,
  /** Search-index ping — never worth delaying a publish for. */
  indexing: 8_000,
  /** Third-party research and news APIs. */
  research: 15_000,
} as const;

/** Timeout signal, combined with a caller's cancellation signal when present. */
export function timeoutSignal(
  ms: number,
  callerSignal?: AbortSignal | null,
): AbortSignal {
  const timeout = AbortSignal.timeout(ms);
  return callerSignal ? AbortSignal.any([callerSignal, timeout]) : timeout;
}

/** True when a rejection came from an abort/timeout rather than the upstream. */
export function isTimeoutError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  );
}
