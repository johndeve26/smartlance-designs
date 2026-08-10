import type {
  AgencyOnboardingActivityType,
  AgencyOnboardingQuestionType,
  AgencyOnboardingReviewStatus,
  AgencyOnboardingStatus,
  AgencyOnboardingTemplateStatus,
  AgencyOnboardingWaitingOn,
} from "@prisma/client";

export const ACTIVE_ONBOARDING_STATUSES: AgencyOnboardingStatus[] = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "WAITING_ON_CLIENT",
  "UNDER_REVIEW",
];

export const TERMINAL_ONBOARDING_STATUSES: AgencyOnboardingStatus[] = [
  "COMPLETED",
  "CANCELLED",
];

export const ONBOARDING_STATUS_LABELS: Record<AgencyOnboardingStatus, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  WAITING_ON_CLIENT: "Waiting on client",
  UNDER_REVIEW: "Under review",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const ONBOARDING_WAITING_ON_LABELS: Record<AgencyOnboardingWaitingOn, string> = {
  CLIENT: "Client",
  AGENCY: "Agency",
  NONE: "None",
};

export const ONBOARDING_TEMPLATE_STATUS_LABELS: Record<
  AgencyOnboardingTemplateStatus,
  string
> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  ARCHIVED: "Archived",
};

export const ONBOARDING_QUESTION_TYPE_LABELS: Record<AgencyOnboardingQuestionType, string> = {
  SHORT_TEXT: "Short text",
  LONG_TEXT: "Long text",
  EMAIL: "Email",
  PHONE: "Phone",
  URL: "URL",
  NUMBER: "Number",
  DATE: "Date",
  SINGLE_SELECT: "Single select",
  MULTI_SELECT: "Multi select",
  BOOLEAN: "Yes / No",
  FILE_REQUEST: "File upload",
};

export const ONBOARDING_REVIEW_STATUS_LABELS: Record<AgencyOnboardingReviewStatus, string> = {
  PENDING: "Pending review",
  ACCEPTED: "Accepted",
  NEEDS_CLARIFICATION: "Needs clarification",
};

export const ONBOARDING_ACTIVITY_TYPE_LABELS: Record<AgencyOnboardingActivityType, string> = {
  ONBOARDING_CREATED: "Onboarding created",
  ONBOARDING_STARTED: "Onboarding started",
  QUESTION_ANSWERED: "Question answered",
  FILE_UPLOADED: "File uploaded",
  REQUIREMENT_SUBMITTED: "Requirement submitted",
  ONBOARDING_SUBMITTED: "Submitted for review",
  CLARIFICATION_REQUESTED: "Clarification requested",
  RESPONSE_ACCEPTED: "Response accepted",
  REQUIREMENT_ACCEPTED: "Requirement accepted",
  ONBOARDING_COMPLETED: "Onboarding completed",
  ONBOARDING_REOPENED: "Onboarding reopened",
  ONBOARDING_CANCELLED: "Onboarding cancelled",
  REMINDER_SENT: "Reminder sent",
};

export const ONBOARDING_MAX_AUTOMATIC_REMINDERS = 3;
export const ONBOARDING_AUTOMATIC_REMINDER_INTERVAL_DAYS = 3;

/** Requirement statuses that count as complete for onboarding progress. */
export const REQUIREMENT_COMPLETE_STATUSES = ["ACCEPTED", "NOT_NEEDED"] as const;

/** Requirement statuses indicating client action still needed. */
export const REQUIREMENT_CLIENT_ACTION_STATUSES = [
  "REQUESTED",
  "NEEDS_CLARIFICATION",
] as const;
