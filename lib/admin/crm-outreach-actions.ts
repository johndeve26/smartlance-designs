"use server";

import { revalidatePath } from "next/cache";
import { assertSameOrigin, requireAdminUser } from "@/lib/admin/session";
import { assertCan } from "@/lib/admin/rbac";
import { writeAuditLog } from "@/lib/repositories/auditRepository";
import { z } from "zod";
import {
  createSegment,
  updateSegment,
  deleteSegment,
  exportSegmentCsv,
  previewSegmentContacts,
  countSegmentMatches,
} from "@/lib/crm/segments/service";
import { parseSegmentFilter } from "@/lib/crm/segments/filter-schema";
import {
  createSequence,
  replaceSequenceSteps,
  activateSequence,
  pauseSequence,
  previewSequenceEmail,
  sequenceStepSchema,
} from "@/lib/crm/sequences/service";
import {
  enrollContactInSequence,
  enrollContactsBulk,
  stopEnrollment,
} from "@/lib/crm/sequences/enrollment";
import {
  pauseOutreachForContact,
  resumeOutreachForContact,
  summarizeBulkEnrollment,
} from "@/lib/crm/outreach/suppression";
import { recordCrmActivity } from "@/lib/crm/activities";
import { runSequenceScheduler } from "@/lib/crm/sequences/scheduler";

function revalidateOutreach() {
  revalidatePath("/admin/crm");
  revalidatePath("/admin/crm/segments");
  revalidatePath("/admin/crm/sequences");
  revalidatePath("/admin/crm/outreach");
  revalidatePath("/admin/crm/contacts");
}

export async function saveSegmentAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");

  const filterRaw = formData.get("filterJson");
  let filter;
  try {
    filter = parseSegmentFilter(JSON.parse(String(filterRaw || "{}")));
  } catch {
    return { ok: false as const, error: "Invalid segment filter." };
  }

  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "");

  if (!name) return { ok: false as const, error: "Name required." };

  try {
    if (id) {
      await updateSegment({ id, name, description, filter });
    } else {
      await createSegment({ name, description, filter, createdById: user.id });
    }
    revalidateOutreach();
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Save failed.",
    };
  }
}

export async function previewSegmentAction(filterJson: string) {
  await assertSameOrigin();
  await requireAdminUser("view_crm");
  try {
    const filter = parseSegmentFilter(JSON.parse(filterJson));
    const [count, preview] = await Promise.all([
      countSegmentMatches(filter),
      previewSegmentContacts(filter, 1, 10),
    ]);
    return { ok: true as const, count, preview: preview.items };
  } catch {
    return { ok: false as const, error: "Invalid filter." };
  }
}

export async function exportSegmentAction(segmentId: string) {
  await assertSameOrigin();
  const user = await requireAdminUser("view_crm");
  assertCan(user.role, "export_crm");
  try {
    const csv = await exportSegmentCsv(segmentId);
    await writeAuditLog({
      actorId: user.id,
      action: "crm_segment_export",
      entityType: "CrmSegment",
      entityId: segmentId,
    });
    return { ok: true as const, csv };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Export failed.",
    };
  }
}

export async function deleteSegmentAction(formData: FormData) {
  await assertSameOrigin();
  await requireAdminUser("manage_crm");
  const id = String(formData.get("id") || "");
  if (!id) return { ok: false as const, error: "Missing id." };
  await deleteSegment(id);
  revalidateOutreach();
  return { ok: true as const };
}

export async function saveSequenceAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");

  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "");
  const stepsJson = String(formData.get("stepsJson") || "[]");

  if (!name) return { ok: false as const, error: "Name required." };

  let steps: z.infer<typeof sequenceStepSchema>[];
  try {
    steps = z.array(sequenceStepSchema).parse(JSON.parse(stepsJson));
  } catch {
    return { ok: false as const, error: "Invalid sequence steps." };
  }

  try {
    let sequenceId = id;
    if (!sequenceId) {
      const created = await createSequence({
        name,
        description,
        createdById: user.id,
      });
      sequenceId = created.id;
    }
    await replaceSequenceSteps({
      sequenceId,
      steps,
      updatedById: user.id,
    });
    revalidateOutreach();
    return { ok: true as const, id: sequenceId };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Save failed.",
    };
  }
}

export async function activateSequenceAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("send_crm_email");
  const id = String(formData.get("id") || "");
  if (!id) return { ok: false as const, error: "Missing sequence." };

  try {
    await activateSequence({ sequenceId: id, actorId: user.id });
    await writeAuditLog({
      actorId: user.id,
      action: "crm_sequence_activated",
      entityType: "CrmSequence",
      entityId: id,
    });
    revalidateOutreach();
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Activation failed.",
    };
  }
}

export async function pauseSequenceAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");
  const id = String(formData.get("id") || "");
  if (!id) return { ok: false as const, error: "Missing sequence." };
  await pauseSequence(id, user.id);
  await writeAuditLog({
    actorId: user.id,
    action: "crm_sequence_paused",
    entityType: "CrmSequence",
    entityId: id,
  });
  revalidateOutreach();
  return { ok: true as const };
}

