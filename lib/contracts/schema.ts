import { z } from "zod";

export const contractPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

const contractStatusSchema = z.enum([
  "DRAFT",
  "READY_FOR_REVIEW",
  "SENT",
  "PARTIALLY_SIGNED",
  "SIGNED",
  "CORRECTION_REQUESTED",
  "DECLINED",
  "EXPIRED",
  "VOIDED",
  "ARCHIVED",
]);

const contractTypeSchema = z.enum(["SERVICE_AGREEMENT", "NDA", "MAINTENANCE", "OTHER"]);

export const contractFiltersSchema = z.object({
  status: contractStatusSchema.optional(),
  ownerId: z.string().cuid().optional().or(z.literal("")),
  companyId: z.string().cuid().optional().or(z.literal("")),
  proposalId: z.string().cuid().optional().or(z.literal("")),
  projectId: z.string().cuid().optional().or(z.literal("")),
  q: z.string().max(200).optional(),
});

export const createContractFromAcceptanceSchema = z.object({
  proposalId: z.string().cuid(),
  templateVersionId: z.string().cuid().optional().or(z.literal("")),
  title: z.string().trim().min(1).max(300).optional(),
  contractType: contractTypeSchema.default("SERVICE_AGREEMENT"),
  clientSignerContactId: z.string().cuid(),
  agencySignerRequired: z.coerce.boolean().default(false),
  expiresAt: z.string().optional().or(z.literal("")),
});

export const createManualContractSchema = z.object({
  title: z.string().trim().min(1).max(300),
  primaryContactId: z.string().cuid().optional().or(z.literal("")),
  companyId: z.string().cuid().optional().or(z.literal("")),
  templateVersionId: z.string().cuid().optional().or(z.literal("")),
  contractType: contractTypeSchema.default("SERVICE_AGREEMENT"),
  content: z.string().max(200_000).optional(),
});

export const saveContractVersionSchema = z.object({
  contractId: z.string().cuid(),
  versionId: z.string().cuid(),
  title: z.string().trim().min(1).max(300),
  content: z.string().min(1).max(200_000),
});

export const sendContractSchema = z.object({
  contractId: z.string().cuid(),
  versionId: z.string().cuid().optional(),
});

export const voidContractSchema = z.object({
  contractId: z.string().cuid(),
  reason: z.string().trim().min(1).max(5000),
});

export const createContractVersionSchema = z.object({
  contractId: z.string().cuid(),
  sourceVersionId: z.string().cuid().optional(),
});

export const createContractTemplateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().max(5000).optional().or(z.literal("")),
  content: z.string().min(1).max(200_000),
});

export const clientSignContractSchema = z.object({
  contractId: z.string().cuid(),
  consentAcknowledged: z.literal(true),
  typedSignatureName: z.string().trim().min(2).max(200),
  signerTitle: z.string().trim().max(200).optional().or(z.literal("")),
});

export const clientDeclineContractSchema = z.object({
  contractId: z.string().cuid(),
  comment: z.string().trim().max(5000).optional().or(z.literal("")),
});

export const clientRequestContractCorrectionSchema = z.object({
  contractId: z.string().cuid(),
  comment: z.string().trim().min(1).max(5000),
});

export const adminSignContractSchema = z.object({
  contractId: z.string().cuid(),
  consentAcknowledged: z.literal(true),
  typedSignatureName: z.string().trim().min(2).max(200),
  signerTitle: z.string().trim().max(200).optional().or(z.literal("")),
});

export type ContractFilters = z.infer<typeof contractFiltersSchema>;
