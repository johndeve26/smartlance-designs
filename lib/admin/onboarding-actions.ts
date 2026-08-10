"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { assertSameOrigin, requireAdminUser } from "@/lib/admin/session";
import { writeAuditLog } from "@/lib/repositories/auditRepository";
import { prisma } from "@/lib/db";
import {
  archiveOnboardingTemplate,
  cancelOnboarding,
  completeOnboarding,
  createOnboardingTemplate,
  createOnboardingTemplateVersion,
  getOnboardingById,
  listOnboardings,
  listOnboardingTemplates,
  publishOnboardingTemplateVersion,
  reopenOnboarding,
  sendManualOnboardingReminder,
  startOnboarding,
} from "@/lib/onboarding";
import {
  addTemplateQuestion,
  addTemplateRequirement,
  addTemplateSection,
  updateOnboardingTemplateDraft,
} from "@/lib/onboarding/templates";
import { installStarterOnboardingTemplates } from "@/lib/onboarding/starter-templates";
import {
  reviewOnboardingResponse,
  reviewRequirement,
} from "@/lib/agency/requirements";

function revalidateOnboarding(onboardingId?: string, projectId?: string) {
  revalidatePath("/admin/agency/onboarding");
  revalidatePath("/admin/agency/onboarding-templates");
  if (onboardingId) revalidatePath(`/admin/agency/onboarding/${onboardingId}`);
  if (projectId) {
    revalidatePath(`/admin/agency/projects/${projectId}`);
    revalidatePath(`/portal/projects/${projectId}/onboarding`);
  }
}

const startOnboardingSchema = z.object({
  projectId: z.string().min(1),
  templateVersionId: z.string().min(1),
  ownerId: z.string().optional(),
  primaryClientContactId: z.string().optional(),
  targetCompletionDate: z.string().optional(),
  clientMessage: z.string().optional(),
  sendEmail: z.coerce.boolean().optional(),
});

export async function startOnboardingAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_onboarding");
  const parsed = startOnboardingSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false as const, error: parsed.error.message };

  try {
    const onboarding = await startOnboarding({
      projectId: parsed.data.projectId,
      templateVersionId: parsed.data.templateVersionId,
      ownerId: parsed.data.ownerId ?? user.id,
      primaryClientContactId: parsed.data.primaryClientContactId,
      targetCompletionDate: parsed.data.targetCompletionDate
        ? new Date(parsed.data.targetCompletionDate)
        : null,
      clientMessage: parsed.data.clientMessage,
      createdById: user.id,
      sendEmail: parsed.data.sendEmail ?? true,
    });

    await writeAuditLog({
      actorId: user.id,
      action: "agency.onboarding.start",
      entityType: "AgencyProjectOnboarding",
      entityId: onboarding!.id,
      metadata: { projectId: parsed.data.projectId },
    });

    revalidateOnboarding(onboarding!.id, parsed.data.projectId);
    return { ok: true as const, onboardingId: onboarding!.id };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Failed to start onboarding." };
  }
}

export async function completeOnboardingAction(onboardingId: string) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_onboarding");
  try {
    const onboarding = await completeOnboarding({ onboardingId, actorUserId: user.id });
    await writeAuditLog({
      actorId: user.id,
      action: "agency.onboarding.complete",
      entityType: "AgencyProjectOnboarding",
      entityId: onboardingId,
    });
    revalidateOnboarding(onboardingId, onboarding.projectId);
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Failed to complete onboarding." };
  }
}

export async function cancelOnboardingAction(onboardingId: string) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_onboarding");
  const onboarding = await cancelOnboarding({ onboardingId, actorUserId: user.id });
  await writeAuditLog({
    actorId: user.id,
    action: "agency.onboarding.cancel",
    entityType: "AgencyProjectOnboarding",
    entityId: onboardingId,
  });
  revalidateOnboarding(onboardingId, onboarding.projectId);
  return { ok: true as const };
}

