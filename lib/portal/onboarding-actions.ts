"use server";

import { revalidatePath } from "next/cache";
import { assertProjectAccess } from "@/lib/portal/access";
import { getPortalUser } from "@/lib/portal/session";
import {
  attachOnboardingFile,
  saveOnboardingResponse,
  submitAccessRequirement,
} from "@/lib/agency/requirements";
import { submitOnboardingForReview } from "@/lib/onboarding/onboarding";
import { prisma } from "@/lib/db";
import { ACTIVE_ONBOARDING_STATUSES } from "@/lib/onboarding/constants";

async function requirePortalOnboarding(onboardingId: string) {
  const user = await getPortalUser();
  if (!user) throw new Error("Not authenticated.");

  const onboarding = await prisma.agencyProjectOnboarding.findUniqueOrThrow({
    where: { id: onboardingId },
  });

  if (!ACTIVE_ONBOARDING_STATUSES.includes(onboarding.status)) {
    throw new Error("Onboarding is not open.");
  }

  await assertProjectAccess({ projectId: onboarding.projectId, portalUserId: user.id });
  return { user, onboarding };
}

export async function saveOnboardingResponseAction(formData: FormData) {
  const onboardingId = String(formData.get("onboardingId") ?? "");
  const questionId = String(formData.get("questionId") ?? "");
  const valueText = String(formData.get("valueText") ?? "") || null;
  const valueJsonRaw = formData.get("valueJson");
  let valueJson: unknown = undefined;
  if (typeof valueJsonRaw === "string" && valueJsonRaw.trim()) {
    valueJson = JSON.parse(valueJsonRaw);
  }

  const { user, onboarding } = await requirePortalOnboarding(onboardingId);

  await saveOnboardingResponse({
    onboardingId,
    questionId,
    portalUserId: user.id,
    contactId: user.contactId,
    valueText,
    valueJson,
  });

  revalidatePath(`/portal/projects/${onboarding.projectId}/onboarding`);
  return { ok: true as const };
}

export async function submitOnboardingAction(onboardingId: string) {
  const { user, onboarding } = await requirePortalOnboarding(onboardingId);

  await submitOnboardingForReview({
    onboardingId,
    portalUserId: user.id,
    contactId: user.contactId,
  });

  revalidatePath(`/portal/projects/${onboarding.projectId}/onboarding`);
  revalidatePath("/portal");
  return { ok: true as const };
}

export async function submitAccessRequirementAction(formData: FormData) {
  const requirementId = String(formData.get("requirementId") ?? "");
  const clientNote = String(formData.get("clientNote") ?? "") || null;

  const user = await getPortalUser();
  if (!user) throw new Error("Not authenticated.");

  const requirement = await prisma.agencyClientRequirement.findUniqueOrThrow({
    where: { id: requirementId },
  });

  await assertProjectAccess({ projectId: requirement.projectId, portalUserId: user.id });

  await submitAccessRequirement({
    requirementId,
    portalUserId: user.id,
    clientNote,
  });

  if (requirement.onboardingId) {
    const onboarding = await prisma.agencyProjectOnboarding.findUnique({
      where: { id: requirement.onboardingId },
    });
    if (onboarding) {
      revalidatePath(`/portal/projects/${onboarding.projectId}/onboarding`);
    }
  }

  return { ok: true as const };
}

export async function uploadOnboardingFileAction(formData: FormData) {
  const onboardingId = String(formData.get("onboardingId") ?? "");
  const questionId = String(formData.get("questionId") ?? "") || null;
  const requirementId = String(formData.get("requirementId") ?? "") || null;
  const file = formData.get("file");

  if (!(file instanceof File)) throw new Error("File is required.");

  const { user, onboarding } = await requirePortalOnboarding(onboardingId);
  const buffer = Buffer.from(await file.arrayBuffer());

  await attachOnboardingFile({
    onboardingId,
    projectId: onboarding.projectId,
    questionId,
    requirementId,
    portalUserId: user.id,
    filename: file.name,
    mimeType: file.type || "application/octet-stream",
    buffer,
  });

  revalidatePath(`/portal/projects/${onboarding.projectId}/onboarding`);
  return { ok: true as const };
}
