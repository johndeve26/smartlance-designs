export const SEQUENCE_MIN_DELAY_MINUTES = 60;
export const SEQUENCE_MIN_EMAIL_STEP_GAP_MINUTES = 1440; // 24h default between automated emails
export const ENROLLMENT_BATCH_MAX = 100;
export const SCHEDULER_BATCH_MAX = 25;
export const EXECUTION_MAX_ATTEMPTS = 3;
export const CLAIM_LEASE_MS = 5 * 60 * 1000; // 5 minutes — safely above SMTP timeout
export const STALE_CLAIM_THRESHOLD_MS = CLAIM_LEASE_MS;
export const TRANSIENT_FAILURE_CODES = new Set([
  "DELIVERY_FAILED",
  "HTTP_ERROR",
]);
export const POST_SEND_PERSISTENCE_FAILURE = "POST_SEND_PERSISTENCE_FAILURE";

export const SEQUENCE_STATUS_LABELS = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  PAUSED: "Paused",
  ARCHIVED: "Archived",
} as const;

export const ENROLLMENT_STATUS_LABELS = {
  ACTIVE: "Active",
  PAUSED: "Paused",
  COMPLETED: "Completed",
  STOPPED: "Stopped",
  FAILED: "Failed",
} as const;

export const STEP_TYPE_LABELS = {
  EMAIL: "Email",
  TASK: "Task",
  WAIT: "Wait",
} as const;
