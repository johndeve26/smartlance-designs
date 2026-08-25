import { z } from "zod";
import type {
  CrmContactEmailStatus,
  CrmContactLifecycleStage,
  CrmContactSource,
  CrmDealStage,
  CrmLeadDisqualificationReason,
  CrmLeadStatus,
  CrmLeadTemperature,
  CrmTaskPriority,
  CrmTaskStatus,
} from "@prisma/client";

export const crmPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const createContactSchema = z
  .object({
    firstName: z.string().trim().max(120).optional().or(z.literal("")),
    lastName: z.string().trim().max(120).optional().or(z.literal("")),
    displayName: z.string().trim().max(200).optional().or(z.literal("")),
    email: z.string().trim().email().max(254).optional().or(z.literal("")),
    phone: z.string().trim().max(40).optional().or(z.literal("")),
    jobTitle: z.string().trim().max(120).optional().or(z.literal("")),
    companyId: z.string().cuid().optional().or(z.literal("")),
    lifecycleStage: z
      .enum([
        "PROSPECT",
        "LEAD",
        "OPPORTUNITY",
        "CLIENT",
        "PAST_CLIENT",
        "OTHER",
      ])
      .default("PROSPECT"),
    source: z
      .enum([
        "MANUAL",
        "CONTACT_FORM",
        "WEBSITE_REVIEW",
        "PROJECT_PLANNER",
        "REFERRAL",
        "INBOUND_EMAIL",
        "OUTBOUND",
        "UPWORK",
        "SOCIAL",
        "OTHER",
      ])
      .default("MANUAL"),
    sourceDetail: z.string().trim().max(200).optional().or(z.literal("")),
    sourceUrl: z.string().trim().max(500).optional().or(z.literal("")),
    ownerId: z.string().cuid().optional().or(z.literal("")),
  })
  .refine(
    (data) =>
      Boolean(
        data.displayName?.trim() ||
          data.firstName?.trim() ||
          data.lastName?.trim() ||
          data.email?.trim() ||
          data.phone?.trim(),
      ),
    { message: "Provide a name, email, or phone." },
  );

export const updateContactSchema = z.object({
  contactId: z.string().cuid(),
  firstName: z.string().trim().max(120).optional().or(z.literal("")),
  lastName: z.string().trim().max(120).optional().or(z.literal("")),
  displayName: z.string().trim().max(200).optional().or(z.literal("")),
  email: z.string().trim().email().max(254).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  jobTitle: z.string().trim().max(120).optional().or(z.literal("")),
  companyId: z.string().cuid().optional().or(z.literal("")),
  source: z.enum([
    "MANUAL",
    "CONTACT_FORM",
    "WEBSITE_REVIEW",
    "PROJECT_PLANNER",
    "REFERRAL",
    "INBOUND_EMAIL",
    "OUTBOUND",
    "UPWORK",
    "SOCIAL",
    "OTHER",
  ]).optional(),
  sourceDetail: z.string().trim().max(200).optional().or(z.literal("")),
  ownerId: z.string().cuid().optional().or(z.literal("")),
  countryCode: z.string().trim().max(2).optional().or(z.literal("")),
  countryName: z.string().trim().max(120).optional().or(z.literal("")),
  stateRegion: z.string().trim().max(120).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  postalCode: z.string().trim().max(20).optional().or(z.literal("")),
  timezone: z.string().trim().max(64).optional().or(z.literal("")),
});

export const createCompanySchema = z.object({
  name: z.string().trim().min(1).max(200),
  website: z.string().trim().max(500).optional().or(z.literal("")),
  industry: z.string().trim().max(120).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  location: z.string().trim().max(200).optional().or(z.literal("")),
  address: z.string().trim().max(1000).optional().or(z.literal("")),
  sizeLabel: z.string().trim().max(80).optional().or(z.literal("")),
  description: z.string().trim().max(8000).optional().or(z.literal("")),
  ownerId: z.string().cuid().optional().or(z.literal("")),
});

export const createLeadSchema = z.object({
  contactId: z.string().cuid(),
  companyId: z.string().cuid().optional().or(z.literal("")),
  status: z
    .enum([
      "NEW",
      "ATTEMPTING",
      "CONNECTED",
      "QUALIFIED",
      "UNQUALIFIED",
      "BAD_TIMING",
      "CLOSED",
    ])
    .default("NEW"),
  temperature: z.enum(["COLD", "WARM", "HOT"]).default("COLD"),
  source: z.enum([
    "MANUAL",
    "CONTACT_FORM",
    "WEBSITE_REVIEW",
    "PROJECT_PLANNER",
    "REFERRAL",
    "INBOUND_EMAIL",
    "OUTBOUND",
    "UPWORK",
    "SOCIAL",
    "OTHER",
  ]),
  ownerId: z.string().cuid().optional().or(z.literal("")),
  interestSummary: z.string().trim().max(8000).optional().or(z.literal("")),
  servicesInterested: z.array(z.string().trim().max(120)).max(20).default([]),
  estimatedValue: z.coerce.number().min(0).optional(),
  currency: z.string().trim().max(8).default("USD"),
});

