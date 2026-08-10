import { prisma } from "@/lib/db";

export async function getEngagementAnalytics() {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const outboundSent = {
    direction: "OUTBOUND" as const,
    deliveryStatus: { in: ["SENT", "SENT_UNCONFIRMED"] as ("SENT" | "SENT_UNCONFIRMED")[] },
  };

  const [
    contactsWithDetectedOpen,
    contactsWithDetectedClick,
    totalOpenDetections,
    totalClickDetections,
    possibleAutomatedClicks,
    opensToday,
    clicksToday,
  ] = await Promise.all([
    prisma.crmEmail.findMany({
      where: {
        ...outboundSent,
        openDetectedCount: { gt: 0 },
        contactId: { not: null },
      },
      distinct: ["contactId"],
      select: { contactId: true },
    }),
    prisma.crmEmail.findMany({
      where: {
        ...outboundSent,
        clickDetectedCount: { gt: 0 },
        contactId: { not: null },
      },
      distinct: ["contactId"],
      select: { contactId: true },
    }),
    prisma.crmEmailEngagementEvent.count({
      where: { type: "OPEN_DETECTED" },
    }),
    prisma.crmEmailEngagementEvent.count({
      where: { type: "LINK_CLICKED" },
    }),
    prisma.crmEmailEngagementEvent.count({
      where: {
        type: "LINK_CLICKED",
        classification: "POSSIBLE_AUTOMATED",
      },
    }),
    prisma.crmEmailEngagementEvent.count({
      where: { type: "OPEN_DETECTED", occurredAt: { gte: todayStart } },
    }),
    prisma.crmEmailEngagementEvent.count({
      where: { type: "LINK_CLICKED", occurredAt: { gte: todayStart } },
    }),
  ]);

  const sentContacts = await prisma.crmEmail.findMany({
    where: outboundSent,
    distinct: ["contactId"],
    select: { contactId: true },
  });

  const sentContactCount = sentContacts.filter((r) => r.contactId).length;
  const openContactCount = contactsWithDetectedOpen.length;
  const clickContactCount = contactsWithDetectedClick.length;

  return {
    sentContactCount,
    contactsWithDetectedOpen: openContactCount,
    contactsWithDetectedClick: clickContactCount,
    detectedOpenRate:
      sentContactCount > 0
        ? Math.round((openContactCount / sentContactCount) * 1000) / 10
        : null,
    detectedClickRate:
      sentContactCount > 0
        ? Math.round((clickContactCount / sentContactCount) * 1000) / 10
        : null,
    totalOpenDetections,
    totalClickDetections,
    possibleAutomatedClicks,
    opensToday,
    clicksToday,
  };
}

export async function getEmailEngagementDetail(emailId: string) {
  const [email, links, events] = await Promise.all([
    prisma.crmEmail.findUnique({
      where: { id: emailId },
      select: {
        id: true,
        subject: true,
        direction: true,
        openTrackingEnabled: true,
        clickTrackingEnabled: true,
        openDetectedCount: true,
        clickDetectedCount: true,
        firstOpenDetectedAt: true,
        lastOpenDetectedAt: true,
        firstClickDetectedAt: true,
        lastClickDetectedAt: true,
        likelyHumanClickCount: true,
      },
    }),
    prisma.crmTrackedLink.findMany({
      where: { crmEmailId: emailId },
      orderBy: { position: "asc" },
    }),
    prisma.crmEmailEngagementEvent.findMany({
      where: { crmEmailId: emailId },
      orderBy: { occurredAt: "desc" },
      take: 50,
    }),
  ]);

  return { email, links, events };
}
