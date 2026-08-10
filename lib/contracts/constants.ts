import type { AgencyContractStatus } from "@prisma/client";

export const CONTRACT_PAGE_SIZE_DEFAULT = 25;
export const CONTRACT_PAGE_SIZE_MAX = 100;

export const CONTRACT_STATUS_LABELS: Record<AgencyContractStatus, string> = {
  DRAFT: "Draft",
  READY_FOR_REVIEW: "Ready for review",
  SENT: "Awaiting signature",
  PARTIALLY_SIGNED: "Partially signed",
  SIGNED: "Signed",
  CORRECTION_REQUESTED: "Correction requested",
  DECLINED: "Declined",
  EXPIRED: "Expired",
  VOIDED: "Voided",
  ARCHIVED: "Archived",
};

export const CONTRACT_SIGNABLE_STATUSES = new Set<AgencyContractStatus>([
  "SENT",
  "PARTIALLY_SIGNED",
  "CORRECTION_REQUESTED",
]);

export const CONTRACT_CONSENT_VERSION = "v2.1-consent-1";

export const CONTRACT_CONSENT_TEXT =
  "I have reviewed this contract and intend to sign it electronically. I understand this is not a qualified or certified electronic signature and does not constitute legal advice.";

export const CONTRACT_MAX_CONTENT_LENGTH = 200_000;
