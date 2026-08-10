import { z } from "zod";

export const proposalPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

const proposalStatusSchema = z.enum([
  "DRAFT",
  "INTERNAL_REVIEW",
  "SENT",
  "CHANGES_REQUESTED",
  "ACCEPTED",
  "DECLINED",
  "EXPIRED",
  "ARCHIVED",
]);

const proposalLineItemTypeSchema = z.enum(["SERVICE", "ADD_ON", "DISCOUNT", "OTHER"]);
const proposalClientRoleSchema = z.enum(["VIEWER", "DECISION_MAKER"]);
const proposalSectionTypeSchema = z.enum([
  "OVERVIEW",
  "GOALS",
  "SCOPE",
  "DELIVERABLES",
  "TIMELINE",
  "PRICING",
  "ASSUMPTIONS",
  "EXCLUSIONS",
  "REVISION_POLICY",
  "NEXT_STEPS",
  "CLIENT_RESPONSIBILITIES",
]);

export const proposalFiltersSchema = z.object({
  status: proposalStatusSchema.optional(),
  ownerId: z.string().cuid().optional().or(z.literal("")),
  companyId: z.string().cuid().optional().or(z.literal("")),
  dealId: z.string().cuid().optional().or(z.literal("")),
  q: z.string().max(200).optional(),
  expired: z.enum(["true", "false"]).optional(),
});

export const createProposalSchema = z.object({
  title: z.string().trim().min(1).max(300),
  primaryContactId: z.string().cuid(),
  companyId: z.string().cuid().optional().or(z.literal("")),
  dealId: z.string().cuid().optional().or(z.literal("")),
  ownerId: z.string().cuid().optional().or(z.literal("")),
  currency: z.string().trim().min(3).max(3).default("USD"),
  summary: z.string().max(5000).optional().or(z.literal("")),
  internalNotes: z.string().max(10000).optional().or(z.literal("")),
});

export const updateProposalSchema = z.object({
  proposalId: z.string().cuid(),
  title: z.string().trim().min(1).max(300).optional(),
  summary: z.string().max(5000).optional().or(z.literal("")),
  internalNotes: z.string().max(10000).optional().or(z.literal("")),
  ownerId: z.string().cuid().optional().or(z.literal("")),
  expiresAt: z.string().optional().or(z.literal("")),
});

const lineItemSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().trim().min(1).max(300),
  description: z.string().max(5000).optional().or(z.literal("")),
  quantity: z.coerce.number().min(0).max(99999),
  unitPrice: z.coerce.number(),
  type: proposalLineItemTypeSchema.default("SERVICE"),
  isOptional: z.coerce.boolean().default(false),
  isSelectedByDefault: z.coerce.boolean().default(false),
  position: z.coerce.number().int().min(0),
});

const scopeItemSchema = z.object({
  id: z.string().cuid().optional(),
  title: z.string().trim().min(1).max(300),
  description: z.string().max(5000).optional().or(z.literal("")),
  position: z.coerce.number().int().min(0),
  included: z.coerce.boolean().default(true),
  clientVisible: z.coerce.boolean().default(true),
});

const deliverableItemSchema = z.object({
  id: z.string().cuid().optional(),
  title: z.string().trim().min(1).max(300),
  description: z.string().max(5000).optional().or(z.literal("")),
  quantity: z.coerce.number().int().min(1).max(9999).default(1),
  position: z.coerce.number().int().min(0),
});

const sectionSchema = z.object({
  id: z.string().cuid().optional(),
  sectionType: proposalSectionTypeSchema,
  title: z.string().trim().min(1).max(300),
  body: z.string().max(20000).optional().or(z.literal("")),
  position: z.coerce.number().int().min(0),
});

export const saveProposalVersionSchema = z.object({
  proposalId: z.string().cuid(),
  versionId: z.string().cuid().optional(),
  title: z.string().trim().min(1).max(300),
  intro: z.string().max(20000).optional().or(z.literal("")),
  scopeSummary: z.string().max(20000).optional().or(z.literal("")),
  timelineSummary: z.string().max(5000).optional().or(z.literal("")),
  estimatedStart: z.string().optional().or(z.literal("")),
  estimatedDuration: z.string().max(200).optional().or(z.literal("")),
  assumptionsText: z.string().max(20000).optional().or(z.literal("")),
  exclusionsText: z.string().max(20000).optional().or(z.literal("")),
  revisionPolicy: z.string().max(10000).optional().or(z.literal("")),
  validUntil: z.string().optional().or(z.literal("")),
  discountAmount: z.coerce.number().optional(),
  taxAmount: z.coerce.number().optional(),
  lineItems: z.array(lineItemSchema).default([]),
  scopeItems: z.array(scopeItemSchema).default([]),
  deliverables: z.array(deliverableItemSchema).default([]),
  sections: z.array(sectionSchema).default([]),
});

export const sendProposalSchema = z.object({
  proposalId: z.string().cuid(),
  versionId: z.string().cuid().optional(),
  contactIds: z.array(z.string().cuid()).min(1),
  decisionMakerContactId: z.string().cuid(),
});

export const createProposalVersionSchema = z.object({
  proposalId: z.string().cuid(),
  sourceVersionId: z.string().cuid().optional(),
});

export const grantProposalAccessSchema = z.object({
  proposalId: z.string().cuid(),
  contactId: z.string().cuid(),
  role: proposalClientRoleSchema.default("VIEWER"),
});

export const revokeProposalAccessSchema = z.object({
  proposalId: z.string().cuid(),
  contactId: z.string().cuid(),
});

export const proposalStatusActionSchema = z.object({
  proposalId: z.string().cuid(),
});

export const convertAcceptedProposalSchema = z.object({
  proposalId: z.string().cuid(),
  name: z.string().trim().min(1).max(300).optional(),
  templateId: z.string().cuid().optional().or(z.literal("")),
  grantProjectAccessContactIds: z.array(z.string().cuid()).optional(),
});

export const clientAcceptProposalSchema = z.object({
  proposalId: z.string().cuid(),
  selectedOptionalItemIds: z.array(z.string().cuid()).default([]),
  termsAcknowledged: z.literal(true),
});

export const clientDeclineProposalSchema = z.object({
  proposalId: z.string().cuid(),
  comment: z.string().trim().max(5000).optional().or(z.literal("")),
});

export const clientRequestChangesSchema = z.object({
  proposalId: z.string().cuid(),
  comment: z.string().trim().min(1).max(5000),
});

export type ProposalFilters = z.infer<typeof proposalFiltersSchema>;
