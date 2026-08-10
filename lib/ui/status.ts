import { AGENCY_PROJECT_STATUS_LABELS } from "@/lib/agency/constants";
import { CHANGE_REQUEST_STATUS_LABELS } from "@/lib/change-requests/constants";
import {
  PORTAL_CHANGE_STATUS,
  PORTAL_CONTRACT_STATUS,
  PORTAL_DELIVERABLE_STATUS,
  PORTAL_INVOICE_STATUS,
  PORTAL_MILESTONE_STATUS,
  PORTAL_PROJECT_STATUS,
  PORTAL_PROPOSAL_STATUS,
  PORTAL_REQUIREMENT_STATUS,
} from "@/lib/portal/status-labels";
import type { StatusTone } from "@/lib/ui/tokens";

export type StatusAudience = "admin" | "client";

export type StatusPresentation = {
  label: string;
  tone: StatusTone;
};

const PROJECT_ADMIN_TONES: Record<string, StatusTone> = {
  PLANNING: "neutral",
  ONBOARDING: "info",
  IN_PROGRESS: "active",
  CLIENT_REVIEW: "warning",
  ON_HOLD: "warning",
  COMPLETED: "success",
  CANCELLED: "neutral",
};

const PROJECT_CLIENT_TONES: Record<string, StatusTone> = {
  PLANNING: "neutral",
  ONBOARDING: "info",
  IN_PROGRESS: "active",
  CLIENT_REVIEW: "warning",
  ON_HOLD: "warning",
  COMPLETED: "success",
  CANCELLED: "neutral",
};

const PROPOSAL_TONES: Record<string, StatusTone> = {
  DRAFT: "neutral",
  INTERNAL_REVIEW: "info",
  SENT: "warning",
  CHANGES_REQUESTED: "warning",
  ACCEPTED: "success",
  DECLINED: "danger",
  EXPIRED: "neutral",
  ARCHIVED: "neutral",
};

const CONTRACT_TONES: Record<string, StatusTone> = {
  DRAFT: "neutral",
  READY_FOR_REVIEW: "info",
  SENT: "warning",
  PARTIALLY_SIGNED: "warning",
  SIGNED: "success",
  CORRECTION_REQUESTED: "warning",
  DECLINED: "danger",
  EXPIRED: "neutral",
  VOIDED: "danger",
  ARCHIVED: "neutral",
};

const INVOICE_TONES: Record<string, StatusTone> = {
  DRAFT: "neutral",
  ISSUED: "warning",
  PARTIALLY_PAID: "warning",
  PAID: "success",
  OVERDUE: "danger",
  VOID: "neutral",
  WRITTEN_OFF: "neutral",
};

const CHANGE_TONES: Record<string, StatusTone> = {
  DRAFT: "neutral",
  SUBMITTED: "info",
  NEEDS_CLARIFICATION: "warning",
  UNDER_ASSESSMENT: "info",
  AWAITING_CLIENT_APPROVAL: "warning",
  APPROVED: "success",
  DECLINED: "danger",
  APPLIED: "active",
  IMPLEMENTED: "success",
  CANCELLED: "neutral",
};

export type StatusDomain =
  | "project"
  | "milestone"
  | "requirement"
  | "deliverable"
  | "proposal"
  | "contract"
  | "invoice"
  | "change";

export function getStatusPresentation(
  domain: StatusDomain,
  value: string,
  audience: StatusAudience = "admin",
): StatusPresentation {
  switch (domain) {
    case "project":
      return {
        label:
          audience === "client"
            ? (PORTAL_PROJECT_STATUS[value as keyof typeof PORTAL_PROJECT_STATUS] ??
              AGENCY_PROJECT_STATUS_LABELS[value as keyof typeof AGENCY_PROJECT_STATUS_LABELS] ??
              value)
            : (AGENCY_PROJECT_STATUS_LABELS[value as keyof typeof AGENCY_PROJECT_STATUS_LABELS] ??
              value),
        tone:
          audience === "client"
            ? (PROJECT_CLIENT_TONES[value] ?? "neutral")
            : (PROJECT_ADMIN_TONES[value] ?? "neutral"),
      };
    case "milestone":
      return {
        label:
          audience === "client"
            ? (PORTAL_MILESTONE_STATUS[value as keyof typeof PORTAL_MILESTONE_STATUS] ?? value)
            : value.replace(/_/g, " ").toLowerCase(),
        tone: value === "COMPLETED" ? "success" : value === "BLOCKED" ? "warning" : "active",
      };
    case "requirement":
      return {
        label:
          audience === "client"
            ? (PORTAL_REQUIREMENT_STATUS[value as keyof typeof PORTAL_REQUIREMENT_STATUS] ?? value)
            : value.replace(/_/g, " ").toLowerCase(),
        tone: value === "ACCEPTED" ? "success" : value === "REQUESTED" ? "warning" : "neutral",
      };
    case "deliverable":
      return {
        label:
          audience === "client"
            ? (PORTAL_DELIVERABLE_STATUS[value as keyof typeof PORTAL_DELIVERABLE_STATUS] ?? value)
            : value.replace(/_/g, " ").toLowerCase(),
        tone:
          value === "APPROVED"
            ? "success"
            : value === "READY_FOR_REVIEW"
              ? "warning"
              : "neutral",
      };
    case "proposal":
      return {
        label:
          audience === "client"
            ? (PORTAL_PROPOSAL_STATUS[value] ?? value)
            : value.replace(/_/g, " ").toLowerCase(),
        tone: PROPOSAL_TONES[value] ?? "neutral",
      };
    case "contract":
      return {
        label:
          audience === "client"
            ? (PORTAL_CONTRACT_STATUS[value] ?? value)
            : value.replace(/_/g, " ").toLowerCase(),
        tone: CONTRACT_TONES[value] ?? "neutral",
      };
    case "invoice":
      return {
        label:
          audience === "client"
            ? (PORTAL_INVOICE_STATUS[value] ?? value)
            : value.replace(/_/g, " ").toLowerCase(),
        tone: INVOICE_TONES[value] ?? "neutral",
      };
    case "change":
      return {
        label:
          audience === "client"
            ? (PORTAL_CHANGE_STATUS[value as keyof typeof PORTAL_CHANGE_STATUS] ?? value)
            : (CHANGE_REQUEST_STATUS_LABELS[value as keyof typeof CHANGE_REQUEST_STATUS_LABELS] ??
              value),
        tone: CHANGE_TONES[value] ?? "neutral",
      };
    default:
      return { label: value, tone: "neutral" };
  }
}
