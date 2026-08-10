import { prisma } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/db";
import { getSalesInboxCounts } from "@/lib/crm/inbox/threads";

export type AdminNavBadgeCounts = {
  enquiries: number;
  inbox: number;
  support: number;
};

export async function getAdminNavBadgeCounts(): Promise<AdminNavBadgeCounts> {
  if (!hasDatabaseUrl()) {
    return { enquiries: 0, inbox: 0, support: 0 };
  }

  const [inboxCounts, supportOpen] = await Promise.all([
    getSalesInboxCounts().catch(() => ({ inboxBadge: 0 })),
    prisma.agencySupportRequest
      .count({
        where: {
          status: { in: ["OPEN", "IN_PROGRESS"] },
          waitingOn: "SMARTLANCE",
        },
      })
      .catch(() => 0),
  ]);

  return {
    enquiries: 0,
    inbox: inboxCounts.inboxBadge,
    support: supportOpen,
  };
}