export const updateLeadStatusSchema = z.object({
  leadId: z.string().cuid(),
  status: z.enum([
    "NEW",
    "ATTEMPTING",
    "CONNECTED",
    "QUALIFIED",
    "UNQUALIFIED",
    "BAD_TIMING",
    "CLOSED",
  ]),
  disqualificationReason: z
    .enum([
      "NO_BUDGET",
      "NOT_A_FIT",
      "NO_RESPONSE",
      "BAD_TIMING",
      "DUPLICATE",
      "SPAM",
      "OTHER",
    ])
    .optional(),
  disqualificationNote: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const updateLeadTemperatureSchema = z.object({
  leadId: z.string().cuid(),
  temperature: z.enum(["COLD", "WARM", "HOT"]),
});

export const createDealSchema = z.object({
  title: z.string().trim().min(1).max(200),
  contactId: z.string().cuid(),
  companyId: z.string().cuid().optional().or(z.literal("")),
  leadId: z.string().cuid().optional().or(z.literal("")),
  ownerId: z.string().cuid().optional().or(z.literal("")),
  stage: z
    .enum([
      "NEW_OPPORTUNITY",
      "DISCOVERY",
      "QUALIFIED",
      "PROPOSAL",
      "NEGOTIATION",
      "WON",
      "LOST",
    ])
    .default("NEW_OPPORTUNITY"),
  amount: z.coerce.number().min(0).optional(),
  currency: z.string().trim().max(8).default("USD"),
  expectedCloseAt: z.coerce.date().optional(),
  servicesInterested: z.array(z.string().trim().max(120)).max(20).default([]),
});

export const updateDealStageSchema = z.object({
  dealId: z.string().cuid(),
  stage: z.enum([
    "NEW_OPPORTUNITY",
    "DISCOVERY",
    "QUALIFIED",
    "PROPOSAL",
    "NEGOTIATION",
    "WON",
    "LOST",
  ]),
  lostReason: z
    .enum([
      "PRICE",
      "NO_RESPONSE",
      "COMPETITOR",
      "TIMING",
      "INTERNAL_DECISION",
      "NOT_A_FIT",
      "OTHER",
    ])
    .optional(),
  lostNote: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(8000).optional().or(z.literal("")),
  contactId: z.string().cuid().optional().or(z.literal("")),
  companyId: z.string().cuid().optional().or(z.literal("")),
  leadId: z.string().cuid().optional().or(z.literal("")),
  dealId: z.string().cuid().optional().or(z.literal("")),
  assignedToId: z.string().cuid().optional().or(z.literal("")),
  priority: z.enum(["LOW", "NORMAL", "HIGH"]).default("NORMAL"),
  dueAt: z.coerce.date().optional(),
});

export const addNoteSchema = z.object({
  contactId: z.string().cuid(),
  subject: z.string().trim().max(200).optional().or(z.literal("")),
  body: z.string().trim().min(1).max(8000),
  leadId: z.string().cuid().optional().or(z.literal("")),
  dealId: z.string().cuid().optional().or(z.literal("")),
});

export const updateEmailStatusSchema = z.object({
  contactId: z.string().cuid(),
  emailStatus: z.enum([
    "SENDABLE",
    "DO_NOT_EMAIL",
    "UNSUBSCRIBED",
    "BOUNCED",
    "COMPLAINED",
    "INVALID",
    "SUPPRESSED",
  ]),
});

export const sendCrmEmailSchema = z.object({
  contactId: z.string().cuid(),
  dealId: z.string().cuid().optional().or(z.literal("")),
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(50000),
  createFollowUpDays: z.coerce.number().int().min(1).max(90).optional(),
  sendingProfileId: z.string().cuid().optional().or(z.literal("")),
  clientRequestId: z.string().uuid().optional().or(z.literal("")),
});

export const emailTemplateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(50000),
  category: z.string().trim().max(80).optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export type CrmContactFilters = {
  q?: string;
  lifecycle?: CrmContactLifecycleStage;
  leadStatus?: CrmLeadStatus;
  temperature?: CrmLeadTemperature;
  source?: CrmContactSource;
  ownerId?: string;
  emailStatus?: CrmContactEmailStatus;
  companyId?: string;
  countryCode?: string;
  hasOpenTask?: boolean;
  overdueFollowUp?: boolean;
  viewId?: string;
  advancedFilter?: import("@/lib/crm/filters/contact-filter-schema").ContactFilterV3;
  sortField?: "name" | "company" | "createdAt" | "lastContactedAt" | "nextActivityAt" | "countryCode" | "lifecycleStage";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

export type CrmLeadFilters = {
  q?: string;
  status?: CrmLeadStatus;
  temperature?: CrmLeadTemperature;
  source?: CrmContactSource;
  ownerId?: string;
  noFollowUp?: boolean;
  overdue?: boolean;
  page?: number;
  pageSize?: number;
};

export type CrmDealFilters = {
  q?: string;
  stage?: CrmDealStage;
  ownerId?: string;
  page?: number;
  pageSize?: number;
};

export type CrmTaskFilters = {
  view?: "today" | "upcoming" | "overdue" | "completed" | "mine" | "all";
  assignedToId?: string;
  page?: number;
  pageSize?: number;
};

export type CrmCompanyFilters = {
  q?: string;
  ownerId?: string;
  page?: number;
  pageSize?: number;
};

export {
  type CrmContactLifecycleStage,
  type CrmContactSource,
  type CrmContactEmailStatus,
  type CrmLeadStatus,
  type CrmLeadTemperature,
  type CrmLeadDisqualificationReason,
  type CrmDealStage,
  type CrmTaskStatus,
  type CrmTaskPriority,
};
