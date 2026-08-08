/**
 * AI Content Assistants — shared types (Phase A + B).
 */

import type { AIContentEntityType } from "@prisma/client";
import type { z } from "zod";
import type { ImprovementResultMode } from "@/lib/ai/content-assistants/improvement-result";

export type { ImprovementResultMode };

export type ContentAssistantEntityType = Extract<
  AIContentEntityType,
  | "SERVICE"
  | "SOLUTION"
  | "PLATFORM"
  | "INDUSTRY"
  | "WORK"
  | "TESTIMONIAL"
  | "GUIDE"
  | "COMPARISON"
  | "CHECKLIST"
  | "GLOSSARY"
  | "TEMPLATE"
  | "TOOL"
  | "HOMEPAGE"
>;

export type ReviewSeverity = "PASS" | "WARNING" | "REVIEW" | "BLOCKER";

export type ContentClaimKind =
  | "PLATFORM_FEATURE"
  | "PLATFORM_LIMITATION"
  | "PLATFORM_INTEGRATION"
  | "PLATFORM_PRICING"
  | "PLATFORM_AVAILABILITY"
  | "PLATFORM_TECHNICAL_BEHAVIOR"
  | "SMARTLANCE_PLATFORM_EXPERIENCE"
  | "GENERAL_RECOMMENDATION"
  | "INDUSTRY_NEED"
  | "SMARTLANCE_INDUSTRY_EXPERIENCE"
  | "PROJECT_FACT"
  | "PROJECT_SCOPE"
  | "PROJECT_TECHNOLOGY"
  | "PROJECT_DELIVERABLE"
  | "PROJECT_RESULT"
  | "PROJECT_METRIC"
  | "CLIENT_QUOTE"
  | "SMARTLANCE_CLAIM";

export type ContentClaimSupport =
  | "SUPPORTED"
  | "UNSUPPORTED"
  | "NEEDS_REVIEW"
  | "BLOCKED"
  | "VERIFIED"
  | "PARTIAL"
  | "NOT_APPLICABLE";

export type ProposedFieldChange = {
  field: string;
  label: string;
  current: unknown;
  proposed: unknown;
  /** Why this field was proposed */
  reason?: string;
  /** Field-level claim issues that may block acceptance */
  claimBlockers?: string[];
};

export type ProposalResearchSource = {
  url: string;
  title?: string;
  domain?: string;
  sourceType: string;
  checkedAt: string;
  whyUsed?: string;
};

export type ProposalClaim = {
  kind: ContentClaimKind;
  claimText: string;
  support: ContentClaimSupport;
  field?: string;
  evidenceStrength?: "STRONG" | "MODERATE" | "WEAK" | "INSUFFICIENT";
  sourceUrls?: string[];
  checkedAt?: string;
};

export type ProposalPayload = {
  fields: ProposedFieldChange[];
  /** Editorial outcome — no-change / partial / writing-required are valid */
  resultMode?: ImprovementResultMode;
  /** Advisory review findings when action is REVIEW_* */
  reviewFindings?: Array<{
    section: string;
    severity: ReviewSeverity;
    message: string;
  }>;
  suggestedRelations?: Array<{
    kind:
      | "service"
      | "solution"
      | "platform"
      | "work"
      | "resource"
      | "industry"
      | "testimonial";
    id?: string;
    href?: string;
    slug?: string;
    title: string;
    reason?: string;
  }>;
  /** Research provenance for Platform/Industry factual ops */
  research?: {
    performed: boolean;
    required: boolean;
    checkedAt: string;
    sourceCount: number;
    officialOrPrimaryCount: number;
    sources: ProposalResearchSource[];
    factualFreshnessReviewed?: boolean;
  };
  claims?: ProposalClaim[];
  /** Topic Intelligence handoff context (safe editorial summary) */
  opportunityContext?: {
    opportunityId: string;
    whyNow?: string;
    angle?: string;
    market?: string;
  };
};

export type GenerateProposalInput = {
  entityType: ContentAssistantEntityType;
  entityId: string;
  action: string;
  actorId: string;
  customInstructions?: string;
  /** Fields the editor asked to keep unchanged */
  lockedFields?: string[];
  /** Prefer heuristic (tests / offline) */
  forceHeuristic?: boolean;
  /** Optional TI opportunity id for audit/handoff linkage */
  opportunityId?: string;
  /** Injected research for tests */
  researchOverride?: ProposalResearchSource[];
};

export type ContentAssistantModule = {
  entityType: ContentAssistantEntityType;
  displayName: string;
  promptNamespace: string;
  actions: ReadonlyArray<{
    id: string;
    label: string;
    promptVersion: string;
    loadingLabel: string;
    researchPolicy?: "optional" | "recommended" | "required";
  }>;
  fieldAllowlist: ReadonlySet<string>;
  protectedFields: ReadonlySet<string>;
  isFieldMissing: (entity: Record<string, unknown>, field: string) => boolean;
  buildContext: (
    entityId: string,
    opts?: { opportunityId?: string },
  ) => Promise<Record<string, unknown>>;
  generateProposal: (input: {
    entity: Record<string, unknown>;
    action: string;
    context: Record<string, unknown>;
    customInstructions?: string;
    lockedFields: string[];
    forceHeuristic?: boolean;
    researchOverride?: ProposalResearchSource[];
  }) => Promise<{
    payload: ProposalPayload;
    promptVersion: string;
    provider: string;
    model?: string;
    tokenUsageInput?: number;
    tokenUsageOutput?: number;
  }>;
  applyFields: (input: {
    entityId: string;
    fields: Record<string, unknown>;
    actorId: string;
    proposalId: string;
    runId?: string | null;
    proposalPayload?: ProposalPayload;
  }) => Promise<void>;
  loadEntity: (entityId: string) => Promise<{
    entity: Record<string, unknown>;
    updatedAt: Date;
  } | null>;
};

export type StructuredSchema = z.ZodTypeAny;
