import type { CrmContactEmailStatus, CrmSequenceStopReason, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import { BLOCKED_EMAIL_STATUSES } from "@/lib/crm/constants";
import { recordCrmActivity } from "@/lib/crm/activities";
import { ENROLLMENT_BATCH_MAX } from "@/lib/crm/sequences/constants";

export function isEmailSuppressed(status: CrmContactEmailStatus) {
  return BLOCKED_EMAIL_STATUSES.includes(status);
}

export async function stopActiveEnrollmentsForContact(
  input: {
    contactId: string;
    reason: CrmSequenceStopReason;
    note?: string;
    actorId?: string | null;
  },
  db: Pick<PrismaClient, "crmSequenceEnrollment" | "crmActivity"> = prisma,
) {
  const active = await db.crmSequenceEnrollment.findMany({
    where: {
      contactId: input.contactId,
      status: { in: ["ACTIVE", "PAUSED"] },
    },
  });

  for (const e of active) {
    await db.crmSequenceEnrollment.update({
      where: { id: e.id },
      data: {
        status: "STOPPED",
        stoppedAt: new Date(),
        stopReason: input.reason,
        stopNote: input.note ?? null,
        nextRunAt: null,
      },
    });

    await recordCrmActivity({
      contactId: input.contactId,
      type: "SEQUENCE_STOPPED",
      subject: "Sequence stopped",
      metadata: {
        enrollmentId: e.id,
        reason: input.reason,
      },
      createdById: input.actorId ?? null,
    }, db);
  }

  return active.length;
}

export async function pauseOutreachForContact(input: {
  contactId: string;
  actorId: string;
}) {
  await prisma.crmContact.update({
    where: { id: input.contactId },
    data: { outreachPaused: true, outreachPausedAt: new Date() },
  });

  const enrollments = await prisma.crmSequenceEnrollment.updateMany({
    where: {
      contactId: input.contactId,
      status: "ACTIVE",
    },
    data: {
      status: "PAUSED",
      pausedAt: new Date(),
      nextRunAt: null,
    },
  });

  await recordCrmActivity({
    contactId: input.contactId,
    type: "SEQUENCE_PAUSED",
    subject: "Outreach paused",
    createdById: input.actorId,
  });

  return enrollments.count;
}

export async function resumeOutreachForContact(input: {
  contactId: string;
  actorId: string;
}) {
  const contact = await prisma.crmContact.findUniqueOrThrow({
    where: { id: input.contactId },
  });
  if (isEmailSuppressed(contact.emailStatus)) {
    throw new Error("Cannot resume outreach — contact email is suppressed.");
  }

  await prisma.crmContact.update({
    where: { id: input.contactId },
    data: { outreachPaused: false, outreachPausedAt: null },
  });

  const paused = await prisma.crmSequenceEnrollment.findMany({
    where: { contactId: input.contactId, status: "PAUSED" },
  });

  for (const e of paused) {
    await prisma.crmSequenceEnrollment.update({
      where: { id: e.id },
      data: {
        status: "ACTIVE",
        pausedAt: null,
        nextRunAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });
  }

  return paused.length;
}

export type EnrollmentEligibility = {
  contactId: string;
  eligible: boolean;
  reason?: string;
};

export async function checkEnrollmentEligibility(input: {
  contactId: string;
  sequenceId: string;
  requiresEmail?: boolean;
}): Promise<EnrollmentEligibility> {
  const contact = await prisma.crmContact.findUnique({
    where: { id: input.contactId },
  });
  if (!contact || contact.isArchived) {
    return { contactId: input.contactId, eligible: false, reason: "Contact not found or archived." };
  }
  if (contact.outreachPaused) {
    return { contactId: input.contactId, eligible: false, reason: "Outreach paused." };
  }
  if (input.requiresEmail !== false) {
    if (!contact.email?.trim()) {
      return { contactId: input.contactId, eligible: false, reason: "No email." };
    }
    if (isEmailSuppressed(contact.emailStatus)) {
      return { contactId: input.contactId, eligible: false, reason: `Suppressed (${contact.emailStatus}).` };
    }
  }

  const existing = await prisma.crmSequenceEnrollment.findFirst({
    where: {
      contactId: input.contactId,
      sequenceId: input.sequenceId,
      status: { in: ["ACTIVE", "PAUSED"] },
    },
  });
  if (existing) {
    return { contactId: input.contactId, eligible: false, reason: "Already enrolled." };
  }

  return { contactId: input.contactId, eligible: true };
}

export async function summarizeBulkEnrollment(input: {
  contactIds: string[];
  sequenceId: string;
}) {
  const ids = [...new Set(input.contactIds)].slice(0, ENROLLMENT_BATCH_MAX);
  const results = await Promise.all(
    ids.map((id) =>
      checkEnrollmentEligibility({
        contactId: id,
        sequenceId: input.sequenceId,
      }),
    ),
  );

  return {
    total: ids.length,
    eligible: results.filter((r) => r.eligible).length,
    suppressed: results.filter((r) => r.reason?.includes("Suppressed")).length,
    noEmail: results.filter((r) => r.reason === "No email.").length,
    alreadyEnrolled: results.filter((r) => r.reason === "Already enrolled.").length,
    paused: results.filter((r) => r.reason === "Outreach paused.").length,
    details: results,
  };
}

/** Called when email status changes — stop active enrollments if suppressed. */
export async function onContactEmailStatusChanged(input: {
  contactId: string;
  emailStatus: CrmContactEmailStatus;
  actorId?: string | null;
}) {
  if (!isEmailSuppressed(input.emailStatus)) return 0;
  return stopActiveEnrollmentsForContact({
    contactId: input.contactId,
    reason: "SUPPRESSED",
    note: `Email status: ${input.emailStatus}`,
    actorId: input.actorId,
  });
}

/** Stop enrollments when deal won or lead disqualified. */
export async function onDealWon(contactId: string) {
  return stopActiveEnrollmentsForContact({
    contactId,
    reason: "DEAL_WON",
    note: "Deal marked won",
  });
}

export async function onLeadInactive(contactId: string, status: string) {
  if (status === "UNQUALIFIED" || status === "CLOSED") {
    return stopActiveEnrollmentsForContact({
      contactId,
      reason: "LEAD_DISQUALIFIED",
      note: `Lead status: ${status}`,
    });
  }
  if (status === "BAD_TIMING") {
    const paused = await prisma.crmSequenceEnrollment.updateMany({
      where: { contactId, status: "ACTIVE" },
      data: { status: "PAUSED", pausedAt: new Date(), nextRunAt: null },
    });
    return paused.count;
  }
  return 0;
}

export async function onContactArchived(contactId: string) {
  return stopActiveEnrollmentsForContact({
    contactId,
    reason: "ARCHIVED",
  });
}
