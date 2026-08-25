import type { CrmActivityType } from "@prisma/client";
import {
  CRM_DEAL_STAGE_LABELS,
  CRM_EMAIL_STATUS_LABELS,
  CRM_LEAD_STATUS_LABELS,
  CRM_LEAD_TEMPERATURE_LABELS,
  CRM_LIFECYCLE_LABELS,
  CRM_SOURCE_LABELS,
  CRM_TASK_PRIORITY_LABELS,
  CRM_TASK_STATUS_LABELS,
  CRM_THREAD_WORKFLOW_LABELS,
} from "@/lib/crm/constants";

export const CRM_ACTIVITY_TYPE_LABELS: Record<CrmActivityType, string> = {
  CONTACT_CREATED: "Contact created",
  LEAD_CREATED: "Lead created",
  STATUS_CHANGED: "Status changed",
  TEMPERATURE_CHANGED: "Temperature changed",
  EMAIL_SENT: "Email sent",
  CALL: "Call",
  MEETING: "Meeting",
  NOTE: "Note",
  TASK_CREATED: "Task created",
  TASK_COMPLETED: "Task completed",
  FORM_SUBMISSION: "Form submission",
  PROPOSAL_SENT: "Proposal sent",
  DEAL_CREATED: "Deal created",
  DEAL_STAGE_CHANGED: "Deal stage changed",
  DEAL_WON: "Deal won",
  DEAL_LOST: "Deal lost",
  LIFECYCLE_CHANGED: "Lifecycle changed",
  EMAIL_STATUS_CHANGED: "Email status changed",
  SEQUENCE_ENROLLED: "Sequence enrolled",
  SEQUENCE_PAUSED: "Sequence paused",
  SEQUENCE_COMPLETED: "Sequence completed",
  SEQUENCE_STOPPED: "Sequence stopped",
  MANUAL_REPLY_RECORDED: "Reply recorded (manual)",
  EMAIL_RECEIVED: "Email received",
  EMAIL_OPEN_DETECTED: "Open detected",
  EMAIL_LINK_CLICKED: "Link click detected",
  CONTACT_IMPORTED: "Contact imported",
};

export {
  CRM_DEAL_STAGE_LABELS,
  CRM_EMAIL_STATUS_LABELS,
  CRM_LEAD_STATUS_LABELS,
  CRM_LEAD_TEMPERATURE_LABELS,
  CRM_LIFECYCLE_LABELS,
  CRM_SOURCE_LABELS,
  CRM_TASK_PRIORITY_LABELS,
  CRM_TASK_STATUS_LABELS,
  CRM_THREAD_WORKFLOW_LABELS,
};

export function formatCurrency(amount: number | null | undefined, currency = "USD") {
  if (amount == null) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

export function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
}

export function formatDateTime(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString();
}

/** Shared by server + client — keep out of `"use client"` modules. */
export function temperatureTone(
  t: string,
): "cold" | "warm" | "hot" | "neutral" {
  if (t === "COLD") return "cold";
  if (t === "WARM") return "warm";
  if (t === "HOT") return "hot";
  return "neutral";
}
