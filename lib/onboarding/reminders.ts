import { prisma } from "@/lib/db";
import {
  ONBOARDING_AUTOMATIC_REMINDER_INTERVAL_DAYS,
  ONBOARDING_MAX_AUTOMATIC_REMINDERS,
} from "@/lib/onboarding/constants";
import { sendOnboardingReminderEmail } from "@/lib/onboarding/email";
import { recordOnboardingActivity } from "@/lib/onboarding/activity";
import { loadProgressContext } from "@/lib/onboarding/onboarding";

export async function runOnboardingReminderScheduler(now = new Date()) {
  const candidates = await prisma.agencyProjectOnboarding.findMany({
    where: {
      reminderMode: "AUTOMATIC",
      status: { in: ["WAITING_ON_CLIENT", "IN_PROGRESS"] },
      reminderCount: { lt: ONBOARDING_MAX_AUTOMATIC_REMINDERS },
    },
    take: 50,
    select: {
      id: true,
      projectId: true,
      reminderCount: true,
      lastReminderAt: true,
      targetCompletionDate: true,
      primaryClientContactId: true,
    },
  });

  let sent = 0;
  let skipped = 0;

  for (const onboarding of candidates) {
    const dueForReminder =
      !onboarding.lastReminderAt ||
      now.getTime() - onboarding.lastReminderAt.getTime() >=
        ONBOARDING_AUTOMATIC_REMINDER_INTERVAL_DAYS * 24 * 60 * 60 * 1000;

    const overdue =
      onboarding.targetCompletionDate != null &&
      onboarding.targetCompletionDate < now;

    if (!dueForReminder && !overdue) {
      skipped++;
      continue;
    }

    const ctx = await loadProgressContext(onboarding.id);
    const remaining =
      ctx.progress.requiredQuestionsTotal +
      ctx.progress.requiredRequirementsTotal -
      ctx.progress.requiredQuestionsComplete -
      ctx.progress.requiredRequirementsComplete;

    if (remaining <= 0) {
      skipped++;
      continue;
    }

    const dedupeKey = `auto:${onboarding.id}:${now.toISOString().slice(0, 10)}`;

    const claimed = await prisma.$transaction(async (tx) => {
      const current = await tx.agencyProjectOnboarding.findUnique({
        where: { id: onboarding.id },
        select: { status: true, reminderCount: true, reminderMode: true },
      });
      if (
        !current ||
        current.reminderMode !== "AUTOMATIC" ||
        !["WAITING_ON_CLIENT", "IN_PROGRESS"].includes(current.status) ||
        current.reminderCount >= ONBOARDING_MAX_AUTOMATIC_REMINDERS
      ) {
        return false;
      }

      try {
        await tx.agencyOnboardingReminder.create({
          data: {
            onboardingId: onboarding.id,
            recipientContactId: onboarding.primaryClientContactId,
            type: "ONBOARDING",
            dedupeKey,
            status: "PENDING",
            scheduledFor: now,
          },
        });
      } catch {
        return false;
      }

      const incremented = await tx.agencyProjectOnboarding.updateMany({
        where: {
          id: onboarding.id,
          reminderCount: { lt: ONBOARDING_MAX_AUTOMATIC_REMINDERS },
          status: { in: ["WAITING_ON_CLIENT", "IN_PROGRESS"] },
        },
        data: {
          lastReminderAt: now,
          reminderCount: { increment: 1 },
        },
      });

      return incremented.count === 1;
    });

    if (!claimed) {
      skipped++;
      continue;
    }

    try {
      await sendOnboardingReminderEmail({
        onboardingId: onboarding.id,
        remainingItems: remaining,
      });

      await prisma.agencyOnboardingReminder.update({
        where: { dedupeKey },
        data: { status: "SENT", sentAt: now, attemptCount: { increment: 1 } },
      });

      await recordOnboardingActivity({
        onboardingId: onboarding.id,
        type: "REMINDER_SENT",
        summary: "Automatic onboarding reminder sent.",
        clientVisible: false,
      });

      sent++;
    } catch {
      await prisma.agencyOnboardingReminder.update({
        where: { dedupeKey },
        data: { status: "FAILED", attemptCount: { increment: 1 } },
      });
    }
  }

  return { sent, skipped, scanned: candidates.length };
}
