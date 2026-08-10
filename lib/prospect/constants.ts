import type {
  AgencyProspectRequestStatus,
  AgencyWebsiteReviewOverallDirection,
  AgencyWebsiteReviewStatus,
} from "@prisma/client";

export const PROSPECT_REVIEW_PROMPT_VERSION = "prospect-review-v1";
export const PROSPECT_BRIEF_PROMPT_VERSION = "prospect-brief-v2";
export const PROSPECT_HANDOFF_PROMPT_VERSION = "prospect-handoff-v1";

export const PROSPECT_BRIEF_SCHEMA_VERSION = 1;
export const PROSPECT_BRIEF_TEMPLATE_SLUG = "website-project-brief-template";
export const PROSPECT_BRIEF_STORAGE_KEY =
  "smartlance.template.website-project-brief-template";

export const REVIEW_MAX_PAGES = 5;
export const REVIEW_MAX_REDIRECTS = 5;
export const REVIEW_FETCH_TIMEOUT_MS = 30_000;
export const REVIEW_MAX_BYTES = 2_097_152;

export const REVIEW_CATEGORIES = [
  "Clarity & Messaging",
  "Conversion",
  "Trust & Credibility",
  "Mobile Foundations",
  "SEO Foundations",
  "Content Structure",
  "Technical Foundations",
  "Performance",
  "Accessibility Foundations",
] as const;

export const REVIEW_STATUS_LABELS: Record<AgencyWebsiteReviewStatus, string> = {
  PENDING: "Pending",
  FETCHING: "Checking your website",
  ANALYZING: "Preparing recommendations",
  COMPLETED: "Completed",
  FAILED: "Could not complete",
};

export const REVIEW_DIRECTION_LABELS: Record<
  AgencyWebsiteReviewOverallDirection,
  string
> = {
  STRONG_FOUNDATION: "Strong foundation",
  FOCUSED_IMPROVEMENTS: "Focused improvements recommended",
  SIGNIFICANT_OPPORTUNITY: "Significant opportunity",
  INSUFFICIENT_DATA: "Insufficient data",
};

export const REQUEST_STATUS_LABELS: Record<AgencyProspectRequestStatus, string> =
  {
    SUBMITTED: "Received",
    BEING_REVIEWED: "Being reviewed",
    NEEDS_INFORMATION: "We need a little more information",
    PROPOSAL_READY: "Your proposal is ready",
    CLOSED: "Closed",
  };

export const REQUEST_STATUS_COPY: Record<
  AgencyProspectRequestStatus,
  string
> = {
  SUBMITTED: "Smartlance has received your project details.",
  BEING_REVIEWED: "Smartlance is reviewing the information you provided.",
  NEEDS_INFORMATION:
    "Smartlance needs a little more information before preparing a proposal.",
  PROPOSAL_READY: "Smartlance has prepared a proposal based on your project details.",
  CLOSED: "This request has been closed.",
};

export const REVIEW_GOAL_OPTIONS = [
  { value: "enquiries", label: "Generate more enquiries" },
  { value: "sales", label: "Increase sales" },
  { value: "credibility", label: "Improve credibility" },
  { value: "search", label: "Improve search visibility" },
  { value: "mobile", label: "Improve mobile experience" },
  { value: "modernize", label: "Modernize the website" },
  { value: "performance", label: "Improve performance" },
  { value: "not-sure", label: "Not sure" },
] as const;
