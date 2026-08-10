import type {
  AgencyChangeRequestClassification,
  AgencyChangeRequestOrigin,
  AgencyChangeRequestStatus,
} from "@prisma/client";

export const CHANGE_REQUEST_PAGE_SIZE_DEFAULT = 25;
export const CHANGE_REQUEST_PAGE_SIZE_MAX = 100;

export const CHANGE_REQUEST_STATUS_LABELS: Record<AgencyChangeRequestStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  NEEDS_CLARIFICATION: "Needs clarification",
  UNDER_ASSESSMENT: "Under assessment",
  AWAITING_CLIENT_APPROVAL: "Awaiting client approval",
  APPROVED: "Approved",
  DECLINED: "Declined",
  APPLIED: "Applied",
  IMPLEMENTED: "Implemented",
  CANCELLED: "Cancelled",
};

export const CHANGE_REQUEST_CLASSIFICATION_LABELS: Record<
  AgencyChangeRequestClassification,
  string
> = {
  UNASSESSED: "Unassessed",
  IN_SCOPE: "In scope",
  OUT_OF_SCOPE: "Out of scope",
};

export const CHANGE_REQUEST_ORIGIN_LABELS: Record<AgencyChangeRequestOrigin, string> = {
  CLIENT: "Client",
  ADMIN: "Agency",
};

export const CLIENT_EDITABLE_STATUSES: AgencyChangeRequestStatus[] = ["DRAFT"];

export const CANCELLABLE_STATUSES: AgencyChangeRequestStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "NEEDS_CLARIFICATION",
  "UNDER_ASSESSMENT",
];

export const APPROVAL_CONSENT_TEMPLATE =
  "I approve Change Request {number}, including the stated scope, additional price and timeline impact.";
