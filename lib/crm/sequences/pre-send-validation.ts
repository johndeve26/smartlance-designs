import type { PrismaClient } from "@prisma/client";
import { INACTIVE_LEAD_STATUSES } from "@/lib/crm/constants";
import { isEmailSuppressed } from "@/lib/crm/outreach/suppression";
import type { getOutreachSettings } from "@/lib/crm/outreach/settings";

export type PreSendAction = "PROCEED" | "SKIP" | "DEFER" | "STOP";

export type PreSendValidationResult =
  | { action: "PROCEED" }
  | {
      action: Exclude<PreSendAction, "PROCEED">;
      reason: string;
      deferUntil?: Date;
      stopReason?: "SUPPRESSED" | "ARCHIVED" | "LEAD_DISQUALIFIED" | "DEAL_WON" | "OUTREACH_PAUSED";
    };

type Db = Pick<
  PrismaClient,
  | "crmContact"
  | "crmSequenceEnrollment"
  | "crmSequence"
  | "crmLead"
  | "crmDeal"
  | "crmEmail"
  | "crmOutreachSettings"
>;

export async function validateBeforeTransportSend(input: {
  db: Db;
  enrollmentId: string;
  contactId: string;
  sequenceId: string;
  settings: Awaited<ReturnType<typeof getOutreachSettings>>;
  now: Date;
}): Promise<PreSendValidationResult> {
  const settingsRow = await input.db.crmOutreachSettings.findUnique({
    where: { id: "outreach" },
  });
  if (settingsRow?.outreachPaused) {
    return { action: "DEFER", reason: "Global outreach paused" };
  }

  const enrollment = await input.db.crmSequenceEnrollment.findUnique({
    where: { id: input.enrollmentId },
    select: { status: true, leadId: true },
  });
  if (!enrollment || enrollment.status !== "ACTIVE") {
    return {
      action: "SKIP",
      reason: `Enrollment not active (${enrollment?.status ?? "missing"})`,
    };
  }

  if (enrollment.leadId) {
    const lead = await input.db.crmLead.findUnique({
      where: { id: enrollment.leadId },
      select: { status: true },
    });
    if (lead && INACTIVE_LEAD_STATUSES.includes(lead.status)) {
      return {
        action: "STOP",
        reason: `Lead inactive: ${lead.status}`,
        stopReason: "LEAD_DISQUALIFIED",
      };
    }
  }

  const sequence = await input.db.crmSequence.findUnique({
    where: { id: input.sequenceId },
    select: { status: true },
  });
  if (!sequence || sequence.status !== "ACTIVE") {
    return {
      action: "SKIP",
      reason: `Sequence not active (${sequence?.status ?? "missing"})`,
    };
  }

  const contact = await input.db.crmContact.findUnique({
    where: { id: input.contactId },
    select: {
      isArchived: true,
      outreachPaused: true,
      emailStatus: true,
      email: true,
    },
  });
  if (!contact) {
    return { action: "SKIP", reason: "Contact not found" };
  }
  if (contact.isArchived) {
    return { action: "STOP", reason: "Contact archived", stopReason: "ARCHIVED" };
  }
  if (contact.outreachPaused) {
    return { action: "STOP", reason: "Outreach paused", stopReason: "OUTREACH_PAUSED" };
  }
  if (isEmailSuppressed(contact.emailStatus)) {
    return { action: "STOP", reason: `Suppressed: ${contact.emailStatus}`, stopReason: "SUPPRESSED" };
  }
  if (!contact.email?.trim()) {
    return { action: "SKIP", reason: "No email address" };
  }

  const wonDeal = await input.db.crmDeal.findFirst({
    where: {
      contactId: input.contactId,
      isArchived: false,
      stage: "WON",
    },
    select: { id: true },
  });
  if (wonDeal) {
    return { action: "STOP", reason: "Deal won", stopReason: "DEAL_WON" };
  }

  const windowCheck = isWithinSendWindow(input.now, input.settings);
  if (!windowCheck.ok) {
    return {
      action: "DEFER",
      reason: "Outside send window",
      deferUntil: windowCheck.nextWindow,
    };
  }

  const todayStart = new Date(input.now);
  todayStart.setUTCHours(0, 0, 0, 0);
  const sentToday = await input.db.crmEmail.count({
    where: {
      origin: "SEQUENCE",
      deliveryStatus: { in: ["SENT", "SENDING", "SENT_UNCONFIRMED"] },
      createdAt: { gte: todayStart },
    },
  });
  if (sentToday >= input.settings.maxDailySequenceEmails) {
    return { action: "DEFER", reason: "Daily send limit reached" };
  }

  const gapMs = input.settings.minContactEmailGapHours * 60 * 60 * 1000;
  const recentEmail = await input.db.crmEmail.findFirst({
    where: {
      contactId: input.contactId,
      origin: "SEQUENCE",
      deliveryStatus: { in: ["SENT", "SENDING", "SENT_UNCONFIRMED"] },
      OR: [
        { sentAt: { gte: new Date(input.now.getTime() - gapMs) } },
        {
          sentAt: null,
          createdAt: { gte: new Date(input.now.getTime() - gapMs) },
        },
      ],
    },
    orderBy: { createdAt: "desc" },
  });
  if (recentEmail) {
    const anchor = recentEmail.sentAt ?? recentEmail.createdAt;
    const deferUntil = new Date(anchor.getTime() + gapMs);
    return {
      action: "DEFER",
      reason: "Per-contact frequency guard",
      deferUntil,
    };
  }

  return { action: "PROCEED" };
}

function isWithinSendWindow(
  now: Date,
  settings: Awaited<ReturnType<typeof getOutreachSettings>>,
): { ok: true } | { ok: false; nextWindow: Date } {
  if (settings.sendWeekdaysOnly) {
    const day = now.getUTCDay();
    if (day === 0 || day === 6) {
      const next = new Date(now);
      const daysUntilMonday = day === 0 ? 1 : 2;
      next.setUTCDate(next.getUTCDate() + daysUntilMonday);
      next.setUTCHours(settings.sendWindowStartUtc, 0, 0, 0);
      return { ok: false, nextWindow: next };
    }
  }

  const hour = now.getUTCHours();
  if (hour < settings.sendWindowStartUtc) {
    const next = new Date(now);
    next.setUTCHours(settings.sendWindowStartUtc, 0, 0, 0);
    return { ok: false, nextWindow: next };
  }
  if (hour >= settings.sendWindowEndUtc) {
    const next = new Date(now);
    next.setUTCDate(next.getUTCDate() + 1);
    next.setUTCHours(settings.sendWindowStartUtc, 0, 0, 0);
    return { ok: false, nextWindow: next };
  }

  return { ok: true };
}
