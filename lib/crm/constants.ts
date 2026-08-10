import type {
  CrmContactEmailStatus,
  CrmContactLifecycleStage,
  CrmContactSource,
  CrmDealLostReason,
  CrmDealStage,
  CrmLeadDisqualificationReason,
  CrmLeadStatus,
  CrmLeadTemperature,
  CrmTaskPriority,
  CrmTaskStatus,
} from "@prisma/client";

export const CRM_PAGE_SIZE_DEFAULT = 25;
export const CRM_PAGE_SIZE_MAX = 100;
export const CRM_EXPORT_MAX_ROWS = 5000;
export const CRM_ACTIVITY_TIMELINE_DEFAULT = 20;
export const CRM_RECENT_ACTIVITY_LIMIT = 20;

/** Lead statuses considered inactive — a new lead may be created for the contact. */
export const INACTIVE_LEAD_STATUSES: CrmLeadStatus[] = [
  "UNQUALIFIED",
  "CLOSED",
];

/** Email statuses that block CRM outbound send server-side. */
export const BLOCKED_EMAIL_STATUSES: CrmContactEmailStatus[] = [
  "DO_NOT_EMAIL",
  "UNSUBSCRIBED",
  "BOUNCED",
  "COMPLAINED",
  "INVALID",
  "SUPPRESSED",
];

/** Default deal probability by stage (operational defaults, not predictive). */
export const DEAL_STAGE_DEFAULT_PROBABILITY: Record<CrmDealStage, number> = {
  NEW_OPPORTUNITY: 10,
  DISCOVERY: 25,
  QUALIFIED: 40,
  PROPOSAL: 60,
  NEGOTIATION: 80,
  WON: 100,
  LOST: 0,
};

export const ACTIVE_DEAL_STAGES: CrmDealStage[] = [
  "NEW_OPPORTUNITY",
  "DISCOVERY",
  "QUALIFIED",
  "PROPOSAL",
  "NEGOTIATION",
];

export const CRM_LIFECYCLE_LABELS: Record<CrmContactLifecycleStage, string> = {
  PROSPECT: "Prospect",
  LEAD: "Lead",
  OPPORTUNITY: "Opportunity",
  CLIENT: "Client",
  PAST_CLIENT: "Past Client",
  OTHER: "Other",
};

export const CRM_SOURCE_LABELS: Record<CrmContactSource, string> = {
  MANUAL: "Manual",
  CONTACT_FORM: "Contact Form",
  WEBSITE_REVIEW: "Website Review",
  PROJECT_PLANNER: "Project Planner",
  PROSPECT_WORKSPACE: "Prospect Workspace",
  REFERRAL: "Referral",
  INBOUND_EMAIL: "Inbound Email",
  OUTBOUND: "Outbound",
  UPWORK: "Upwork",
  SOCIAL: "Social",
  OTHER: "Other",
};

export const CRM_LEAD_STATUS_LABELS: Record<CrmLeadStatus, string> = {
  NEW: "New",
  ATTEMPTING: "Attempting",
  CONNECTED: "Connected",
  QUALIFIED: "Qualified",
  UNQUALIFIED: "Unqualified",
  BAD_TIMING: "Bad Timing",
  CLOSED: "Closed",
};

export const CRM_LEAD_TEMPERATURE_LABELS: Record<CrmLeadTemperature, string> = {
  COLD: "Cold",
  WARM: "Warm",
  HOT: "Hot",
};

export const CRM_DEAL_STAGE_LABELS: Record<CrmDealStage, string> = {
  NEW_OPPORTUNITY: "New Opportunity",
  DISCOVERY: "Discovery",
  QUALIFIED: "Qualified",
  PROPOSAL: "Proposal",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
};

export const CRM_EMAIL_STATUS_LABELS: Record<CrmContactEmailStatus, string> = {
  SENDABLE: "Sendable",
  DO_NOT_EMAIL: "Do Not Email",
  UNSUBSCRIBED: "Unsubscribed",
  BOUNCED: "Bounced",
  COMPLAINED: "Complained",
  INVALID: "Invalid",
  SUPPRESSED: "Suppressed",
};

export const CRM_TASK_STATUS_LABELS: Record<CrmTaskStatus, string> = {
  OPEN: "Open",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const CRM_TASK_PRIORITY_LABELS: Record<CrmTaskPriority, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
};

export const CRM_THREAD_WORKFLOW_LABELS: Record<
  import("@prisma/client").CrmThreadWorkflowStatus,
  string
> = {
  NEEDS_REPLY: "Needs reply",
  WAITING_ON_CONTACT: "Waiting on contact",
  SNOOZED: "Snoozed",
  CLOSED: "Closed",
  NEEDS_REVIEW: "Needs review",
};

export const CRM_DISQUALIFICATION_LABELS: Record<
  CrmLeadDisqualificationReason,
  string
> = {
  NO_BUDGET: "No Budget",
  NOT_A_FIT: "Not a Fit",
  NO_RESPONSE: "No Response",
  BAD_TIMING: "Bad Timing",
  DUPLICATE: "Duplicate",
  SPAM: "Spam",
  OTHER: "Other",
};

export const CRM_LOST_REASON_LABELS: Record<CrmDealLostReason, string> = {
  PRICE: "Price",
  NO_RESPONSE: "No Response",
  COMPETITOR: "Competitor",
  TIMING: "Timing",
  INTERNAL_DECISION: "Internal Decision",
  NOT_A_FIT: "Not a Fit",
  OTHER: "Other",
};
