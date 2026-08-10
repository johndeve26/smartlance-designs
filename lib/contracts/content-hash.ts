import { createHash } from "node:crypto";

export function normalizeContractContent(content: string) {
  return content.replace(/\r\n/g, "\n").trim();
}

export function computeContractContentHash(input: {
  contractId: string;
  versionNumber: number;
  content: string;
  proposalAcceptanceId?: string | null;
  proposalScopeHash?: string | null;
  resolvedVariables?: Record<string, string>;
}) {
  const payload = JSON.stringify({
    contractId: input.contractId,
    versionNumber: input.versionNumber,
    content: normalizeContractContent(input.content),
    proposalAcceptanceId: input.proposalAcceptanceId ?? null,
    proposalScopeHash: input.proposalScopeHash ?? null,
    resolvedVariables: input.resolvedVariables ?? {},
  });
  return createHash("sha256").update(payload).digest("hex");
}

export function computeSignedSnapshotHash(input: {
  contentHash: string;
  signatures: Array<{ id: string; signedAt: string }>;
}) {
  const payload = JSON.stringify({
    contentHash: input.contentHash,
    signatures: [...input.signatures].sort((a, b) => a.id.localeCompare(b.id)),
  });
  return createHash("sha256").update(payload).digest("hex");
}

export function hashClientEvidence(value: string | null | undefined) {
  if (!value?.trim()) return null;
  return createHash("sha256").update(value.trim()).digest("hex");
}