export async function enrollContactAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("send_crm_email");
  const sequenceId = String(formData.get("sequenceId") || "");
  const contactId = String(formData.get("contactId") || "");
  if (!sequenceId || !contactId) {
    return { ok: false as const, error: "Missing sequence or contact." };
  }

  try {
    const enrollment = await enrollContactInSequence({
      sequenceId,
      contactId,
      actorId: user.id,
    });
    revalidateOutreach();
    return { ok: true as const, enrollmentId: enrollment.id };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Enrollment failed.",
    };
  }
}

export async function bulkEnrollPreviewAction(input: {
  sequenceId: string;
  contactIds: string[];
}) {
  await assertSameOrigin();
  await requireAdminUser("send_crm_email");
  return summarizeBulkEnrollment(input);
}

export async function bulkEnrollAction(input: {
  sequenceId: string;
  contactIds: string[];
}) {
  await assertSameOrigin();
  const user = await requireAdminUser("send_crm_email");
  const result = await enrollContactsBulk({
    sequenceId: input.sequenceId,
    contactIds: input.contactIds,
    actorId: user.id,
  });
  await writeAuditLog({
    actorId: user.id,
    action: "crm_bulk_enrollment",
    entityType: "CrmSequence",
    entityId: input.sequenceId,
    metadata: { enrolled: result.enrolled, failed: result.failed.length },
  });
  revalidateOutreach();
  return { ok: true as const, enrolled: result.enrolled, failed: result.failed };
}

export async function stopEnrollmentAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");
  const id = String(formData.get("enrollmentId") || "");
  if (!id) return { ok: false as const, error: "Missing enrollment." };
  await stopEnrollment({ enrollmentId: id, actorId: user.id });
  revalidateOutreach();
  return { ok: true as const };
}

export async function pauseContactOutreachAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");
  const contactId = String(formData.get("contactId") || "");
  if (!contactId) return { ok: false as const, error: "Missing contact." };
  await pauseOutreachForContact({ contactId, actorId: user.id });
  revalidatePath(`/admin/crm/contacts/${contactId}`);
  return { ok: true as const };
}

export async function resumeContactOutreachAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");
  const contactId = String(formData.get("contactId") || "");
  if (!contactId) return { ok: false as const, error: "Missing contact." };
  try {
    await resumeOutreachForContact({ contactId, actorId: user.id });
    revalidatePath(`/admin/crm/contacts/${contactId}`);
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Resume failed.",
    };
  }
}

export async function markManualReplyAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");
  const contactId = String(formData.get("contactId") || "");
  const stopSequence = formData.get("stopSequence") === "on";
  if (!contactId) return { ok: false as const, error: "Missing contact." };

  await prismaUpdateManualReply(contactId);

  await recordCrmActivity({
    contactId,
    type: "MANUAL_REPLY_RECORDED",
    subject: "Reply recorded manually",
    body: "An admin marked this contact as having replied.",
    createdById: user.id,
  });

  if (stopSequence) {
    const { stopActiveEnrollmentsForContact } = await import("@/lib/crm/outreach/suppression");
    await stopActiveEnrollmentsForContact({
      contactId,
      reason: "MANUAL_REPLY",
      actorId: user.id,
    });
  }

  revalidatePath(`/admin/crm/contacts/${contactId}`);
  return { ok: true as const };
}

async function prismaUpdateManualReply(contactId: string) {
  const { prisma } = await import("@/lib/db");
  await prisma.crmContact.update({
    where: { id: contactId },
    data: { manualRepliedAt: new Date() },
  });
}

export async function runSchedulerAction() {
  await assertSameOrigin();
  await requireAdminUser("send_crm_email");
  const result = await runSequenceScheduler();
  revalidateOutreach();
  return { ok: true as const, result };
}

export async function saveOutreachEngagementSettingsAction(input: {
  trackEmailOpens: boolean;
  trackEmailClicks: boolean;
}) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");

  const { updateOutreachSettings } = await import("@/lib/crm/outreach/settings");
  await updateOutreachSettings({
    trackEmailOpens: input.trackEmailOpens,
    trackEmailClicks: input.trackEmailClicks,
  });

  await writeAuditLog({
    actorId: user.id,
    action: "crm_engagement_tracking_updated",
    entityType: "CrmOutreachSettings",
    entityId: "outreach",
    metadata: {
      trackEmailOpens: input.trackEmailOpens,
      trackEmailClicks: input.trackEmailClicks,
    },
  });

  revalidateOutreach();
  return { ok: true as const };
}

export async function previewSequenceEmailAction(input: {
  sequenceId: string;
  stepPosition: number;
  contactId: string;
}) {
  await assertSameOrigin();
  const user = await requireAdminUser("view_crm");
  try {
    const preview = await previewSequenceEmail({
      ...input,
      senderName: user.name,
    });
    return { ok: true as const, preview };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Preview failed.",
    };
  }
}
