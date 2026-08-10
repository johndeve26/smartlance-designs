import { createHash } from "crypto";

export function computeAssessmentHash(input: {
  changeRequestId: string;
  versionNumber: number;
  classification: string;
  scopeImpactSummary: string | null;
  priceImpactMinor: number;
  currency: string;
  timelineImpactDays: number;
}) {
  const payload = JSON.stringify({
    changeRequestId: input.changeRequestId,
    versionNumber: input.versionNumber,
    classification: input.classification,
    scopeImpactSummary: input.scopeImpactSummary ?? "",
    priceImpactMinor: input.priceImpactMinor,
    currency: input.currency,
    timelineImpactDays: input.timelineImpactDays,
  });
  return createHash("sha256").update(payload).digest("hex");
}
