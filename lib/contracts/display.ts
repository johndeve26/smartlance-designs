import type { AgencyContractStatus } from "@prisma/client";

export function contractStatusTone(status: AgencyContractStatus) {
  switch (status) {
    case "SIGNED":
      return "success" as const;
    case "DECLINED":
    case "EXPIRED":
    case "VOIDED":
      return "danger" as const;
    case "PARTIALLY_SIGNED":
    case "CORRECTION_REQUESTED":
    case "READY_FOR_REVIEW":
      return "warning" as const;
    default:
      return "neutral" as const;
  }
}

export function isContractExpired(expiresAt: Date | null | undefined) {
  if (!expiresAt) return false;
  return expiresAt.getTime() < Date.now();
}

export function formatContractVersionLabel(versionNumber: number) {
  return `V${versionNumber}`;
}
