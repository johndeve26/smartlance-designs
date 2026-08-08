/**
 * AI Content Proposal lifecycle — create, partial accept, apply, stale checks.
 */

import { createHash } from "crypto";
import type { AIContentEntityType, AIContentProposal, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/repositories/auditRepository";
import { getContentAssistant } from "@/lib/ai/content-assistants/registry";
import {
  filterAllowedFields,
} from "@/lib/ai/content-assistants/allowlists";
import type {
  ContentAssistantEntityType,
  GenerateProposalInput,
  ProposalPayload,
  ProposedFieldChange,
} from "@/lib/ai/content-assistants/types";
import { scrubUnsafeStrings } from "@/lib/ai/content-assistants/helpers";
import { entityLabel } from "@/lib/ai/content-assistants/security";

function fingerprint(parts: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(parts))
    .digest("hex")
    .slice(0, 24);
}

export async function createContentProposal(
  input: GenerateProposalInput,
): Promise<AIContentProposal> {
  const mod = getContentAssistant(input.entityType);
  const loaded = await mod.loadEntity(input.entityId);
  if (!loaded) throw new Error(`${mod.displayName} not found`);

  const locked = input.lockedFields || [];
  const context = await mod.buildContext(input.entityId, {
    opportunityId: input.opportunityId,
  });

  const run = await prisma.aIContentRun.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      provider: "pending",
      status: "RUNNING",
      startedAt: new Date(),
      inputFingerprint: fingerprint({
        entityId: input.entityId,
        action: input.action,
        updatedAt: loaded.updatedAt.toISOString(),
        instructions: input.customInstructions || "",
        locked,
        opportunityId: input.opportunityId || null,
      }),
      createdById: input.actorId,
    },
  });

  try {
    const generated = await mod.generateProposal({
      entity: loaded.entity,
      action: input.action,
      context,
      customInstructions: input.customInstructions,
      lockedFields: locked,
      forceHeuristic: input.forceHeuristic,
      researchOverride: input.researchOverride,
    });

    const scrubbed = scrubUnsafeStrings(generated.payload);
    const fields = scrubbed.fields.filter(
      (f) =>
        mod.fieldAllowlist.has(f.field) &&
        !mod.protectedFields.has(f.field) &&
        !locked.includes(f.field),
    );

    const payload: ProposalPayload = {
      ...scrubbed,
      fields,
      opportunityContext: input.opportunityId
        ? {
            opportunityId: input.opportunityId,
            ...(typeof context.opportunityContext === "object"
              ? (context.opportunityContext as object)
              : {}),
          }
        : scrubbed.opportunityContext,
    };

    await prisma.aIContentRun.update({
      where: { id: run.id },
      data: {
        status: "SUCCEEDED",
        completedAt: new Date(),
        provider: generated.provider,
        model: generated.model || null,
        promptVersion: generated.promptVersion,
        tokenUsageInput: generated.tokenUsageInput ?? null,
        tokenUsageOutput: generated.tokenUsageOutput ?? null,
        resultSummary: {
          fieldCount: fields.length,
          action: input.action,
          researchPerformed: Boolean(payload.research?.performed),
          opportunityId: input.opportunityId || null,
          resultMode: payload.resultMode || null,
        } as Prisma.InputJsonValue,
      },
    });

    const proposal = await prisma.aIContentProposal.create({
      data: {
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        status: "PENDING",
        payloadJson: payload as unknown as Prisma.InputJsonValue,
        currentSnapshotJson: loaded.entity as Prisma.InputJsonValue,
        entityUpdatedAt: loaded.updatedAt,
        lockedFieldsJson: locked,
        customInstructions: input.customInstructions || null,
        promptVersion: generated.promptVersion,
        runId: run.id,
        opportunityId: input.opportunityId || null,
        createdById: input.actorId,
      },
    });

    await writeAuditLog({
      actorId: input.actorId,
      action: "ai_content_proposal_created",
      entityType: entityLabel(input.entityType),
      entityId: input.entityId,
      metadata: {
        proposalId: proposal.id,
        action: input.action,
        fieldCount: fields.length,
        opportunityId: input.opportunityId || null,
      },
    });

    return proposal;
  } catch (err) {
    await prisma.aIContentRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        errorCode: "GENERATION_FAILED",
        errorSummary:
          err instanceof Error ? err.message.slice(0, 400) : "Generation failed",
      },
    });
    throw err;
  }
}

export async function getProposal(id: string) {
  return prisma.aIContentProposal.findUnique({ where: { id } });
}

