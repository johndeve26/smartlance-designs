import { z } from "zod";

export const agencyPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

const agencyServiceTypeSchema = z.enum([
  "WEBSITE_DESIGN",
  "WEBSITE_REDESIGN",
  "LANDING_PAGE",
  "ECOMMERCE",
  "SEO",
  "BRANDING",
  "WEBSITE_MAINTENANCE",
  "DIGITAL_STRATEGY",
  "OTHER",
]);

const agencyProjectStatusSchema = z.enum([
  "PLANNING",
  "ONBOARDING",
  "IN_PROGRESS",
  "CLIENT_REVIEW",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
]);

const agencyProjectHealthSchema = z.enum(["ON_TRACK", "AT_RISK", "BLOCKED"]);

const agencyMemberRoleSchema = z.enum(["OWNER", "MEMBER", "VIEWER"]);

const agencyMilestoneStatusSchema = z.enum([
  "NOT_STARTED",
  "IN_PROGRESS",
  "BLOCKED",
  "CLIENT_REVIEW",
  "COMPLETED",
]);

const agencyTaskStatusSchema = z.enum([
  "TODO",
  "IN_PROGRESS",
  "BLOCKED",
  "REVIEW",
  "DONE",
]);

const agencyTaskPrioritySchema = z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]);

const agencyRequirementTypeSchema = z.enum([
  "CONTENT",
  "BRAND_ASSET",
  "ACCESS",
  "APPROVAL",
  "INFORMATION",
  "OTHER",
]);

const agencyDeliverableTypeSchema = z.enum([
  "DESIGN",
  "DOCUMENT",
  "WEBSITE_PREVIEW",
  "COPY",
  "REPORT",
  "BRAND_ASSET",
  "OTHER",
]);

const agencyClientRoleSchema = z.enum([
  "CLIENT_ADMIN",
  "CLIENT_MEMBER",
  "VIEWER",
]);

export const agencyProjectFiltersSchema = z.object({
  status: agencyProjectStatusSchema.optional(),
  health: agencyProjectHealthSchema.optional(),
  ownerId: z.string().cuid().optional().or(z.literal("")),
  serviceType: agencyServiceTypeSchema.optional(),
  q: z.string().trim().max(200).optional().or(z.literal("")),
});

export const createAgencyProjectSchema = z.object({
  name: z.string().trim().min(1).max(200),
  primaryContactId: z.string().cuid(),
  clientCompanyId: z.string().cuid().optional().or(z.literal("")),
  serviceType: agencyServiceTypeSchema,
  customServiceName: z.string().trim().max(200).optional().or(z.literal("")),
  cmsServiceSlug: z.string().trim().max(120).optional().or(z.literal("")),
  ownerId: z.string().cuid().optional().or(z.literal("")),
  startDate: z.coerce.date().optional(),
  targetDueDate: z.coerce.date().optional(),
  budgetSnapshot: z.coerce.number().min(0).optional(),
  currency: z.string().trim().max(8).default("USD"),
  summary: z.string().trim().max(8000).optional().or(z.literal("")),
  internalNotes: z.string().trim().max(8000).optional().or(z.literal("")),
  clientVisibilityEnabled: z.coerce.boolean().default(true),
  caseStudyCandidate: z.coerce.boolean().default(false),
  templateId: z.string().cuid().optional().or(z.literal("")),
});

export const updateAgencyProjectSchema = z.object({
  projectId: z.string().cuid(),
  name: z.string().trim().min(1).max(200).optional(),
  clientCompanyId: z.string().cuid().optional().or(z.literal("")),
  primaryContactId: z.string().cuid().optional(),
  serviceType: agencyServiceTypeSchema.optional(),
  customServiceName: z.string().trim().max(200).optional().or(z.literal("")),
  cmsServiceSlug: z.string().trim().max(120).optional().or(z.literal("")),
  ownerId: z.string().cuid().optional().or(z.literal("")),
  health: agencyProjectHealthSchema.optional(),
  startDate: z.coerce.date().nullable().optional(),
  targetDueDate: z.coerce.date().nullable().optional(),
  budgetSnapshot: z.coerce.number().min(0).nullable().optional(),
  currency: z.string().trim().max(8).optional(),
  summary: z.string().trim().max(8000).optional().or(z.literal("")),
  internalNotes: z.string().trim().max(8000).optional().or(z.literal("")),
  clientVisibilityEnabled: z.coerce.boolean().optional(),
  caseStudyCandidate: z.coerce.boolean().optional(),
});

export const agencyProjectStatusActionSchema = z.object({
  projectId: z.string().cuid(),
});

