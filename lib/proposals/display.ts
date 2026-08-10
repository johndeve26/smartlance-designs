import type { AgencyProposalStatus } from "@prisma/client";

export function proposalStatusTone(status: AgencyProposalStatus) {
  switch (status) {
    case "ACCEPTED":
      return "success" as const;
    case "DECLINED":
    case "EXPIRED":
      return "danger" as const;
    case "CHANGES_REQUESTED":
    case "INTERNAL_REVIEW":
      return "warning" as const;
    case "SENT":
      return "neutral" as const;
    default:
      return "neutral" as const;
  }
}

export function formatProposalVersionLabel(versionNumber: number) {
  return `V${versionNumber}`;
}

export function isProposalExpired(expiresAt: Date | null | undefined): boolean {
  if (!expiresAt) return false;
  return expiresAt.getTime() < Date.now();
}