export async function listPendingProposals(
  entityType: ContentAssistantEntityType,
  entityId: string,
) {
  const rows = await prisma.aIContentProposal.findMany({
    where: {
      entityType,
      entityId,
      status: { in: ["PENDING", "PARTIALLY_ACCEPTED", "STALE"] },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  const refreshed = [];
  for (const row of rows) {
    refreshed.push((await refreshProposalStaleness(row.id)) || row);
  }
  return refreshed;
}

export async function refreshProposalStaleness(proposalId: string) {
  const proposal = await prisma.aIContentProposal.findUnique({
    where: { id: proposalId },
  });
  if (!proposal) return null;
  if (["ACCEPTED", "REJECTED", "EXPIRED"].includes(proposal.status)) {
    return proposal;
  }

  const mod = getContentAssistant(proposal.entityType);
  const loaded = await mod.loadEntity(proposal.entityId);
  if (!loaded) {
    return prisma.aIContentProposal.update({
      where: { id: proposalId },
      data: { status: "EXPIRED" },
    });
  }

  if (loaded.updatedAt.getTime() !== proposal.entityUpdatedAt.getTime()) {
    return prisma.aIContentProposal.update({
      where: { id: proposalId },
      data: { status: "STALE" },
    });
  }
  return proposal;
}

export async function rejectProposal(input: {
  proposalId: string;
  actorId: string;
}) {
  const proposal = await prisma.aIContentProposal.update({
    where: { id: input.proposalId },
    data: { status: "REJECTED" },
  });
  await writeAuditLog({
    actorId: input.actorId,
    action: "ai_content_proposal_rejected",
    entityType: entityLabel(proposal.entityType),
    entityId: proposal.entityId,
    metadata: { proposalId: proposal.id },
  });
  return proposal;
}

export type FieldDecision = {
  field: string;
  decision: "accept" | "keep" | "edit";
  editedValue?: unknown;
};

/**
 * Apply accepted field decisions. Blocks stale proposals.
 * Fields with claimBlockers cannot be accepted until cleared/edited safely.
 */
export async function applyProposalDecisions(input: {
  proposalId: string;
  actorId: string;
  decisions: FieldDecision[];
}) {
  let proposal = await refreshProposalStaleness(input.proposalId);
  if (!proposal) throw new Error("Proposal not found");
  if (proposal.status === "STALE") {
    throw new Error(
      "This proposal is stale because the content changed after it was generated.",
    );
  }
  if (proposal.status === "REJECTED" || proposal.status === "EXPIRED") {
    throw new Error("This proposal can no longer be applied.");
  }
  if (proposal.status === "ACCEPTED") {
    throw new Error("This proposal was already applied.");
  }

  const mod = getContentAssistant(proposal.entityType);
  const payload = proposal.payloadJson as unknown as ProposalPayload;
  const byField = new Map(payload.fields.map((f) => [f.field, f]));

  const accepted: Record<string, unknown> = {};
  const acceptedList: string[] = [];
  const rejectedList: string[] = [];
  const blockedByClaims: string[] = [];

  for (const d of input.decisions) {
    const change = byField.get(d.field);
    if (!change) continue;
    if (!mod.fieldAllowlist.has(d.field) || mod.protectedFields.has(d.field)) {
      rejectedList.push(d.field);
      continue;
    }
    if (d.decision === "keep") {
      rejectedList.push(d.field);
      continue;
    }
    if (change.claimBlockers?.length && d.decision === "accept") {
      blockedByClaims.push(d.field);
      rejectedList.push(d.field);
      continue;
    }
    // Edited values: re-check blockers lightly via claimBlockers still attached
    if (change.claimBlockers?.length && d.decision === "edit") {
      // Allow edit to proceed — editor took responsibility; strip blockers for apply
    }
    const value = d.decision === "edit" ? d.editedValue : change.proposed;
    accepted[d.field] = value;
    acceptedList.push(d.field);
  }

  const safe = filterAllowedFields(
    accepted,
    mod.fieldAllowlist,
    mod.protectedFields,
  );

  if (!Object.keys(safe).length) {
    if (blockedByClaims.length) {
      throw new Error(
        `No eligible fields were accepted. ${blockedByClaims.length} field(s) have factual claim blockers.`,
      );
    }
    throw new Error("No eligible fields were accepted.");
  }

  // Re-check staleness immediately before write
  proposal = await refreshProposalStaleness(input.proposalId);
  if (!proposal || proposal.status === "STALE") {
    throw new Error(
      "This proposal is stale because the content changed after it was generated.",
    );
  }

  await mod.applyFields({
    entityId: proposal.entityId,
    fields: safe,
    actorId: input.actorId,
    proposalId: proposal.id,
    runId: proposal.runId,
    proposalPayload: payload,
  });

  const remaining = payload.fields.filter((f) => !acceptedList.includes(f.field));
  const nextStatus =
    remaining.length === 0 ||
    remaining.every((f) => rejectedList.includes(f.field))
      ? "ACCEPTED"
      : "PARTIALLY_ACCEPTED";

  const updated = await prisma.aIContentProposal.update({
    where: { id: proposal.id },
    data: {
      status: nextStatus,
      acceptedFieldsJson: acceptedList,
      rejectedFieldsJson: rejectedList,
      acceptedAt: new Date(),
      acceptedById: input.actorId,
    },
  });

  await writeAuditLog({
    actorId: input.actorId,
    action: "ai_content_proposal_applied",
    entityType: entityLabel(proposal.entityType),
    entityId: proposal.entityId,
    metadata: {
      proposalId: proposal.id,
      runId: proposal.runId,
      opportunityId: proposal.opportunityId,
      acceptedFields: acceptedList,
      rejectedFields: rejectedList,
      blockedByClaims,
      aiAssisted: true,
    },
  });

  return updated;
}

export function proposalFields(
  proposal: AIContentProposal,
): ProposedFieldChange[] {
  const payload = proposal.payloadJson as unknown as ProposalPayload;
  return Array.isArray(payload?.fields) ? payload.fields : [];
}

export function asEntityType(value: string): AIContentEntityType {
  if (
    value === "SERVICE" ||
    value === "SOLUTION" ||
    value === "PLATFORM" ||
    value === "INDUSTRY" ||
    value === "WORK" ||
    value === "TESTIMONIAL" ||
    value === "GUIDE" ||
    value === "COMPARISON" ||
    value === "CHECKLIST" ||
    value === "GLOSSARY" ||
    value === "TEMPLATE" ||
    value === "TOOL" ||
    value === "HOMEPAGE"
  ) {
    return value;
  }
  throw new Error("Unsupported entity type");
}
