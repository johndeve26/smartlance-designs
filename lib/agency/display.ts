export {
  AGENCY_ACTIVITY_TYPE_LABELS,
  AGENCY_CLIENT_ROLE_LABELS,
  AGENCY_DELIVERABLE_STATUS_LABELS,
  AGENCY_DELIVERABLE_TYPE_LABELS,
  AGENCY_MEMBER_ROLE_LABELS,
  AGENCY_MILESTONE_STATUS_LABELS,
  AGENCY_PROJECT_HEALTH_LABELS,
  AGENCY_PROJECT_STATUS_LABELS,
  AGENCY_REQUIREMENT_STATUS_LABELS,
  AGENCY_REQUIREMENT_TYPE_LABELS,
  AGENCY_SERVICE_TYPE_LABELS,
  AGENCY_TASK_PRIORITY_LABELS,
  AGENCY_TASK_STATUS_LABELS,
} from "@/lib/agency/constants";

export function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
}

export function formatDateTime(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString();
}

export function healthTone(health: string): "success" | "warning" | "danger" {
  switch (health) {
    case "ON_TRACK":
      return "success";
    case "AT_RISK":
      return "warning";
    default:
      return "danger";
  }
}

export function statusTone(status: string): "neutral" | "success" | "warning" | "danger" {
  switch (status) {
    case "COMPLETED":
    case "DONE":
    case "APPROVED":
      return "success";
    case "ON_HOLD":
    case "BLOCKED":
    case "CHANGES_REQUESTED":
      return "danger";
    case "CLIENT_REVIEW":
    case "IN_PROGRESS":
    case "READY_FOR_REVIEW":
      return "warning";
    default:
      return "neutral";
  }
}
