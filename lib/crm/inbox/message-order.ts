import type { CrmEmail } from "@prisma/client";

const HUMAN_OUTBOUND_ORIGINS = new Set(["THREAD_REPLY", "MANUAL"]);

/** Canonical timestamp for workflow ordering — not thread.updatedAt. */
export function meaningfulMessageAt(email: Pick<CrmEmail, "direction" | "receivedAt" | "sentAt" | "createdAt">): Date {
  if (email.direction === "INBOUND") {
    return email.receivedAt ?? email.createdAt;
  }
  return email.sentAt ?? email.createdAt;
}

export function isHumanInbound(email: Pick<CrmEmail, "direction" | "isAutomated">): boolean {
  return email.direction === "INBOUND" && !email.isAutomated;
}

export function isConfirmedHumanOutbound(
  email: Pick<CrmEmail, "direction" | "origin" | "deliveryStatus" | "isAutomated">,
): boolean {
  return (
    email.direction === "OUTBOUND" &&
    HUMAN_OUTBOUND_ORIGINS.has(email.origin) &&
    email.deliveryStatus === "SENT"
  );
}

export function isUncertainHumanOutbound(
  email: Pick<CrmEmail, "direction" | "origin" | "deliveryStatus">,
): boolean {
  return (
    email.direction === "OUTBOUND" &&
    email.origin === "THREAD_REPLY" &&
    email.deliveryStatus === "SENT_UNCONFIRMED"
  );
}

/** Latest first. Tie-break: createdAt desc, then id desc. */
export function compareMeaningfulMessages(
  a: Pick<CrmEmail, "direction" | "receivedAt" | "sentAt" | "createdAt" | "id">,
  b: Pick<CrmEmail, "direction" | "receivedAt" | "sentAt" | "createdAt" | "id">,
): number {
  const ta = meaningfulMessageAt(a).getTime();
  const tb = meaningfulMessageAt(b).getTime();
  if (ta !== tb) return tb - ta;
  const ca = a.createdAt.getTime();
  const cb = b.createdAt.getTime();
  if (ca !== cb) return cb - ca;
  return b.id.localeCompare(a.id);
}
