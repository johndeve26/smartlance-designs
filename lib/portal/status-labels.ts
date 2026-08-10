import type {
  AgencyChangeRequestStatus,
  AgencyDeliverableStatus,
  AgencyMilestoneStatus,
  AgencyProjectStatus,
  AgencyRequirementStatus,
} from "@prisma/client";

/** Client-facing labels — do not expose internal enum names in UI. */

export const PORTAL_PROJECT_STATUS: Record<AgencyProjectStatus, string> = {
  PLANNING: "Planning",
  ONBOARDING: "Onboarding",
  IN_PROGRESS: "In progress",
  CLIENT_REVIEW: "In review",
  ON_HOLD: "On hold",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const PORTAL_MILESTONE_STATUS: Record<AgencyMilestoneStatus, string> = {
  NOT_STARTED: "Upcoming",
  IN_PROGRESS: "In progress",
  BLOCKED: "On hold",
  CLIENT_REVIEW: "Your review",
  COMPLETED: "Complete",
};

export const PORTAL_REQUIREMENT_STATUS: Record<AgencyRequirementStatus, string> = {
  REQUESTED: "Needed from you",
  RECEIVED: "Received",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  NEEDS_CLARIFICATION: "Needs clarification",
  ACCEPTED: "Accepted",
  NOT_NEEDED: "Not needed",
};

export const PORTAL_DELIVERABLE_STATUS: Record<AgencyDeliverableStatus, string> = {
  DRAFT: "In preparation",
  READY_FOR_REVIEW: "Ready for your review",
  CHANGES_REQUESTED: "Changes requested",
  APPROVED: "Approved",
  ARCHIVED: "Archived",
};

export const PORTAL_CHANGE_STATUS: Record<AgencyChangeRequestStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  NEEDS_CLARIFICATION: "Clarification needed",
  UNDER_ASSESSMENT: "Under review",
  AWAITING_CLIENT_APPROVAL: "Awaiting your approval",
  APPROVED: "Approved",
  DECLINED: "Declined",
  APPLIED: "In progress",
  IMPLEMENTED: "Complete",
  CANCELLED: "Cancelled",
};

export const PORTAL_PROPOSAL_STATUS: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Ready for review",
  CHANGES_REQUESTED: "Changes requested",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  EXPIRED: "Expired",
  VOIDED: "Voided",
};

export const PORTAL_CONTRACT_STATUS: Record<string, string> = {
  DRAFT: "Draft",
  READY_FOR_REVIEW: "Ready for review",
  SENT: "Ready for signature",
  PARTIALLY_SIGNED: "Awaiting signatures",
  SIGNED: "Signed",
  CORRECTION_REQUESTED: "Correction requested",
  DECLINED: "Declined",
  EXPIRED: "Expired",
  VOIDED: "Voided",
  ARCHIVED: "Archived",
};

export const PORTAL_INVOICE_STATUS: Record<string, string> = {
  DRAFT: "Draft",
  ISSUED: "Due",
  PARTIALLY_PAID: "Partially paid",
  PAID: "Paid",
  OVERDUE: "Overdue",
  VOID: "Void",
  WRITTEN_OFF: "Written off",
};

export function portalGreeting(name: string | null | undefined) {
  const hour = new Date().getHours();
  const salutation = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return name?.trim() ? `${salutation}, ${name.trim()}` : salutation;
}

export function formatPortalDate(date: Date | string | null | undefined) {
  if (!date) return null;
  return new Date(date).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const PORTAL_ATTENTION_TYPE_LABELS: Record<string, string> = {
  DELIVERABLE_APPROVAL: "Approval",
  ONBOARDING: "Onboarding",
  CLIENT_REQUIREMENT: "What we need",
  CLARIFICATION: "Clarification",
  CONTRACT_SIGNATURE: "Signature",
  PROPOSAL_DECISION: "Proposal",
  INVOICE_DUE: "Payment",
  INVOICE_OVERDUE: "Overdue payment",
  CHANGE_REQUEST_APPROVAL: "Change request",
  CHANGE_REQUEST_CLARIFICATION: "Change clarification",
  MILESTONE_REVIEW: "Review",
  SUPPORT_WAITING_ON_CLIENT: "Support",
};
