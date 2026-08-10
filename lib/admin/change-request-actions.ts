"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { assertSameOrigin, requireAdminUser } from "@/lib/admin/session";
import { writeAuditLog } from "@/lib/repositories/auditRepository";
import {
  beginAssessment,
  cancelChangeRequest,
  createChangeRequest,
  markChangeRequestImplemented,
  requestClarification,
  saveAssessment,
  sendForClientApproval,
  upsertWorkItems,
  approveInScopeChange,
} from "@/lib/change-requests/change-requests";
import { applyChangeRequestToProject } from "@/lib/change-requests/apply";
import { createChangeRequestInvoice } from "@/lib/change-requests/invoices";

function revalidateChangeRequest(changeRequestId: string, projectId?: string) {
  revalidatePath("/admin/agency/change-requests");
  revalidatePath(`/admin/agency/change-requests/${changeRequestId}`);
  if (projectId) {
    revalidatePath(`/admin/agency/projects/${projectId}`);
    revalidatePath(`/portal/projects/${projectId}/changes`);
    revalidatePath(`/portal/projects/${projectId}/changes/${changeRequestId}`);
  }
  revalidatePath("/portal");
}

const createSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1).max(200),
  requestDescription: z.string().min(1).max(10000),
  requestedByContactId: z.string().optional(),
  ownerId: z.string().optional(),
  submit: z.coerce.boolean().optional(),
});

export async function createChangeRequestAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_change_requests");
  const parsed = createSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) throw new Error(parsed.error.message);

  try {
    const cr = await createChangeRequest({
      projectId: parsed.data.projectId,
      title: parsed.data.title,
      requestDescription: parsed.data.requestDescription,
      origin: "ADMIN",
      createdById: user.id,
      ownerId: parsed.data.ownerId ?? user.id,
      requestedByAdminUserId: user.id,
      requestedByContactId: parsed.data.requestedByContactId ?? null,
      submit: parsed.data.submit ?? true,
    });

    await writeAuditLog({
      actorId: user.id,
      action: "agency.change_request.create",
      entityType: "AgencyChangeRequest",
      entityId: cr.id,
      metadata: { projectId: parsed.data.projectId },
    });

    revalidateChangeRequest(cr.id, parsed.data.projectId);
    redirect(`/admin/agency/change-requests/${cr.id}`);
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : "Failed to create change request.");
  }
}

const assessmentSchema = z.object({
  changeRequestId: z.string().min(1),
  classification: z.enum(["IN_SCOPE", "OUT_OF_SCOPE"]),
  scopeImpactSummary: z.string().optional(),
  clientScopeImpactSummary: z.string().optional(),
  timelineImpactDays: z.coerce.number().int().min(0).optional(),
  timelineImpactSummary: z.string().optional(),
  priceImpactMinor: z.coerce.number().int().min(0).optional(),
  implementationSummary: z.string().optional(),
  requirePaymentBeforeImplementation: z.coerce.boolean().optional(),
  contractAmendmentRecommended: z.coerce.boolean().optional(),
  expectedUpdatedAt: z.string().optional(),
});

export async function beginAssessmentAction(changeRequestId: string) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_change_requests");
  try {
    await beginAssessment({ changeRequestId, actorUserId: user.id });
    revalidateChangeRequest(changeRequestId);
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Failed." };
  }
}

export async function saveAssessmentAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_change_requests");
  const parsed = assessmentSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false as const, error: parsed.error.message };

  try {
    await saveAssessment({
      ...parsed.data,
      actorUserId: user.id,
      expectedUpdatedAt: parsed.data.expectedUpdatedAt
        ? new Date(parsed.data.expectedUpdatedAt)
        : undefined,
    });
    revalidateChangeRequest(parsed.data.changeRequestId);
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Failed." };
  }
}

export async function approveInScopeAction(changeRequestId: string) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_change_requests");
  try {
    await approveInScopeChange({ changeRequestId, actorUserId: user.id });
    revalidateChangeRequest(changeRequestId);
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Failed." };
  }
}

export async function sendForApprovalAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_change_requests");
  const changeRequestId = String(formData.get("changeRequestId") ?? "");
  const approverContactIds = formData.getAll("approverContactIds").map(String).filter(Boolean);
  const expectedUpdatedAt = formData.get("expectedUpdatedAt");
  if (!changeRequestId) return { ok: false as const, error: "Missing change request." };

  try {
    await sendForClientApproval({
      changeRequestId,
      actorUserId: user.id,
      approverContactIds,
      expectedUpdatedAt: expectedUpdatedAt ? new Date(String(expectedUpdatedAt)) : undefined,
    });
    revalidateChangeRequest(changeRequestId);
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Failed." };
  }
}

export async function requestClarificationAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_change_requests");
  const changeRequestId = String(formData.get("changeRequestId") ?? "");
  const message = String(formData.get("message") ?? "");
  if (!changeRequestId || !message.trim()) {
    return { ok: false as const, error: "Message required." };
  }

  try {
    await requestClarification({ changeRequestId, message, actorUserId: user.id });
    revalidateChangeRequest(changeRequestId);
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Failed." };
  }
}

export async function saveWorkItemsAction(formData: FormData) {
  await assertSameOrigin();
  await requireAdminUser("manage_change_requests");
  const changeRequestId = String(formData.get("changeRequestId") ?? "");
  const raw = String(formData.get("itemsJson") ?? "[]");
  if (!changeRequestId) return { ok: false as const, error: "Missing change request." };

  try {
    const items = JSON.parse(raw) as Array<{
      type: "TASK" | "DELIVERABLE" | "REQUIREMENT";
      title: string;
      description?: string;
      clientVisible?: boolean;
    }>;
    await upsertWorkItems({ changeRequestId, items });
    revalidateChangeRequest(changeRequestId);
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Failed." };
  }
}

export async function applyChangeRequestAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_change_requests");
  const changeRequestId = String(formData.get("changeRequestId") ?? "");
  const milestoneId = String(formData.get("milestoneId") ?? "") || null;
  const applyTargetDate = formData.get("applyTargetDate") === "on";
  if (!changeRequestId) return { ok: false as const, error: "Missing change request." };

  try {
    await applyChangeRequestToProject({
      changeRequestId,
      appliedById: user.id,
      milestoneId,
      applyTargetDate,
    });
    revalidateChangeRequest(changeRequestId);
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Failed." };
  }
}

export async function createChangeInvoiceAction(changeRequestId: string) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_billing");
  try {
    const invoice = await createChangeRequestInvoice({
      changeRequestId,
      createdById: user.id,
    });
    revalidateChangeRequest(changeRequestId);
    revalidatePath(`/admin/agency/invoices/${invoice.id}`);
    return { ok: true as const, invoiceId: invoice.id };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Failed." };
  }
}

export async function markImplementedAction(changeRequestId: string) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_change_requests");
  try {
    await markChangeRequestImplemented({ changeRequestId, actorUserId: user.id });
    revalidateChangeRequest(changeRequestId);
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Failed." };
  }
}

export async function cancelChangeRequestAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_change_requests");
  const changeRequestId = String(formData.get("changeRequestId") ?? "");
  const reason = String(formData.get("reason") ?? "") || null;
  if (!changeRequestId) return { ok: false as const, error: "Missing change request." };

  try {
    await cancelChangeRequest({ changeRequestId, actorUserId: user.id, reason });
    revalidateChangeRequest(changeRequestId);
    return { ok: true as const };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : "Failed." };
  }
}
