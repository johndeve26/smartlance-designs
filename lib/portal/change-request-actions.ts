"use server";

import { revalidatePath } from "next/cache";
import { assertProjectAccess } from "@/lib/portal/access";
import { getPortalUser } from "@/lib/portal/session";
import { prisma } from "@/lib/db";
import {
  approveChangeRequest,
  createChangeRequest,
  declineChangeRequest,
  respondToClarification,
  submitChangeRequest,
} from "@/lib/change-requests/change-requests";
import {
  requirePortalChangeRequest,
  requirePortalChangeRequestApprover,
} from "@/lib/portal/change-requests";

function revalidatePortalChange(projectId: string, changeRequestId?: string) {
  revalidatePath("/portal");
  revalidatePath(`/portal/projects/${projectId}`);
  revalidatePath(`/portal/projects/${projectId}/changes`);
  if (changeRequestId) {
    revalidatePath(`/portal/projects/${projectId}/changes/${changeRequestId}`);
  }
}

export async function submitPortalChangeRequestAction(formData: FormData) {
  const user = await getPortalUser();
  if (!user) throw new Error("Not authenticated.");

  const projectId = String(formData.get("projectId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const requestDescription = String(formData.get("requestDescription") ?? "").trim();
  if (!projectId || !title || !requestDescription) {
    return { ok: false as const, error: "Title and description are required." };
  }

  await assertProjectAccess({ projectId, portalUserId: user.id });

  const project = await prisma.agencyProject.findUniqueOrThrow({
    where: { id: projectId },
    select: { ownerId: true },
  });

  try {
    const cr = await createChangeRequest({
      projectId,
      title,
      requestDescription,
      origin: "CLIENT",
      createdById: project.ownerId,
      requestedByPortalUserId: user.id,
      requestedByContactId: user.contactId,
      submit: true,
    });

    revalidatePortalChange(projectId, cr.id);
    return { ok: true as const, changeRequestId: cr.id };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Failed to submit change request.",
    };
  }
}

export async function respondToClarificationAction(formData: FormData) {
  const changeRequestId = String(formData.get("changeRequestId") ?? "");
  const message = String(formData.get("message") ?? "").trim();
  if (!changeRequestId || !message) {
    return { ok: false as const, error: "Message required." };
  }

  const { user, projectId } = await requirePortalChangeRequest(changeRequestId);

  try {
    await respondToClarification({
      changeRequestId,
      message,
      actorPortalUserId: user.id,
    });
    revalidatePortalChange(projectId, changeRequestId);
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Failed." };
  }
}

export async function approveChangeRequestAction(changeRequestId: string) {
  const { user, projectId } = await requirePortalChangeRequestApprover(changeRequestId);

  try {
    await approveChangeRequest({ changeRequestId, portalUserId: user.id });
    revalidatePortalChange(projectId, changeRequestId);
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Failed." };
  }
}

export async function declineChangeRequestAction(formData: FormData) {
  const changeRequestId = String(formData.get("changeRequestId") ?? "");
  const comment = String(formData.get("comment") ?? "") || null;
  if (!changeRequestId) return { ok: false as const, error: "Missing change request." };

  const { user, projectId } = await requirePortalChangeRequestApprover(changeRequestId);

  try {
    await declineChangeRequest({ changeRequestId, portalUserId: user.id, comment });
    revalidatePortalChange(projectId, changeRequestId);
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Failed." };
  }
}
