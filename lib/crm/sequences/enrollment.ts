import { prisma } from "@/lib/db";
import { recordCrmActivity } from "@/lib/crm/activities";
import { findActiveLeadForContact } from "@/lib/crm/leads";
import {
  checkEnrollmentEligibility,
} from "@/lib/crm/outreach/suppression";
import { ENROLLMENT_BATCH_MAX } from "@/lib/crm/sequences/constants";
import { getOutreachSettings } from "@/lib/crm/outreach/settings";

export async function enrollContactInSequence(input: {
  sequenceId: string;
  contactId: string;
  actorId: string;
}) {
  const sequence = await prisma.crmSequence.findUniqueOrThrow({
    where: { id: input.sequenceId },
    include: { steps: { orderBy: { position: "asc" } } },
  });

  if (sequence.status !== "ACTIVE") {
    throw new Error("Sequence must be active to enroll contacts.");
  }
  if (!sequence.steps.length) {
    throw new Error("Sequence has no steps.");
  }

  const hasEmailStep = sequence.steps.some((s) => s.type === "EMAIL");
  const eligibility = await checkEnrollmentEligibility({
    contactId: input.contactId,
    sequenceId: input.sequenceId,
    requiresEmail: hasEmailStep,
  });
  if (!eligibility.eligible) {
    throw new Error(eligibility.reason ?? "Contact not eligible.");
  }

  const lead = await findActiveLeadForContact(input.contactId);
  const settings = await getOutreachSettings();

  const firstStep = sequence.steps[0]!;
  const nextRunAt = computeNextRunAt(firstStep.delayDays, firstStep.delayMinutes, settings);

  const enrollment = await prisma.crmSequenceEnrollment.create({
    data: {
      sequenceId: sequence.id,
      sequenceVersion: sequence.version,
      contactId: input.contactId,
      leadId: lead?.id ?? null,
      status: "ACTIVE",
      currentStep: 0,
      nextRunAt,
      createdById: input.actorId,
    },
  });

  await scheduleExecutionForStep({
    enrollmentId: enrollment.id,
    step: firstStep,
    scheduledAt: nextRunAt,
  });

  await recordCrmActivity({
    contactId: input.contactId,
    leadId: lead?.id,
    type: "SEQUENCE_ENROLLED",
    subject: `Enrolled in sequence: ${sequence.name}`,
    metadata: {
      enrollmentId: enrollment.id,
      sequenceId: sequence.id,
    },
    createdById: input.actorId,
  });

  return enrollment;
}

export async function enrollContactsBulk(input: {
  sequenceId: string;
  contactIds: string[];
  actorId: string;
}) {
  const ids = [...new Set(input.contactIds)].slice(0, ENROLLMENT_BATCH_MAX);
  const enrolled: string[] = [];
  const failed: Array<{ contactId: string; error: string }> = [];

  for (const contactId of ids) {
    try {
      const e = await enrollContactInSequence({
        sequenceId: input.sequenceId,
        contactId,
        actorId: input.actorId,
      });
      enrolled.push(e.id);
    } catch (err) {
      failed.push({
        contactId,
        error: err instanceof Error ? err.message : "Enrollment failed.",
      });
    }
  }

  return { enrolled: enrolled.length, failed };
}

export async function stopEnrollment(input: {
  enrollmentId: string;
  actorId: string;
  note?: string;
}) {
  const enrollment = await prisma.crmSequenceEnrollment.update({
    where: { id: input.enrollmentId },
    data: {
      status: "STOPPED",
      stoppedAt: new Date(),
      stopReason: "MANUAL",
      stopNote: input.note ?? null,
      nextRunAt: null,
    },
  });

  await recordCrmActivity({
    contactId: enrollment.contactId,
    type: "SEQUENCE_STOPPED",
    subject: "Sequence stopped manually",
    metadata: { enrollmentId: enrollment.id },
    createdById: input.actorId,
  });

  return enrollment;
}

export async function listEnrollments(input: {
  sequenceId?: string;
  contactId?: string;
  status?: "ACTIVE" | "PAUSED" | "COMPLETED" | "STOPPED" | "FAILED";
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(input.pageSize ?? 25, 100);
  const where = {
    ...(input.sequenceId ? { sequenceId: input.sequenceId } : {}),
    ...(input.contactId ? { contactId: input.contactId } : {}),
    ...(input.status ? { status: input.status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.crmSequenceEnrollment.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            email: true,
          },
        },
        sequence: { select: { id: true, name: true } },
      },
    }),
    prisma.crmSequenceEnrollment.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

async function scheduleExecutionForStep(input: {
  enrollmentId: string;
  step: {
    id: string;
    type: string;
    subject: string | null;
    body: string | null;
  };
  scheduledAt: Date;
}) {
  await prisma.crmSequenceExecution.upsert({
    where: {
      enrollmentId_stepId: {
        enrollmentId: input.enrollmentId,
        stepId: input.step.id,
      },
    },
    create: {
      enrollmentId: input.enrollmentId,
      stepId: input.step.id,
      status: "PENDING",
      scheduledAt: input.scheduledAt,
      subjectSnap: input.step.subject,
      bodySnap: input.step.body,
    },
    update: {},
  });
}

function computeNextRunAt(
  delayDays: number,
  delayMinutes: number,
  settings: Awaited<ReturnType<typeof getOutreachSettings>>,
) {
  const now = new Date();
  const ms =
    delayDays * 24 * 60 * 60 * 1000 +
    Math.max(delayMinutes, settings.minStepDelayMinutes) * 60 * 1000;
  let target = new Date(now.getTime() + ms);

  if (settings.sendWeekdaysOnly) {
    while (target.getUTCDay() === 0 || target.getUTCDay() === 6) {
      target = new Date(target.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  const hour = target.getUTCHours();
  if (hour < settings.sendWindowStartUtc) {
    target.setUTCHours(settings.sendWindowStartUtc, 0, 0, 0);
  } else if (hour >= settings.sendWindowEndUtc) {
    target.setUTCDate(target.getUTCDate() + 1);
    target.setUTCHours(settings.sendWindowStartUtc, 0, 0, 0);
  }

  return target;
}

export { computeNextRunAt, scheduleExecutionForStep };
