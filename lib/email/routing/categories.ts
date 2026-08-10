import type { EmailRouteCategory } from "@prisma/client";

export const EMAIL_ROUTE_CATEGORIES: EmailRouteCategory[] = [
  "AUTH_MAGIC_LINK",
  "PROSPECT_GENERAL",
  "PROSPECT_REQUEST",
  "PROSPECT_CLARIFICATION",
  "CRM_MANUAL",
  "CRM_SEQUENCE",
  "CRM_INBOUND_REPLY",
  "PROPOSAL",
  "CONTRACT",
  "PROJECT",
  "ONBOARDING",
  "CHANGE_REQUEST",
  "INVOICE",
  "PAYMENT_CONFIRMATION",
  "SUPPORT",
  "GENERAL_SYSTEM",
];

export const EMAIL_ROUTE_LABELS: Record<EmailRouteCategory, string> = {
  AUTH_MAGIC_LINK: "Magic Links",
  PROSPECT_GENERAL: "Prospect General",
  PROSPECT_REQUEST: "Prospect Requests",
  PROSPECT_CLARIFICATION: "Prospect Clarifications",
  CRM_MANUAL: "CRM Manual Email",
  CRM_SEQUENCE: "CRM Sequences",
  CRM_INBOUND_REPLY: "Sales Inbox Replies",
  PROPOSAL: "Proposals",
  CONTRACT: "Contracts",
  PROJECT: "Projects",
  ONBOARDING: "Onboarding",
  CHANGE_REQUEST: "Change Requests",
  INVOICE: "Invoices",
  PAYMENT_CONFIRMATION: "Payment Confirmations",
  SUPPORT: "Support",
  GENERAL_SYSTEM: "General System",
};

export const EMAIL_ROUTE_SUGGESTED_PROFILE_SLUGS: Partial<
  Record<EmailRouteCategory, string>
> = {
  AUTH_MAGIC_LINK: "general",
  PROSPECT_GENERAL: "sales",
  PROSPECT_REQUEST: "sales",
  PROSPECT_CLARIFICATION: "sales",
  CRM_MANUAL: "sales",
  CRM_SEQUENCE: "sales",
  PROPOSAL: "sales",
  CONTRACT: "projects",
  PROJECT: "projects",
  ONBOARDING: "projects",
  CHANGE_REQUEST: "projects",
  INVOICE: "billing",
  PAYMENT_CONFIRMATION: "billing",
  SUPPORT: "support",
};

export function isEmailRouteCategory(value: string): value is EmailRouteCategory {
  return (EMAIL_ROUTE_CATEGORIES as readonly string[]).includes(value);
}
