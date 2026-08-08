"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertSameOrigin, requireAdminUser } from "@/lib/admin/session";
import {
  applyProposalDecisions,
  createContentProposal,
  rejectProposal,
  type FieldDecision,
} from "@/lib/ai/content-assistants/proposals";
import { assertCanUseContentAssistant } from "@/lib/ai/content-assistants/security";
import { getContentAssistant } from "@/lib/ai/content-assistants/registry";
import type { ContentAssistantEntityType } from "@/lib/ai/content-assistants/types";
import { resourceEditorPath } from "@/lib/ai/content-assistants/resource-kinds";
import { getAIProviderStatus } from "@/lib/ai/providers";

function parseEntityType(value: FormDataEntryValue | null): ContentAssistantEntityType {
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

function editorPath(entityType: ContentAssistantEntityType, entityId: string) {
  const resourcePath = resourceEditorPath(entityType, entityId);
  if (resourcePath) return resourcePath;
  switch (entityType) {
    case "SERVICE":
      return `/admin/services/${entityId}`;
    case "SOLUTION":
      return `/admin/solutions/${entityId}`;
    case "PLATFORM":
      return `/admin/platforms/${entityId}`;
    case "INDUSTRY":
      return `/admin/industries/${entityId}`;
    case "WORK":
      return `/admin/work/${entityId}`;
    case "TESTIMONIAL":
      return `/admin/testimonials/${entityId}`;
    case "HOMEPAGE":
      return "/admin/homepage";
    default:
      return "/admin";
  }
}

/** Editors may hand-edit a proposed value, so only the envelope is constrained. */
const fieldDecisionsSchema = z
  .array(
    z.object({
      field: z.string().min(1).max(120),
      decision: z.enum(["accept", "keep", "edit"]),
      editedValue: z.unknown().optional(),
    }),
  )
  .max(200);

export async function generateContentProposalAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("use_ai_writer");
  assertCanUseContentAssistant(user.role);

  const entityType = parseEntityType(formData.get("entityType"));
  const entityId = String(formData.get("entityId") || "");
  const action = String(formData.get("action") || "");
  const customInstructions = String(formData.get("customInstructions") || "").trim();
  const lockedRaw = String(formData.get("lockedFields") || "");
  const lockedFields = lockedRaw
    ? lockedRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const opportunityId = String(formData.get("opportunityId") || "").trim() || undefined;

  if (!entityId || !action) {
    throw new Error("Missing entity or action");
  }

  const mod = getContentAssistant(entityType);
  const loaded = await mod.loadEntity(entityId);
  if (!loaded) throw new Error(`${mod.displayName} not found`);

  const forceHeuristic = formData.get("forceHeuristic") === "1";

  await createContentProposal({
    entityType,
    entityId,
    action,
    actorId: user.id,
    customInstructions: customInstructions || undefined,
    lockedFields,
    forceHeuristic,
    opportunityId,
  });

  revalidatePath(editorPath(entityType, entityId));
}

export async function applyContentProposalAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("use_ai_writer");
  assertCanUseContentAssistant(user.role);

  const proposalId = String(formData.get("proposalId") || "");
  const entityType = parseEntityType(formData.get("entityType"));
  const entityId = String(formData.get("entityId") || "");
  const decisionsJson = String(formData.get("decisionsJson") || "[]");

  let raw: unknown;
  try {
    raw = JSON.parse(decisionsJson);
  } catch {
    throw new Error("Invalid field decisions");
  }
  const parsed = fieldDecisionsSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("Invalid field decisions");
  }
  const decisions = parsed.data as FieldDecision[];

  await applyProposalDecisions({
    proposalId,
    actorId: user.id,
    decisions,
  });

  revalidatePath(editorPath(entityType, entityId));
}

export async function rejectContentProposalAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("use_ai_writer");
  assertCanUseContentAssistant(user.role);

  const proposalId = String(formData.get("proposalId") || "");
  const entityType = parseEntityType(formData.get("entityType"));
  const entityId = String(formData.get("entityId") || "");

  await rejectProposal({ proposalId, actorId: user.id });
  revalidatePath(editorPath(entityType, entityId));
}

export async function getContentAssistantProviderReady(): Promise<boolean> {
  const status = await getAIProviderStatus();
  return status.configured;
}
