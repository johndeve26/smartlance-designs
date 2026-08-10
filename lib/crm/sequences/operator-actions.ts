"use server";

import { revalidatePath } from "next/cache";
import { assertSameOrigin, requireAdminUser } from "@/lib/admin/session";
import { assertCan } from "@/lib/admin/rbac";
import { writeAuditLog } from "@/lib/repositories/auditRepository";
import { prisma } from "@/lib/db";
import { recordCrmActivity, touchLastContactedAt } from "@/lib/crm/activities";
import {
  completeExecutionRecord,
  finalizeEmailSent,
} from "@/lib/crm/sequences/execution-state";
import { getOutreachSettings } from "@/lib/crm/outreach/settings";
import {
  computeNextRunAt,
  scheduleExecutionForStep,
} from "@/lib/crm/sequences/enrollment";

export async function retryFailedExecutionAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("send_crm_email");

  const executionId = String(formData.get("executionId") || "");
  if (!executionId) return { ok: false as const, error: "Missing execution." };

  const execution = await prisma.crmSequenceExecution.findUnique({
    where: { id: executionId },
    include: { enrollment: true },
  });

  if (!execution) return { ok: false as const, error: "Execution not found." };
  if (execution.status !== "FAILED") {
    return { ok: false as const, error: "Only FAILED executions can be retried." };
  }
  if (execution.failureCategory === "AMBIGUOUS_DO_NOT_AUTO_RETRY") {
    return { ok: false as const, error: "Ambiguous executions cannot be auto-retried." };
  }

  await prisma.crmSequenceExecution.update({
    where: { id: executionId },
    data: {
      status: "PENDING",
      claimedAt: null,
      claimExpiresAt: null,
      scheduledAt: new Date(),
      failureCode: null,
      failureCategory: null,
    },
  });

  await prisma.crmSequenceEnrollment.update({
    where: { id: execution.enrollmentId },
    data: {
      status: "ACTIVE",
      nextRunAt: new Date(),
      stopReason: null,
      stopNote: null,
    },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "crm_execution_manual_retry",
    entityType: "CrmSequenceExecution",
    entityId: executionId,
  });

  revalidatePath("/admin/crm/outreach");
  return { ok: true as const };
}

export async function resolveAmbiguousExecutionAction(formData: FormData) {
  await assertSameOrigin();
  const user = await requireAdminUser("manage_crm");
  assertCan(user.role, "send_crm_email");

  const executionId = String(formData.get("executionId") || "");
  const action = String(formData.get("resolution") || "");
  if (!executionId) return { ok: false as const, error: "Missing execution." };

  const execution = await prisma.crmSequenceExecution.findUnique({
    where: { id: executionId },
    include: {
      email: true,
      enrollment: {
        include: {
          sequence: { include: { steps: { orderBy: { position: "asc" } } } },
        },
      },
      step: true,
    },
  });

  if (!execution || execution.status !== "AMBIGUOUS") {
    return { ok: false as const, error: "Execution is not ambiguous." };
  }

  if (action === "mark_sent") {
    if (execution.email) {
      await finalizeEmailSent(prisma, {
        emailId: execution.email.id,
        executionId: execution.id,
        providerMessageId: execution.email.providerMessageId,
      });
    } else {
      await completeExecutionRecord(prisma, execution.id, "SENT");
    }

    await recordCrmActivity({
      contactId: execution.enrollment.contactId,
      type: "EMAIL_SENT",
      subject: "Ambiguous send marked as sent (manual resolution)",
      metadata: { executionId, manualResolution: true },
      createdById: user.id,
    });
    await touchLastContactedAt(execution.enrollment.contactId);

    const settings = await getOutreachSettings();
    const step = execution.step;
    const nextPosition = step.position + 1;
    const nextStep = execution.enrollment.sequence.steps.find(
      (s) => s.position === nextPosition,
    );
    if (nextStep) {
      const nextRunAt = computeNextRunAt(
        nextStep.delayDays,
        nextStep.delayMinutes,
        settings,
      );
      await prisma.crmSequenceEnrollment.update({
        where: { id: execution.enrollmentId },
        data: { currentStep: nextPosition, nextRunAt, status: "ACTIVE" },
      });
      await scheduleExecutionForStep({
        enrollmentId: execution.enrollmentId,
        step: nextStep,
        scheduledAt: nextRunAt,
      });
    }

    await writeAuditLog({
      actorId: user.id,
      action: "crm_ambiguous_marked_sent",
      entityType: "CrmSequenceExecution",
      entityId: executionId,
    });

    revalidatePath("/admin/crm/outreach");
    return { ok: true as const };
  }

  return { ok: false as const, error: "Unknown resolution action." };
}
