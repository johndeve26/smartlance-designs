import type {
  AgencyDeliverableStatus,
  AgencyDeliverableType,
  AgencyMilestoneStatus,
  AgencyProjectActivityType,
  AgencyProjectClientRole,
  AgencyProjectHealth,
  AgencyProjectMemberRole,
  AgencyProjectStatus,
  AgencyProjectTaskPriority,
  AgencyProjectTaskStatus,
  AgencyRequirementStatus,
  AgencyRequirementType,
  AgencyServiceType,
} from "@prisma/client";

export const AGENCY_PAGE_SIZE_DEFAULT = 25;
export const AGENCY_PAGE_SIZE_MAX = 100;
export const AGENCY_ACTIVITY_DEFAULT = 20;
export const AGENCY_PRIVATE_STORAGE_PREFIX = "agency/private";

export const ACTIVE_PROJECT_STATUSES: AgencyProjectStatus[] = [
  "PLANNING",
  "ONBOARDING",
  "IN_PROGRESS",
  "CLIENT_REVIEW",
  "ON_HOLD",
];

export const ACTIVE_AGENCY_PROJECT_STATUSES = ACTIVE_PROJECT_STATUSES;

export const TERMINAL_AGENCY_PROJECT_STATUSES: AgencyProjectStatus[] = [
  "COMPLETED",
  "CANCELLED",
];

export const AGENCY_PROJECT_STATUS_LABELS: Record<AgencyProjectStatus, string> = {
  PLANNING: "Planning",
  ONBOARDING: "Onboarding",
  IN_PROGRESS: "In progress",
  CLIENT_REVIEW: "Client review",
  ON_HOLD: "On hold",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const AGENCY_PROJECT_HEALTH_LABELS: Record<AgencyProjectHealth, string> = {
  ON_TRACK: "On track",
  AT_RISK: "At risk",
  BLOCKED: "Blocked",
};

export const AGENCY_SERVICE_TYPE_LABELS: Record<AgencyServiceType, string> = {
  WEBSITE_DESIGN: "Website design",
  WEBSITE_REDESIGN: "Website redesign",
  LANDING_PAGE: "Landing page",
  ECOMMERCE: "Ecommerce",
  SEO: "SEO",
  BRANDING: "Branding",
  WEBSITE_MAINTENANCE: "Website maintenance",
  DIGITAL_STRATEGY: "Digital strategy",
  OTHER: "Other",
};

export const AGENCY_MILESTONE_STATUS_LABELS: Record<AgencyMilestoneStatus, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  BLOCKED: "Blocked",
  CLIENT_REVIEW: "Client review",
  COMPLETED: "Completed",
};

export const AGENCY_TASK_STATUS_LABELS: Record<AgencyProjectTaskStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  BLOCKED: "Blocked",
  REVIEW: "Review",
  DONE: "Done",
};

export const AGENCY_TASK_PRIORITY_LABELS: Record<AgencyProjectTaskPriority, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
  URGENT: "Urgent",
};

export const AGENCY_REQUIREMENT_TYPE_LABELS: Record<AgencyRequirementType, string> = {
  CONTENT: "Content",
  BRAND_ASSET: "Brand asset",
  ACCESS: "Access",
  APPROVAL: "Approval",
  INFORMATION: "Information",
  OTHER: "Other",
};

export const AGENCY_REQUIREMENT_STATUS_LABELS: Record<AgencyRequirementStatus, string> = {
  REQUESTED: "Requested",
  RECEIVED: "Received",
  ACCEPTED: "Accepted",
  NOT_NEEDED: "Not needed",
};

export const AGENCY_DELIVERABLE_TYPE_LABELS: Record<AgencyDeliverableType, string> = {
  DESIGN: "Design",
  DOCUMENT: "Document",
  WEBSITE_PREVIEW: "Website preview",
  COPY: "Copy",
  REPORT: "Report",
  BRAND_ASSET: "Brand asset",
  OTHER: "Other",
};

export const AGENCY_DELIVERABLE_STATUS_LABELS: Record<AgencyDeliverableStatus, string> = {
  DRAFT: "Draft",
  READY_FOR_REVIEW: "Ready for review",
  CHANGES_REQUESTED: "Changes requested",
  APPROVED: "Approved",
  ARCHIVED: "Archived",
};

export const AGENCY_MEMBER_ROLE_LABELS: Record<AgencyProjectMemberRole, string> = {
  OWNER: "Owner",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

export const AGENCY_CLIENT_ROLE_LABELS: Record<AgencyProjectClientRole, string> = {
  CLIENT_ADMIN: "Client admin",
  CLIENT_MEMBER: "Client member",
  VIEWER: "Viewer",
};

export const AGENCY_ACTIVITY_TYPE_LABELS: Record<AgencyProjectActivityType, string> = {
  PROJECT_CREATED: "Project created",
  STATUS_CHANGED: "Status changed",
  HEALTH_CHANGED: "Health changed",
  MILESTONE_COMPLETED: "Milestone completed",
  TASK_COMPLETED: "Task completed",
  DELIVERABLE_SUBMITTED: "Deliverable submitted",
  DELIVERABLE_APPROVED: "Deliverable approved",
  DELIVERABLE_CHANGES_REQUESTED: "Changes requested",
  REQUIREMENT_RECEIVED: "Requirement received",
  UPDATE_POSTED: "Update posted",
  MEMBER_ADDED: "Member added",
  CLIENT_ACCESS_GRANTED: "Client access granted",
};