export const addAgencyProjectMemberSchema = z.object({
  projectId: z.string().cuid(),
  userId: z.string().cuid(),
  role: agencyMemberRoleSchema.default("MEMBER"),
});

export const convertWonDealSchema = z.object({
  dealId: z.string().cuid(),
  name: z.string().trim().min(1).max(200).optional(),
  serviceType: agencyServiceTypeSchema.optional(),
  ownerId: z.string().cuid().optional().or(z.literal("")),
  templateId: z.string().cuid().optional().or(z.literal("")),
});

export const createAgencyTemplateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(8000).optional().or(z.literal("")),
  serviceType: agencyServiceTypeSchema,
});

export const updateAgencyTemplateSchema = z.object({
  templateId: z.string().cuid(),
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(8000).optional().or(z.literal("")),
  serviceType: agencyServiceTypeSchema.optional(),
  isArchived: z.coerce.boolean().optional(),
});

export const instantiateTemplateSchema = z.object({
  projectId: z.string().cuid(),
  templateId: z.string().cuid(),
});

export const updateAgencyMilestoneSchema = z.object({
  milestoneId: z.string().cuid(),
  status: agencyMilestoneStatusSchema.optional(),
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(8000).optional().or(z.literal("")),
  startDate: z.coerce.date().nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  clientVisible: z.coerce.boolean().optional(),
});

export const reorderAgencyMilestonesSchema = z.object({
  projectId: z.string().cuid(),
  milestoneIds: z.array(z.string().cuid()).min(1),
});

export const createAgencyTaskSchema = z.object({
  projectId: z.string().cuid(),
  milestoneId: z.string().cuid().optional().or(z.literal("")),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(8000).optional().or(z.literal("")),
  priority: agencyTaskPrioritySchema.default("NORMAL"),
  assigneeId: z.string().cuid().optional().or(z.literal("")),
  startDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  clientVisible: z.coerce.boolean().default(false),
});

export const updateAgencyTaskSchema = z.object({
  taskId: z.string().cuid(),
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(8000).optional().or(z.literal("")),
  status: agencyTaskStatusSchema.optional(),
  priority: agencyTaskPrioritySchema.optional(),
  assigneeId: z.string().cuid().optional().or(z.literal("")),
  milestoneId: z.string().cuid().optional().or(z.literal("")),
  startDate: z.coerce.date().nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  clientVisible: z.coerce.boolean().optional(),
  blockedReason: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const completeAgencyTaskSchema = z.object({
  taskId: z.string().cuid(),
});

export const createAgencyRequirementSchema = z.object({
  projectId: z.string().cuid(),
  milestoneId: z.string().cuid().optional().or(z.literal("")),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(8000).optional().or(z.literal("")),
  type: agencyRequirementTypeSchema.default("OTHER"),
  dueDate: z.coerce.date().optional(),
  clientVisible: z.coerce.boolean().default(true),
});

export const markRequirementReceivedSchema = z.object({
  requirementId: z.string().cuid(),
});

export const createAgencyDeliverableSchema = z.object({
  projectId: z.string().cuid(),
  milestoneId: z.string().cuid().optional().or(z.literal("")),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(8000).optional().or(z.literal("")),
  type: agencyDeliverableTypeSchema.default("OTHER"),
  clientVisible: z.coerce.boolean().default(true),
});

export const addDeliverableVersionSchema = z.object({
  deliverableId: z.string().cuid(),
  externalUrl: z.string().trim().url().max(2000).optional().or(z.literal("")),
  notes: z.string().trim().max(8000).optional().or(z.literal("")),
});

export const submitDeliverableForReviewSchema = z.object({
  deliverableId: z.string().cuid(),
  versionId: z.string().cuid(),
});

export const adminApproveDeliverableSchema = z.object({
  deliverableId: z.string().cuid(),
  versionId: z.string().cuid(),
  comment: z.string().trim().max(8000).optional().or(z.literal("")),
});

export const portalReviewDeliverableSchema = z.object({
  deliverableId: z.string().cuid(),
  versionId: z.string().cuid(),
  comment: z.string().trim().max(8000).optional().or(z.literal("")),
});

export const createPortalInviteSchema = z.object({
  contactId: z.string().cuid(),
  projectId: z.string().cuid().optional().or(z.literal("")),
  role: agencyClientRoleSchema.default("CLIENT_MEMBER"),
});

export const acceptPortalInviteSchema = z.object({
  token: z.string().trim().min(16).max(512),
});

export const revokePortalAccessSchema = z.object({
  projectId: z.string().cuid(),
  contactId: z.string().cuid(),
});

export type AgencyProjectFilters = z.infer<typeof agencyProjectFiltersSchema>;
