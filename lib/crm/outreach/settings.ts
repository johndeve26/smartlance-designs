import { prisma } from "@/lib/db";

export async function getOutreachSettings() {
  let settings = await prisma.crmOutreachSettings.findUnique({
    where: { id: "outreach" },
  });
  if (!settings) {
    settings = await prisma.crmOutreachSettings.create({
      data: { id: "outreach" },
    });
  }
  return settings;
}

export async function updateOutreachSettings(input: {
  maxDailySequenceEmails?: number;
  minContactEmailGapHours?: number;
  minStepDelayMinutes?: number;
  sendWeekdaysOnly?: boolean;
  sendWindowStartUtc?: number;
  sendWindowEndUtc?: number;
  outreachFooter?: string | null;
  trackEmailOpens?: boolean;
  trackEmailClicks?: boolean;
}) {
  return prisma.crmOutreachSettings.upsert({
    where: { id: "outreach" },
    create: { id: "outreach", ...input },
    update: {
      ...input,
      ...(input.trackEmailOpens !== undefined || input.trackEmailClicks !== undefined
        ? { engagementTrackingUpdatedAt: new Date() }
        : {}),
    },
  });
}
