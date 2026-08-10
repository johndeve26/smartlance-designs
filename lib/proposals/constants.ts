import type { AgencyProposalStatus } from "@prisma/client";

export const PROPOSAL_PAGE_SIZE_DEFAULT = 25;
export const PROPOSAL_PAGE_SIZE_MAX = 100;

export const PROPOSAL_STATUS_LABELS: Record<AgencyProposalStatus, string> = {
  DRAFT: "Draft",
  INTERNAL_REVIEW: "Internal review",
  SENT: "Sent",
  CHANGES_REQUESTED: "Changes requested",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  EXPIRED: "Expired",
  ARCHIVED: "Archived",
};

export const PROPOSAL_TERMINAL_STATUSES = new Set<AgencyProposalStatus>([
  "ACCEPTED",
  "DECLINED",
  "ARCHIVED",
]);

export const PROPOSAL_CLIENT_DECISION_STATUSES = new Set<AgencyProposalStatus>([
  "SENT",
  "CHANGES_REQUESTED",
]);

export const PROPOSAL_LINE_ITEM_TYPE_LABELS = {
  SERVICE: "Service",
  ADD_ON: "Add-on",
  DISCOUNT: "Discount",
  OTHER: "Other",
} as const;

export const PROPOSAL_CLIENT_ROLE_LABELS = {
  VIEWER: "Viewer",
  DECISION_MAKER: "Decision maker",
} as const;

export const PROPOSAL_SECTION_TYPE_LABELS = {
  OVERVIEW: "Overview",
  GOALS: "Goals & objectives",
  SCOPE: "Scope",
  DELIVERABLES: "Deliverables",
  TIMELINE: "Timeline",
  PRICING: "Pricing",
  ASSUMPTIONS: "Assumptions",
  EXCLUSIONS: "Exclusions",
  REVISION_POLICY: "Revision policy",
  NEXT_STEPS: "Next steps",
  CLIENT_RESPONSIBILITIES: "Client responsibilities",
} as const;
