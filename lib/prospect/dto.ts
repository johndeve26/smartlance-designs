import type {
  AgencyProspectRequestStatus,
  AgencyWebsiteBriefStatus,
  AgencyWebsiteReviewOverallDirection,
  AgencyWebsiteReviewStatus,
} from "@prisma/client";

export type ProspectReviewListItemDto = {
  id: string;
  websiteUrl: string;
  normalizedDomain: string;
  businessName: string | null;
  status: AgencyWebsiteReviewStatus;
  statusLabel: string;
  overallDirection: AgencyWebsiteReviewOverallDirection | null;
  overallDirectionLabel: string | null;
  completedAt: string | null;
  createdAt: string;
};

export type ProspectReviewEvidenceDto = {
  id: string;
  category: string;
  type: string;
  label: string;
  valueText: string | null;
  valueNumber: number | null;
  booleanValue: boolean | null;
  sourceUrl: string | null;
  excerpt: string | null;
};

export type ProspectReviewFindingDto = {
  id: string;
  category: string;
  severity: string;
  title: string;
  explanation: string;
  recommendation: string | null;
  confidence: string;
  isPriority: boolean;
  isStrength: boolean;
  evidenceIds: string[];
};

export type ProspectReviewDetailDto = ProspectReviewListItemDto & {
  summary: string | null;
  aiFailedMessage: string | null;
  goals: string[];
  strengths: ProspectReviewFindingDto[];
  priorities: ProspectReviewFindingDto[];
  findings: ProspectReviewFindingDto[];
  evidence: ProspectReviewEvidenceDto[];
  reviewedOn: string | null;
};

export type ProspectBriefListItemDto = {
  id: string;
  title: string;
  projectType: string | null;
  status: AgencyWebsiteBriefStatus;
  completionPercent: number;
  completedSectionCount: number;
  totalSectionCount: number;
  sourceReviewId: string | null;
  updatedAt: string;
  submittedAt: string | null;
};

export type ProspectBriefDetailDto = ProspectBriefListItemDto & {
  answers: Record<string, string | string[]>;
  completedSectionIds: string[];
  sourceReviewId: string | null;
};

export type ProspectRequestListItemDto = {
  id: string;
  requestNumber: string;
  title: string;
  projectType: string | null;
  status: AgencyProspectRequestStatus;
  statusLabel: string;
  submittedAt: string;
  updatedAt: string;
};

export type ProspectRequestMessageDto = {
  id: string;
  authorType: "PORTAL_USER" | "SMARTLANCE";
  body: string;
  createdAt: string;
};

export type ProspectRequestDetailDto = ProspectRequestListItemDto & {
  statusCopy: string;
  briefSnapshot: Record<string, unknown>;
  reviewSnapshot: Record<string, unknown> | null;
  messages: ProspectRequestMessageDto[];
  timeline: Array<{ type: string; summary: string; createdAt: string }>;
  linkedProposalId: string | null;
};

export type ProspectHomeDto = {
  firstName: string | null;
  continueReview: ProspectReviewListItemDto | null;
  continueBrief: ProspectBriefListItemDto | null;
  activeRequest: ProspectRequestListItemDto | null;
  proposalReady: Array<{ proposalId: string; title: string; requestId: string | null }>;
  hasClientAccess: boolean;
  recentReviews: ProspectReviewListItemDto[];
  recentBriefs: ProspectBriefListItemDto[];
};

export type ProspectProfileDto = {
  firstName: string | null;
  lastName: string | null;
  email: string;
  companyName: string | null;
  phone: string | null;
  primaryWebsite: string | null;
};
