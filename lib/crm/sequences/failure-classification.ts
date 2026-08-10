import {
  EXECUTION_MAX_ATTEMPTS,
  TRANSIENT_FAILURE_CODES,
} from "@/lib/crm/sequences/constants";

/** How failure codes are classified for retry decisions. */
export type FailureCategory =
  | "TRANSIENT_SAFE_TO_RETRY"
  | "PERMANENT"
  | "AMBIGUOUS_DO_NOT_AUTO_RETRY"
  | "SUPPRESSED"
  | "SKIPPED";

export const PERMANENT_FAILURE_CODES = new Set([
  "AUTH_FAILED",
  "SENDER_REJECTED",
  "UNCONFIGURED",
  "INVALID_RECIPIENT",
  "UNRESOLVED_VARIABLES",
  "SUPPRESSED",
  "NO_EMAIL",
]);

export const AMBIGUOUS_FAILURE_CODES = new Set([
  "POST_SEND_PERSISTENCE_FAILURE",
  "NETWORK_TIMEOUT_AMBIGUOUS",
]);

/** SMTP/network timeout may have accepted before client saw response — retry cautiously once. */
export const CAUTIOUS_RETRY_CODES = new Set(["TIMEOUT", "CONNECTION_FAILED"]);

export function classifySendFailure(code: string): FailureCategory {
  if (AMBIGUOUS_FAILURE_CODES.has(code)) {
    return "AMBIGUOUS_DO_NOT_AUTO_RETRY";
  }
  if (PERMANENT_FAILURE_CODES.has(code)) {
    return "PERMANENT";
  }
  if (TRANSIENT_FAILURE_CODES.has(code) || CAUTIOUS_RETRY_CODES.has(code)) {
    return "TRANSIENT_SAFE_TO_RETRY";
  }
  return "TRANSIENT_SAFE_TO_RETRY";
}

export function shouldRetryExecution(input: {
  category: FailureCategory;
  attemptCount: number;
  maxAttempts?: number;
}): boolean {
  if (input.category === "AMBIGUOUS_DO_NOT_AUTO_RETRY") return false;
  if (input.category === "PERMANENT") return false;
  if (input.category === "SUPPRESSED" || input.category === "SKIPPED") return false;
  return input.attemptCount < (input.maxAttempts ?? EXECUTION_MAX_ATTEMPTS);
}

export function isSmtpAuthOrConfigFailure(code: string): boolean {
  return code === "AUTH_FAILED" || code === "UNCONFIGURED" || code === "SENDER_REJECTED";
}