export async function reopenOnboardingAction(onboardingId: string) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_onboarding");
  const onboarding = await reopenOnboarding({ onboardingId, actorUserId: user.id });
  await writeAuditLog({
    actorId: user.id,
    action: "agency.onboarding.reopen",
    entityType: "AgencyProjectOnboarding",
    entityId: onboardingId,
  });
  revalidateOnboarding(onboardingId, onboarding.projectId);
  return { ok: true as const };
}

export async function sendOnboardingReminderAction(onboardingId: string) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_onboarding");
  await sendManualOnboardingReminder({ onboardingId, actorUserId: user.id });
  revalidateOnboarding(onboardingId);
  return { ok: true as const };
}

export async function reviewOnboardingResponseAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_onboarding");
  const responseId = String(formData.get("responseId") ?? "");
  const decision = String(formData.get("decision") ?? "") as "ACCEPTED" | "NEEDS_CLARIFICATION";
  const reviewNote = String(formData.get("reviewNote") ?? "") || null;
  const expectedUpdatedAt = formData.get("expectedUpdatedAt")
    ? new Date(String(formData.get("expectedUpdatedAt")))
    : undefined;

  const updated = await reviewOnboardingResponse({
    responseId,
    decision,
    actorUserId: user.id,
    reviewNote,
    expectedUpdatedAt,
  });

  const onboarding = await prisma.agencyProjectOnboarding.findUnique({
    where: { id: updated.onboardingId },
    select: { projectId: true },
  });
  revalidateOnboarding(updated.onboardingId, onboarding?.projectId);
  return { ok: true as const };
}

export async function reviewRequirementAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_onboarding");
  const requirementId = String(formData.get("requirementId") ?? "");
  const decision = String(formData.get("decision") ?? "") as
    | "ACCEPTED"
    | "NEEDS_CLARIFICATION"
    | "NOT_NEEDED";
  const clientReviewNote = String(formData.get("clientReviewNote") ?? "") || null;
  const expectedUpdatedAt = formData.get("expectedUpdatedAt")
    ? new Date(String(formData.get("expectedUpdatedAt")))
    : undefined;

  const updated = await reviewRequirement({
    requirementId,
    decision,
    actorUserId: user.id,
    clientReviewNote,
    expectedUpdatedAt,
  });

  revalidateOnboarding(updated.onboardingId ?? undefined, updated.projectId);
  return { ok: true as const };
}

export async function installStarterOnboardingTemplatesAction() {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_onboarding_templates");
  const result = await installStarterOnboardingTemplates(user.id);
  revalidatePath("/admin/agency/onboarding-templates");
  return { ok: true as const, ...result };
}

export async function createOnboardingTemplateAction(formData: FormData): Promise<void> {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_onboarding_templates");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "") || null;
  const welcomeText = String(formData.get("welcomeText") ?? "") || null;
  if (!name) throw new Error("Name is required.");

  const template = await createOnboardingTemplate({
    name,
    description,
    welcomeText,
    createdById: user.id,
  });

  revalidatePath("/admin/agency/onboarding-templates");
  redirect(`/admin/agency/onboarding-templates/${template.id}`);
}

export async function updateProjectReadinessGatesAction(formData: FormData): Promise<void> {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_projects");
  const projectId = String(formData.get("projectId") ?? "");
  await prisma.agencyProject.update({
    where: { id: projectId },
    data: {
      requireOnboarding: formData.get("requireOnboarding") === "on",
      requireSignedContract: formData.get("requireSignedContract") === "on",
      requireDeposit: formData.get("requireDeposit") === "on",
      requireInternalKickoff: formData.get("requireInternalKickoff") === "on",
      internalKickoffCompletedAt:
        formData.get("internalKickoffCompleted") === "on" ? new Date() : null,
    },
  });
  await writeAuditLog({
    actorId: user.id,
    action: "agency.project.readiness_gates",
    entityType: "AgencyProject",
    entityId: projectId,
  });
  revalidatePath(`/admin/agency/projects/${projectId}`);
}

export {
  getOnboardingById,
  listOnboardings,
  listOnboardingTemplates,
  publishOnboardingTemplateVersion,
  createOnboardingTemplateVersion,
  addTemplateSection,
  addTemplateQuestion,
  addTemplateRequirement,
  updateOnboardingTemplateDraft,
  archiveOnboardingTemplate,
};
